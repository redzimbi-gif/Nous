"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { inputClass } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { addPhotosToAlbum, createAlbum, useAlbums } from "@/lib/albums";
import { useIdentity } from "@/lib/identity";

function Body({ photoIds, onDone, onClose }: { photoIds: string[]; onDone: (message: string) => void; onClose: () => void }) {
  const { name } = useIdentity();
  const { albums, photoIdsByAlbum, loaded } = useAlbums();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addTo(albumId: string, albumName: string) {
    setBusy(true);
    setError(null);
    const result = await addPhotosToAlbum(albumId, photoIds, name);
    setBusy(false);
    if (!result.ok) return setError(result.message);
    onClose();
    onDone(`${photoIds.length > 1 ? `${photoIds.length} photos ajoutées` : "Photo ajoutée"} à « ${albumName} »`);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    const { album, message } = await createAlbum(newName, name, photoIds);
    setBusy(false);
    if (!album || message) return setError(message ?? "Album non créé");
    onClose();
    onDone(`Album « ${album.name} » créé`);
  }

  return (
    <div className="px-2 pb-1">
      <ul className="space-y-1.5">
        {albums.map((album) => {
          const count = photoIdsByAlbum[album.id]?.length ?? 0;
          return (
            <li key={album.id}>
              <button type="button" disabled={busy} onClick={() => addTo(album.id, album.name)} className="flex w-full items-center gap-3 rounded-2xl bg-surface-2 px-3 py-3 text-left ring-1 ring-line transition active:scale-[0.99] disabled:opacity-60">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tint text-tint-ink">
                  <Icon name="album" size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base font-semibold">{album.name}</span>
                  <span className="block text-sm text-muted">
                    {count} photo{count > 1 ? "s" : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {loaded && albums.length === 0 && !creating && <li className="px-2 py-4 text-center text-sm text-muted">Aucun album pour l&apos;instant.</li>}
      </ul>

      {creating ? (
        <form onSubmit={create} className="mt-3 space-y-3 rounded-2xl bg-surface-2 p-3 ring-1 ring-line">
          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} placeholder="Nom de l'album (ex. Week-end à Lyon)" aria-label="Nom de l'album" maxLength={60} />
          <Button type="submit" block disabled={busy || !newName.trim()}>
            Créer l&apos;album et y ajouter
          </Button>
        </form>
      ) : (
        <Button variant="soft" block className="mt-3" onClick={() => setCreating(true)}>
          <Icon name="plus" size={18} strokeWidth={2.2} />
          Nouvel album
        </Button>
      )}
      {error && (
        <p role="alert" className="mt-3 text-center text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Choisir l'album où ranger une ou plusieurs photos (ou en créer un). */
export default function AddToAlbumSheet({ open, photoIds, onClose, onDone }: { open: boolean; photoIds: string[]; onClose: () => void; onDone: (message: string) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={photoIds.length > 1 ? `Ajouter ${photoIds.length} photos à un album` : "Ajouter à un album"}>
      {open && <Body photoIds={photoIds} onDone={onDone} onClose={onClose} />}
    </Sheet>
  );
}
