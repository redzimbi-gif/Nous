"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { getCachedSignedUrls, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { REFS_BUCKET, supabase } from "@/lib/supabase";
import type { RefRow } from "@/lib/types";

function RefGrid({ onSelect }: { onSelect: (ref: RefRow) => void }) {
  const [items, setItems] = useState<RefRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("refs")
      .select("*")
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        if (!active) return;
        if (!data) {
          setLoading(false);
          return;
        }
        setItems(data);
        setLoading(false);
        const paths = data.map((r) => r.media_path).filter(Boolean) as string[];
        if (paths.length) {
          const map = await getCachedSignedUrls(REFS_BUCKET, paths, LONG_TTL_SECONDS);
          if (active) setUrls(map);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="py-10 text-center text-sm text-muted">Chargement…</p>;
  if (items.length === 0) return <p className="py-10 text-center text-sm text-muted">Aucune réf pour l&apos;instant. Ajoute-en depuis l&apos;armoire.</p>;

  return (
    <div className="grid grid-cols-3 gap-2 px-2 pb-2">
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => onSelect(item)} className="overflow-hidden rounded-2xl bg-surface-2 text-left ring-1 ring-line transition active:scale-95">
          <div className="flex aspect-square items-center justify-center bg-tint text-tint-ink">
            {item.media_path && item.media_type === "image" && urls[item.media_path] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls[item.media_path]} alt="" className="h-full w-full object-cover" />
            ) : item.media_path && item.media_type === "video" ? (
              <Icon name="video" size={26} />
            ) : (
              <Icon name={item.media_path ? "photo" : "link"} size={26} />
            )}
          </div>
          <p className="truncate px-2 py-1.5 text-xs font-semibold">{item.title}</p>
        </button>
      ))}
    </div>
  );
}

export default function RefPicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (ref: RefRow) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Envoyer une réf">
      {open && <RefGrid onSelect={onSelect} />}
    </Sheet>
  );
}
