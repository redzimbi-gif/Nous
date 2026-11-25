"use client";

import { useRef, useState } from "react";
import PhotoGrid from "@/components/photos/PhotoGrid";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { addPhotosToAlbum } from "@/lib/albums";
import { useIdentity } from "@/lib/identity";
import { uploadPhotos } from "@/lib/photoUpload";

function Body({ albumId, alreadyIn, onClose, onDone }: { albumId: string; alreadyIn: Set<string>; onClose: () => void; onDone: (message: string) => void }) {
  const { name } = useIdentity();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const result = await addPhotosToAlbum(albumId, [...selected], name);
    setBusy(false);
    if (!result.ok) return setError(result.message);
    onClose();
    onDone(`${selected.size} photo${selected.size > 1 ? "s" : ""} ajoutée${selected.size > 1 ? "s" : ""} à l'album`);
  }

  async function importFiles(files: FileList) {
    setBusy(true);
    setError(null);
    const { photos, errors } = await uploadPhotos(Array.from(files), name);
    const result = await addPhotosToAlbum(albumId, photos.map((p) => p.id), name);
    setBusy(false);
    if (errors.length) return setError(errors[0]);
    if (!result.ok) return setError(result.message);
    onClose();
    onDone(`${photos.length} photo${photos.length > 1 ? "s" : ""} importée${photos.length > 1 ? "s" : ""} dans l'album`);
  }

  return (
    <div className="px-2 pb-1">
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) importFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button variant="soft" block disabled={busy} onClick={() => fileInput.current?.click()} className="mb-3">
        <Icon name="upload" size={18} />
        Importer depuis le téléphone
      </Button>
      <p className="mb-2 text-sm font-semibold text-muted">Ou choisir parmi vos photos</p>
      <div className="-mx-2">
        <PhotoGrid
          mode="select"
          selectedIds={selected}
          disabledIds={alreadyIn}
          onPick={(photo) =>
            setSelected((prev) => {
              const next = new Set(prev);
              if (!next.delete(photo.id)) next.add(photo.id);
              return next;
            })
          }
        />
      </div>
      {error && (
        <p role="alert" className="mb-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="sticky bottom-0 -mx-2 bg-surface px-2 pb-1 pt-2">
        <Button size="lg" block disabled={busy || selected.size === 0} onClick={save}>
          {selected.size === 0 ? "Choisissez des photos" : `Ajouter ${selected.size} photo${selected.size > 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}

/** Ajouter des photos à un album : en choisir dans la bibliothèque ou en importer du téléphone. */
export default function AddPhotosSheet({ open, albumId, alreadyIn, onClose, onDone }: { open: boolean; albumId: string; alreadyIn: Set<string>; onClose: () => void; onDone: (message: string) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Ajouter des photos" tall>
      {open && <Body albumId={albumId} alreadyIn={alreadyIn} onClose={onClose} onDone={onDone} />}
    </Sheet>
  );
}
