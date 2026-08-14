"use client";

import { useState } from "react";

export default function RefModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: (values: { title: string; link: string; file: File | null }) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), link: link.trim(), file });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-blush-900/40 backdrop-blur-sm sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl"
      >
        <h2 className="mb-4 text-lg font-extrabold text-blush-700">Nouvelle ref</h2>

        <label className="mb-3 block text-sm font-semibold text-blush-500">
          Titre
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-blush-100 px-3 py-2.5 outline-none focus:border-blush-300"
            placeholder="Nom de la ref"
          />
        </label>

        <label className="mb-3 block text-sm font-semibold text-blush-500">
          Lien (optionnel)
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            type="url"
            className="mt-1 w-full rounded-xl border-2 border-blush-100 px-3 py-2.5 outline-none focus:border-blush-300"
            placeholder="https://…"
          />
        </label>

        <label className="mb-5 block text-sm font-semibold text-blush-500">
          Photo ou vidéo (optionnel)
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm text-blush-600"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-blush-50 py-3 font-bold text-blush-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="flex-1 rounded-xl bg-blush-500 py-3 font-bold text-white disabled:opacity-50"
          >
            {saving ? "…" : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}
