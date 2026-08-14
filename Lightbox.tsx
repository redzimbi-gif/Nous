"use client";

import type { PhotoRow } from "@/lib/types";

export default function Lightbox({
  photo,
  url,
  onClose,
}: {
  photo: PhotoRow;
  url?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      {url ? (
        <img
          src={url}
          alt=""
          className="max-h-[80vh] max-w-full rounded-xl object-contain"
        />
      ) : (
        <div className="h-40 w-40 animate-pulse rounded-xl bg-white/10" />
      )}
      <div className="mt-4 text-center text-sm text-white/70">
        <p>
          {photo.sender_name} ·{" "}
          {new Date(photo.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
