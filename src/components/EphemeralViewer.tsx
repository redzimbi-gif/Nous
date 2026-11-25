"use client";

import { Icon } from "@/components/ui/Icon";

export default function EphemeralViewer({
  url,
  kind,
  mirrored,
  onClose,
}: {
  url: string | null;
  kind: "image" | "video";
  mirrored?: boolean;
  onClose: () => void;
}) {
  return (
    <div role="dialog" aria-modal="true" aria-label={kind === "video" ? "Vidéo éphémère" : "Photo éphémère"} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black" onClick={onClose}>
      {url ? (
        kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
        ) : (
          <video
            src={url}
            autoPlay
            loop
            controls
            playsInline
            preload="auto"
            className={`max-h-full max-w-full object-contain ${mirrored ? "-scale-x-100" : ""}`}
            onClick={(e) => e.stopPropagation()}
          />
        )
      ) : (
        <div className="size-16 animate-pulse rounded-full bg-white/10" />
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition active:scale-90"
      >
        <Icon name="x" size={20} />
      </button>
      <p className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] flex items-center gap-1.5 px-8 text-center text-xs text-white/70">
        <Icon name="flame" size={14} />
        Cette {kind === "video" ? "vidéo" : "photo"} disparaît à la fermeture
      </p>
    </div>
  );
}
