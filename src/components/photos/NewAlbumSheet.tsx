"use client";

import { useState } from "react";
import PhotoGrid from "@/components/photos/PhotoGrid";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { createAlbum } from "@/lib/albums";
import { useIdentity } from "@/lib/identity";
import type { AlbumRow } from "@/lib/types";

function Body({ onCreated }: { onCreated: (album: AlbumRow) => void }) {
  const { name: me } = useIdentity();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    const { album, message } = await createAlbum(name, me, [...selected]);
    setBusy(false);
    if (!album) return setError(message ?? "Album non créé");
    onCreated(album);
  }

  return (
    <form onSubmit={submit} className="px-2 pb-1">
      <Field label="Nom">
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Week-end à Lyon" maxLength={60} required />
      </Field>
      <p className="mb-2 mt-5 text-sm font-semibold text-muted">Choisir des photos</p>
      <div className="-mx-2">
        <PhotoGrid
          mode="select"
          selectedIds={selected}
          onPick={(photo) =>
            setSelected((prev) => {
              const next = new Set(prev);
              if (!next.delete(photo.id)) next.add(photo.id);
              return next;
            })
          }
        />
      </div>
      <p className="mb-3 text-sm text-muted">
        {selected.size === 0 ? "Vous pourrez en ajouter plus tard, depuis Photos." : `${selected.size} photo${selected.size > 1 ? "s" : ""} choisie${selected.size > 1 ? "s" : ""}. Vous pourrez en ajouter d'autres plus tard.`}
      </p>
      {error && (
        <p role="alert" className="mb-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="sticky bottom-0 -mx-2 bg-surface px-2 pb-1 pt-2">
        <Button type="submit" size="lg" block disabled={busy || !name.trim()}>
          {busy ? "Création…" : "Créer l'album"}
        </Button>
      </div>
    </form>
  );
}

export default function NewAlbumSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (album: AlbumRow) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Nouvel album" tall>
      {open && <Body onCreated={onCreated} />}
    </Sheet>
  );
}
