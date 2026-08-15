"use client";

import { useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-blush-900/40 backdrop-blur-sm sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl"
      >
        <h2 className="mb-4 text-lg font-extrabold text-blush-700">
          {initial ? "Modifier la ref" : "Nouvelle ref"}
        </h2>

        <label className="mb-3 block text-sm font-semibold text-blush-500">
          Titre
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-blush-100 px-3 py-2.5 outline-none transition focus:border-blush-300 focus-visible:ring-2 focus-visible:ring-blush-200"
            placeholder="Nom de la ref"
          />
        </label>

        <label className="mb-3 block text-sm font-semibold text-blush-500">
          Lien (optionnel)
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            type="url"
            className="mt-1 w-full rounded-xl border-2 border-blush-100 px-3 py-2.5 outline-none transition focus:border-blush-300 focus-visible:ring-2 focus-visible:ring-blush-200"
            placeholder="https://…"
          />
        </label>

        <div className="mb-5">
          <span className="mb-1 block text-sm font-semibold text-blush-500">
            Photo ou vidéo (optionnel)
          </span>

          {hasExistingMedia && (
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-blush-50 p-2">
              {initial?.media_type === "image" && existingMediaUrl ? (
                <img
                  src={existingMediaUrl}
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-blush-100 text-2xl">
                  🎬
                </span>
              )}
              <span className="flex-1 text-xs text-blush-400">Média actuel</span>
              <button
                type="button"
                onClick={() => setRemoveMedia(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-blush-300 transition hover:text-red-500 active:scale-90"
                aria-label="Retirer le média"
              >
                ✕
              </button>
            </div>
          )}

          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setRemoveMedia(false);
            }}
            className="w-full text-sm text-blush-600"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-blush-50 py-3 font-bold text-blush-500 transition active:scale-[0.98]"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="flex-1 rounded-xl bg-blush-500 py-3 font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "…" : initial ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}
