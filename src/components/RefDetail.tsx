"use client";

import type { RefRow } from "@/lib/types";

export default function RefDetail({
  item,
  url,
  onClose,
  onDelete,
}: {
  item: RefRow;
  url?: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-blush-900/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl"
      >
        {url && item.media_type === "image" && (
          <img src={url} alt="" className="mb-4 max-h-72 w-full rounded-2xl object-cover" />
        )}
        {url && item.media_type === "video" && (
          <video src={url} controls className="mb-4 max-h-72 w-full rounded-2xl" />
        )}

        <h2 className="mb-1 text-lg font-extrabold text-blush-700">{item.title}</h2>
        <p className="mb-4 text-xs text-blush-300">
          Ajouté par {item.created_by} ·{" "}
          {new Date(item.created_at).toLocaleDateString("fr-FR")}
        </p>

        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 block truncate rounded-xl bg-blush-50 px-3 py-2.5 text-sm font-semibold text-blush-600"
          >
            🔗 {item.link}
          </a>
        )}

        <div className="flex gap-2">
          <button
            onClick={onDelete}
            className="flex-1 rounded-xl bg-red-50 py-3 font-bold text-red-500"
          >
            Supprimer
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-blush-50 py-3 font-bold text-blush-500"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
