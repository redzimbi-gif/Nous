"use client";

import { useEffect, useRef } from "react";
import type { PhotoRow } from "@/lib/types";

export default function Lightbox({
  photo,
  url,
  index,
  total,
  hasPrev,
  hasNext,
  onClose,
  onDelete,
  onPrev,
  onNext,
}: {
  photo: PhotoRow;
  url?: string;
  index: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
  onDelete: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onPrev, onClose]);

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) onNext();
      else onPrev();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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

      <span className="absolute left-3 top-3 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
        {index + 1} / {total}
      </span>

      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition active:scale-90"
          aria-label="Photo précédente"
        >
          ‹
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition active:scale-90"
          aria-label="Photo suivante"
        >
          ›
        </button>
      )}

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
