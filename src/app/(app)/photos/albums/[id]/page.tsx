"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Lightbox from "@/components/Lightbox";
import AddPhotosSheet from "@/components/photos/AddPhotosSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { NoticeToast, useNotice } from "@/components/ui/Notice";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { deleteAlbum, removePhotoFromAlbum, renameAlbum, useAlbums } from "@/lib/albums";
import { cn } from "@/lib/cn";
import { getCachedSignedUrls, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { PHOTOS_BUCKET, supabase } from "@/lib/supabase";
import type { PhotoRow } from "@/lib/types";

const CHUNK = 80;

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { albums, photoIdsByAlbum, loaded, reload } = useAlbums();
  const album = albums.find((a) => a.id === id);
  const ids = useMemo(() => photoIdsByAlbum[id] ?? [], [photoIdsByAlbum, id]);

  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [photosReady, setPhotosReady] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [menu, setMenu] = useState<"menu" | "rename" | "delete" | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const { notice, show } = useNotice();

  // Les photos de l'album, dans l'ordre où elles y ont été ajoutées (la plus récente d'abord).
  const idsKey = ids.join(",");
  useEffect(() => {
    let active = true;
    (async () => {
      if (ids.length === 0) {
        setPhotos([]);
        setPhotosReady(true);
        return;
      }
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));
      const results = await Promise.all(chunks.map((chunk) => supabase.from("photos").select("*").in("id", chunk)));
      const byId = new Map(results.flatMap((r) => (r.data ?? []) as PhotoRow[]).map((p) => [p.id, p]));
      const ordered = ids.map((photoId) => byId.get(photoId)).filter((p): p is PhotoRow => !!p);
      if (!active) return;
      setPhotos(ordered);
      setPhotosReady(true);
      const map = await getCachedSignedUrls(PHOTOS_BUCKET, ordered.map((p) => p.storage_path), LONG_TTL_SECONDS);
      if (active) setUrls((prev) => ({ ...prev, ...map }));
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const contributors = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of photos) counts.set(p.sender_name, (counts.get(p.sender_name) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [photos]);

  async function handleRemove() {
    if (selectedIndex === null || !album) return;
    const photo = photos[selectedIndex];
    if (!photo) return;
    setSelectedIndex(null);
    const result = await removePhotoFromAlbum(album.id, photo.id);
    if (!result.ok) show(result.message);
    else show("Photo retirée de l'album");
    reload();
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!album || !renameValue.trim()) return;
    const result = await renameAlbum(album.id, renameValue);
    setMenu(null);
    if (!result.ok) show(result.message);
    reload();
  }

  async function handleDelete() {
    if (!album) return;
    const result = await deleteAlbum(album.id);
    if (!result.ok) {
      show(result.message);
      return;
    }
    router.push("/photos/albums");
  }

  if (loaded && !album) {
    return (
      <div className="h-full overflow-y-auto px-5 pb-6 pt-3">
        <EmptyState icon="album" title="Album introuvable" action={<Button onClick={() => router.push("/photos/albums")}>Retour aux albums</Button>}>
          Il a peut-être été supprimé.
        </EmptyState>
      </div>
    );
  }

  const selected = selectedIndex !== null ? photos[selectedIndex] ?? null : null;

  return (
    <div className="h-full overflow-y-auto px-5 pb-6">
      <div className="flex items-center justify-between pt-2">
        <Link href="/photos/albums" className="-ml-2 flex h-10 items-center gap-1 rounded-full pl-1 pr-3 text-[15px] font-semibold text-primary-ink transition active:scale-95">
          <Icon name="chevronLeft" size={20} />
          Albums
        </Link>
        <button
          type="button"
          onClick={() => {
            setRenameValue(album?.name ?? "");
            setMenu("menu");
          }}
          aria-label="Options de l'album"
          className="flex size-10 items-center justify-center rounded-full bg-surface text-muted shadow-card ring-1 ring-line transition active:scale-90"
        >
          <Icon name="more" size={20} />
        </button>
      </div>

      <header className="pb-4 pt-2">
        <h1 className="font-display text-[30px] font-bold leading-[1.1] tracking-tight">{album?.name ?? "…"}</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          {ids.length} photo{ids.length > 1 ? "s" : ""}
          {contributors.length > 0 && <span> · {contributors.map(([who, n]) => `${who} ${n}`).join(" · ")}</span>}
        </p>
      </header>

      <Button variant="soft" block onClick={() => setAdding(true)} className="mb-4">
        <Icon name="plus" size={18} strokeWidth={2.2} />
        Ajouter des photos
      </Button>

      {!photosReady ? (
        <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState icon="photo" title="Cet album est vide">
          Ajoutez des photos de votre bibliothèque, ou importez-en depuis le téléphone.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((p, i) => (
            <button key={p.id} type="button" onClick={() => setSelectedIndex(i)} className="aspect-square overflow-hidden rounded-2xl bg-tint transition active:scale-95" aria-label={`Photo de ${p.sender_name}`}>
              {urls[p.storage_path] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[p.storage_path]} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {selected && selectedIndex !== null && (
        <Lightbox
          photo={selected}
          url={urls[selected.storage_path]}
          index={selectedIndex}
          total={photos.length}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < photos.length - 1}
          onPrev={() => setSelectedIndex((i) => (i !== null ? Math.max(i - 1, 0) : i))}
          onNext={() => setSelectedIndex((i) => (i !== null ? Math.min(i + 1, photos.length - 1) : i))}
          onClose={() => setSelectedIndex(null)}
          onRemoveFromAlbum={handleRemove}
        />
      )}

      {album && (
        <AddPhotosSheet
          open={adding}
          albumId={album.id}
          alreadyIn={new Set(ids)}
          onClose={() => setAdding(false)}
          onDone={(message) => {
            show(message);
            reload();
          }}
        />
      )}

      <Sheet open={menu !== null} onClose={() => setMenu(null)} title={menu === "rename" ? "Renommer l'album" : menu === "delete" ? "Supprimer l'album ?" : "Album"}>
        {menu === "menu" && (
          <div className="space-y-1 px-1 pb-1">
            <button type="button" onClick={() => setMenu("rename")} className="flex w-full items-center gap-3.5 rounded-2xl px-3 py-3 text-left transition hover:bg-tint/50 active:scale-[0.99]">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-tint text-tint-ink">
                <Icon name="edit" size={21} />
              </span>
              <span className="font-display text-[17px] font-semibold">Renommer</span>
            </button>
            <button type="button" onClick={() => setMenu("delete")} className="flex w-full items-center gap-3.5 rounded-2xl px-3 py-3 text-left transition hover:bg-danger-soft active:scale-[0.99]">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-danger-soft text-danger">
                <Icon name="trash" size={21} />
              </span>
              <span className="font-display text-[17px] font-semibold text-danger">Supprimer l&apos;album</span>
            </button>
          </div>
        )}
        {menu === "rename" && (
          <form onSubmit={handleRename} className="space-y-3 px-3 pb-1">
            <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className={inputClass} aria-label="Nom de l'album" maxLength={60} required />
            <Button type="submit" size="lg" block disabled={!renameValue.trim()}>
              Enregistrer
            </Button>
          </form>
        )}
        {menu === "delete" && (
          <div className="space-y-3 px-3 pb-1">
            <p className="text-[15px] text-muted">L&apos;album « {album?.name} » disparaît, mais les photos restent dans votre bibliothèque.</p>
            <div className={cn("grid grid-cols-2 gap-3")}>
              <Button variant="soft" size="lg" onClick={() => setMenu(null)}>
                Annuler
              </Button>
              <Button variant="danger" size="lg" onClick={handleDelete}>
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </Sheet>
      <NoticeToast text={notice} />
    </div>
  );
}
