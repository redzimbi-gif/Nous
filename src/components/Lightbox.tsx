"use client";

import type { PhotoRow } from "@/lib/types";

export default function Lightbox({
  photo,
  url,
  onClose,
  onDelete,
}: {
  photo: PhotoRow;
  url?: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-lg text-white transition active:scale-90"
        aria-label="Fermer"
      >
        ✕
      </button>

      {url ? (
        <img
          src={url}
          alt=""
          onClick={(e) => e.stopPropagation()}
          className="max-h-[70vh] max-w-full rounded-xl object-contain"
        />
      ) : (
        <div className="h-40 w-40 animate-pulse rounded-xl bg-white/10" />
      )}

      <div
        className="mt-4 flex w-full max-w-xs items-center justify-between gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-white/70">
          {photo.sender_name} ·{" "}
          {new Date(photo.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <button
          onClick={onDelete}
          className="flex h-11 shrink-0 items-center justify-center rounded-full bg-red-500/20 px-4 text-sm font-bold text-red-300 transition active:scale-95"
          aria-label="Supprimer la photo"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
