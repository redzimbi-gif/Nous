"use client";

export default function EphemeralViewer({
  url,
  kind,
  onClose,
}: {
  url: string | null;
  kind: "image" | "video";
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      onClick={onClose}
    >
      {url ? (
        kind === "image" ? (
          <img
            src={url}
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <video
            src={url}
            autoPlay
            loop
            controls
            playsInline
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        )
      ) : (
        <div className="h-16 w-16 animate-pulse rounded-full bg-white/10" />
      )}
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-xl text-white transition active:scale-90"
      >
        ✕
      </button>
      <p className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] px-8 text-center text-xs text-white/70">
        Cette {kind === "video" ? "vidéo" : "photo"} va disparaître à la fermeture 🔥
      </p>
    </div>
  );
}
