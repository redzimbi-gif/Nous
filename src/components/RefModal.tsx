"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import type { RefRow } from "@/lib/types";

export type RefFormValues = {
  title: string;
  link: string;
  file: File | null;
  removeMedia: boolean;
};

export default function RefModal({
  initial,
  existingMediaUrl,
  onClose,
  onSave,
  saving,
}: {
  initial?: RefRow;
  existingMediaUrl?: string;
  onClose: () => void;
  onSave: (values: RefFormValues) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [removeMedia, setRemoveMedia] = useState(false);

  const hasExistingMedia = !!initial?.media_path && !removeMedia && !file;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), link: link.trim(), file, removeMedia });
  }

  return (
    <Sheet open onClose={onClose} title={initial ? "Modifier la réf" : "Nouvelle réf"}>
      <form onSubmit={handleSubmit} className="space-y-4 px-3 pb-1">
        <Field label="Titre">
          <input autoFocus={!initial} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Nom de la réf" required />
        </Field>

        <Field label="Lien (facultatif)">
          <input value={link} onChange={(e) => setLink(e.target.value)} type="url" inputMode="url" className={inputClass} placeholder="https://…" />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-muted">Photo ou vidéo (facultatif)</span>

          {hasExistingMedia && (
            <div className="mb-2 flex items-center gap-3 rounded-2xl bg-surface-2 p-2 ring-1 ring-line">
              {initial?.media_type === "image" && existingMediaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={existingMediaUrl} alt="" className="size-14 rounded-xl object-cover" />
              ) : (
                <span className="flex size-14 items-center justify-center rounded-xl bg-tint text-tint-ink">
                  <Icon name="video" size={24} />
                </span>
              )}
              <span className="flex-1 text-sm text-muted">Média actuel</span>
              <button type="button" onClick={() => setRemoveMedia(true)} className="flex size-11 shrink-0 items-center justify-center rounded-full text-subtle transition hover:text-danger active:scale-90" aria-label="Retirer le média">
                <Icon name="x" size={20} />
              </button>
            </div>
          )}

          <label className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl bg-surface-2 px-4 ring-1 ring-line transition active:scale-[0.99]">
            <Icon name="upload" size={20} className="shrink-0 text-primary-ink" />
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-primary-ink">{file ? file.name : hasExistingMedia ? "Remplacer le média" : "Choisir un fichier"}</span>
            <input
              type="file"
              accept="image/*,video/*"
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setRemoveMedia(false);
              }}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="soft" size="lg" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" size="lg" disabled={!title.trim() || saving}>
            {saving ? "Envoi…" : initial ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
