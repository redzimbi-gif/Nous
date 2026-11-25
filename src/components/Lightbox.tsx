"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import type { PhotoRow } from "@/lib/types";

const roundButton = "flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition active:scale-90";

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
  /** Absent dans le chat : on n'y supprime pas la photo de l'album. */
  onDelete?: () => void;
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
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
      className="fixed inset-0 z-50 flex animate-fade flex-col items-center justify-center bg-ink/95 p-4"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={`${roundButton} absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))]`}
        aria-label="Fermer"
      >
        <Icon name="x" size={20} />
      </button>

      {total > 1 && (
        <span className="absolute left-3 top-[calc(0.75rem+env(safe-area-inset-top))] rounded-full bg-white/15 px-3.5 py-2 text-xs font-bold text-white backdrop-blur">
          {index + 1} / {total}
        </span>
      )}

      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className={`${roundButton} absolute left-2 top-1/2 -translate-y-1/2`}
          aria-label="Photo précédente"
        >
          <Icon name="chevronLeft" size={22} />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className={`${roundButton} absolute right-2 top-1/2 -translate-y-1/2`}
          aria-label="Photo suivante"
        >
          <Icon name="chevronRight" size={22} />
        </button>
      )}

      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" onClick={(e) => e.stopPropagation()} className="max-h-[72vh] max-w-full rounded-2xl object-contain" />
      ) : (
        <div className="size-40 animate-pulse rounded-2xl bg-white/10" />
      )}

      <div className="mt-5 flex w-full max-w-xs items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-white/75">
          <span className="font-bold text-white">{photo.sender_name}</span> ·{" "}
          {new Date(photo.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-danger-soft px-4 text-sm font-bold text-danger transition active:scale-95"
            aria-label="Supprimer la photo"
          >
            <Icon name="trash" size={17} />
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
