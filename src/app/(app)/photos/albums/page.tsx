"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NewAlbumSheet from "@/components/photos/NewAlbumSheet";
import PhotosTabs from "@/components/photos/PhotosTabs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PageHeading } from "@/components/ui/PageHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAlbums } from "@/lib/albums";
import { getCachedSignedUrls, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { PHOTOS_BUCKET, supabase } from "@/lib/supabase";
import type { PhotoRow } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function AlbumsPage() {
  const router = useRouter();
  const { albums, photoIdsByAlbum, loaded } = useAlbums();
  const [covers, setCovers] = useState<Record<string, string>>({}); // album id → URL signée de la couverture
  const [creating, setCreating] = useState(false);

  // La couverture d'un album est sa photo ajoutée le plus récemment.
  const coverKey = albums.map((a) => `${a.id}:${photoIdsByAlbum[a.id]?.[0] ?? ""}`).join("|");
  useEffect(() => {
    const coverIds = albums.map((a) => photoIdsByAlbum[a.id]?.[0]).filter((id): id is string => !!id);
    if (coverIds.length === 0) return;
    let active = true;
    (async () => {
      const { data } = await supabase.from("photos").select("*").in("id", coverIds);
      const rows = (data ?? []) as PhotoRow[];
      const signed = await getCachedSignedUrls(PHOTOS_BUCKET, rows.map((p) => p.storage_path), LONG_TTL_SECONDS);
      if (!active) return;
      const next: Record<string, string> = {};
      for (const album of albums) {
        const photo = rows.find((p) => p.id === photoIdsByAlbum[album.id]?.[0]);
        if (photo && signed[photo.storage_path]) next[album.id] = signed[photo.storage_path];
      }
      setCovers(next);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverKey]);

  return (
    <div className="h-full overflow-y-auto px-5 pb-6">
      <PageHeading
        title="Photos"
        subtitle={loaded ? (albums.length === 0 ? "Rangez vos souvenirs par album" : `${albums.length} album${albums.length > 1 ? "s" : ""}`) : undefined}
        action={
          <Button onClick={() => setCreating(true)} className="shrink-0">
            <Icon name="plus" size={18} strokeWidth={2.2} />
            Album
          </Button>
        }
      />
      <div className="mb-4 flex items-center gap-3">
        <PhotosTabs active="albums" />
      </div>

      {!loaded ? (
        <div className="grid grid-cols-2 gap-3" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-3xl" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <EmptyState icon="album" title="Aucun album pour l'instant" action={<Button onClick={() => setCreating(true)}>Créer le premier album</Button>}>
          Un week-end, un voyage, un dîner : regroupez les photos qui vont ensemble.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {albums.map((album) => {
            const count = photoIdsByAlbum[album.id]?.length ?? 0;
            return (
              <li key={album.id}>
                <Link href={`/photos/albums/${album.id}`} className="block transition active:scale-[0.97]">
                  <div className="relative aspect-square overflow-hidden rounded-3xl bg-tint text-tint-ink shadow-card ring-1 ring-line">
                    {covers[album.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={covers[album.id]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <Icon name="album" size={36} />
                      </span>
                    )}
                  </div>
                  <p className="mt-2 truncate px-1 font-display text-[16px] font-semibold">{album.name}</p>
                  <p className="px-1 text-sm text-muted">
                    {count} photo{count > 1 ? "s" : ""}
                  </p>
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setCreating(true)} aria-label="Créer un album" className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-primary/35 bg-surface-2 text-primary-ink transition active:scale-[0.97]">
              <Icon name="plus" size={28} />
              <span className="font-display text-[15px] font-semibold">Nouvel album</span>
            </button>
          </li>
        </ul>
      )}

      <NewAlbumSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(album) => {
          setCreating(false);
          router.push(`/photos/albums/${album.id}`);
        }}
      />
    </div>
  );
}
