"use client";

import { useState } from "react";
import PhotoGrid from "@/components/photos/PhotoGrid";
import { Sheet } from "@/components/ui/Sheet";
import { useAlbums } from "@/lib/albums";
import { cn } from "@/lib/cn";
import type { PhotoRow } from "@/lib/types";

function Body({ onSelect }: { onSelect: (photo: PhotoRow) => void }) {
  const { albums, photoIdsByAlbum } = useAlbums();
  const [albumId, setAlbumId] = useState<string | null>(null);
  const withPhotos = albums.filter((a) => (photoIdsByAlbum[a.id]?.length ?? 0) > 0);
  const chip = (active: boolean) => cn("h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition active:scale-95", active ? "bg-primary text-primary-on shadow-press" : "bg-tint text-tint-ink");

  return (
    <>
      {withPhotos.length > 0 && (
        <div role="group" aria-label="Filtrer par album" className="mb-2 flex gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button type="button" aria-pressed={albumId === null} className={chip(albumId === null)} onClick={() => setAlbumId(null)}>
            Toutes
          </button>
          {withPhotos.map((album) => (
            <button key={album.id} type="button" aria-pressed={albumId === album.id} className={chip(albumId === album.id)} onClick={() => setAlbumId(album.id)}>
              {album.name}
            </button>
          ))}
        </div>
      )}
      <PhotoGrid mode="send" albumId={albumId} onPick={onSelect} />
    </>
  );
}

/** « Photos de Nous » : toute la bibliothèque (défilement), ou un album. Toucher une photo l'envoie. */
export default function PhotoPicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (photo: PhotoRow) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Photos de Nous" tall>
      {open && <Body onSelect={onSelect} />}
    </Sheet>
  );
}
