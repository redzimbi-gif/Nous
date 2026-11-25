"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { getCachedSignedUrls, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { PHOTOS_BUCKET, supabase } from "@/lib/supabase";
import type { PhotoRow } from "@/lib/types";

const PAGE = 60;

/**
 * Grille de photos qui se remplit au fil du défilement : toute la bibliothèque est accessible,
 * sans tout charger d'un coup. Avec `albumId`, seules les photos de cet album.
 * `select` : on coche plusieurs photos ; `send` : toucher une photo la choisit aussitôt.
 */
export default function PhotoGrid({
  albumId,
  mode,
  selectedIds,
  disabledIds,
  refreshKey = 0,
  onPick,
}: {
  albumId?: string | null;
  mode: "send" | "select";
  selectedIds?: Set<string>;
  disabledIds?: Set<string>;
  refreshKey?: number;
  onPick: (photo: PhotoRow) => void;
}) {
  const [items, setItems] = useState<PhotoRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const offset = useRef(0);
  const busy = useRef(false);
  const finished = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy.current || finished.current) return;
    busy.current = true;
    setLoading(true);
    const mine = generation.current;
    const from = offset.current;
    let rows: PhotoRow[] = [];
    let fetched = 0;

    if (albumId) {
      const { data: links } = await supabase.from("album_photos").select("photo_id").eq("album_id", albumId).order("added_at", { ascending: false }).range(from, from + PAGE - 1);
      const ids = (links ?? []).map((l) => l.photo_id as string);
      fetched = ids.length;
      if (ids.length) {
        const { data } = await supabase.from("photos").select("*").in("id", ids);
        const byId = new Map(((data ?? []) as PhotoRow[]).map((p) => [p.id, p]));
        rows = ids.map((id) => byId.get(id)).filter((p): p is PhotoRow => !!p);
      }
    } else {
      const { data } = await supabase.from("photos").select("*").order("created_at", { ascending: false }).range(from, from + PAGE - 1);
      rows = (data ?? []) as PhotoRow[];
      fetched = rows.length;
    }

    if (mine !== generation.current) return; // le filtre a changé entre-temps
    offset.current = from + fetched;
    const exhausted = fetched < PAGE;
    finished.current = exhausted;
    setItems((prev) => [...prev, ...rows]);
    setDone(exhausted);
    busy.current = false;
    setLoading(false);

    if (rows.length) {
      const map = await getCachedSignedUrls(PHOTOS_BUCKET, rows.map((r) => r.storage_path), LONG_TTL_SECONDS);
      if (mine === generation.current) setUrls((prev) => ({ ...prev, ...map }));
    }
  }, [albumId]);

  useEffect(() => {
    generation.current += 1;
    offset.current = 0;
    busy.current = false;
    finished.current = false;
    setItems([]);
    setUrls({});
    setDone(false);
    loadMore();
  }, [albumId, refreshKey, loadMore]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || done) return;
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && loadMore(), { rootMargin: "400px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, items.length, done]);

  if (done && items.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">{albumId ? "Cet album est vide pour l'instant." : "Aucune photo dans l'album pour l'instant."}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 px-2 pb-2">
        {items.map((photo) => {
          const selected = selectedIds?.has(photo.id) ?? false;
          const disabled = disabledIds?.has(photo.id) ?? false;
          return (
            <button
              key={photo.id}
              type="button"
              disabled={disabled}
              aria-pressed={mode === "select" ? selected || disabled : undefined}
              aria-label={`Photo de ${photo.sender_name}`}
              onClick={() => onPick(photo)}
              className="relative aspect-square overflow-hidden rounded-2xl bg-tint transition active:scale-95"
            >
              {urls[photo.storage_path] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[photo.storage_path]} alt="" className={cn("h-full w-full object-cover transition", disabled && "opacity-45")} />
              )}
              {mode === "select" && (
                <span className={cn("absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full ring-2 ring-white transition", selected || disabled ? "bg-primary text-primary-on" : "bg-black/25 text-transparent")}>
                  <Icon name="check" size={14} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!done && (
        <div ref={sentinel} className="py-4 text-center text-sm text-muted" aria-live="polite">
          {loading ? "Chargement…" : ""}
        </div>
      )}
    </>
  );
}
