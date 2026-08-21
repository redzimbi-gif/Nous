"use client";

import { useEffect, useState } from "react";
import { PHOTOS_BUCKET, REFS_BUCKET } from "@/lib/supabase";
import { getCachedSignedUrl } from "@/lib/signedUrlCache";
import type { MessageRow, PhotoRow, RefRow } from "@/lib/types";
import { COLOR_CLASSES } from "@/lib/identity";
import VoiceMessage from "@/components/VoiceMessage";

export default function MessageBubble({
  message,
  photo,
  refItem,
  isMine,
  color,
  seen,
  status,
  pendingKind,
  onOpenActions,
  onOpenRef,
  onOpenEphemeral,
  onRetry,
}: {
  message: MessageRow;
  photo?: PhotoRow;
  refItem?: RefRow;
  isMine: boolean;
  color: string;
  seen?: boolean;
  status?: "sending" | "failed";
  pendingKind?: "photo" | "voice" | "video";
  onOpenActions: () => void;
  onOpenRef: (ref: RefRow) => void;
  onOpenEphemeral: (message: MessageRow) => void;
  onRetry?: () => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [refMediaUrl, setRefMediaUrl] = useState<string | null>(null);
  const classes = COLOR_CLASSES[color] ?? COLOR_CLASSES.blush;
  const ephemeralSeen = message.ephemeral_type ? !!message.ephemeral_viewed_at : seen;

  useEffect(() => {
    if (!photo) return;
    let active = true;
    getCachedSignedUrl(PHOTOS_BUCKET, photo.storage_path, 3600).then((url) => {
      if (active) setImgUrl(url);
    });
    return () => {
      active = false;
    };
  }, [photo]);

  useEffect(() => {
    if (!refItem?.media_path) return;
    let active = true;
    getCachedSignedUrl(REFS_BUCKET, refItem.media_path, 3600).then((url) => {
      if (active) setRefMediaUrl(url);
    });
    return () => {
      active = false;
    };
  }, [refItem]);

  const time = new Date(message.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const overlayBg = isMine ? "bg-white/20" : "bg-black/5";

  return (
    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
      {!isMine && (
        <span className="mb-0.5 ml-2 text-xs font-semibold text-blush-400">
          {message.sender_name}
        </span>
      )}
      <div
        className={`max-w-[75%] rounded-3xl px-4 py-2.5 shadow-sm transition-opacity ${
          isMine
            ? `${classes.bg} rounded-br-md text-white`
            : "rounded-bl-md bg-white text-blush-900"
        } ${status === "sending" ? "opacity-60" : ""} ${
          status === "failed" ? "ring-2 ring-red-400" : ""
        }`}
      >
        {pendingKind === "photo" && (
          <div className="mb-1 flex h-32 w-40 items-center justify-center rounded-2xl bg-black/10 text-3xl">
            📷
          </div>
        )}
        {pendingKind === "voice" && (
          <div className="mb-1 flex items-center gap-2 rounded-2xl bg-black/10 px-3 py-2 text-sm font-semibold">
            🎤 Message vocal
          </div>
        )}
        {pendingKind === "video" && (
          <div className="mb-1 flex items-center gap-2 rounded-2xl bg-black/10 px-3 py-2 text-sm font-semibold">
            🎥 Vidéo éphémère
          </div>
        )}
        {message.ephemeral_type &&
          (message.ephemeral_viewed_at ? (
            <div className={`flex items-center gap-2 rounded-2xl p-2 text-sm opacity-70 ${overlayBg}`}>
              <span className="text-xl">
                {message.ephemeral_type === "video" ? "🎥" : "📸"}
              </span>
              {message.ephemeral_type === "video" ? "Vidéo" : "Photo"} éphémère · Vue
            </div>
          ) : isMine ? (
            <div className={`flex items-center gap-2 rounded-2xl p-2 text-sm opacity-70 ${overlayBg}`}>
              <span className="text-xl">
                {message.ephemeral_type === "video" ? "🎥" : "🔥"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">
                  {message.ephemeral_type === "video" ? "Vidéo éphémère" : "Photo éphémère"}
                </span>
                <span className="block text-xs opacity-70">En attente d&apos;ouverture</span>
              </span>
            </div>
          ) : (
            message.ephemeral_path && (
              <button
                onClick={() => onOpenEphemeral(message)}
                className={`flex w-full items-center gap-2 rounded-2xl p-2 text-left transition active:scale-[0.98] ${overlayBg}`}
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${overlayBg}`}>
                  {message.ephemeral_type === "video" ? "🎥" : "🔥"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {message.ephemeral_type === "video" ? "Vidéo éphémère" : "Photo éphémère"}
                  </span>
                  <span className="block text-xs opacity-70">Appuyer pour voir</span>
                </span>
              </button>
            )
          ))}
        {photo &&
          (imgUrl ? (
            <img
              src={imgUrl}
              alt=""
              className="mb-1 max-h-64 w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="mb-1 h-40 w-48 animate-pulse rounded-2xl bg-black/10" />
          ))}
        {message.ref_id &&
          (refItem ? (
            refItem.media_path && !refItem.link ? (
              refItem.media_type === "video" ? (
                refMediaUrl && (
                  <video
                    src={refMediaUrl}
                    controls
                    className="mb-1 max-h-64 w-full rounded-2xl object-cover"
                  />
                )
              ) : refMediaUrl ? (
                <img
                  src={refMediaUrl}
                  alt=""
                  className="mb-1 max-h-64 w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="mb-1 h-40 w-full animate-pulse rounded-2xl bg-black/10" />
              )
            ) : (
              <button
                onClick={() => onOpenRef(refItem)}
                className={`flex w-full items-center gap-2 rounded-2xl p-2 text-left transition active:scale-[0.98] ${overlayBg}`}
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${overlayBg}`}>
                  🔗
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{refItem.title}</span>
                  <span className="block text-xs opacity-70">Ouvrir la ref</span>
                </span>
              </button>
            )
          ) : (
            <div className={`flex items-center gap-2 rounded-2xl p-2 text-sm opacity-70 ${overlayBg}`}>
              🔖 Ref supprimée
            </div>
          ))}
        {message.audio_path && (
          <VoiceMessage path={message.audio_path} tone={isMine ? "mine" : "theirs"} />
        )}
        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 px-2">
        {status === "sending" && (
          <span className="text-[10px] text-blush-300">Envoi…</span>
        )}
        {status === "failed" && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-[11px] font-semibold text-red-500 transition active:scale-95"
          >
            ⚠️ Non envoyé — Réessayer
          </button>
        )}
        {!status && (
          <>
            {message.saved && <span className="text-[11px]">🦆</span>}
            <span className="text-[10px] text-blush-300">{time}</span>
            {isMine && (
              <span
                className={`text-[11px] leading-none ${
                  ephemeralSeen ? "text-blush-500" : "text-blush-200"
                }`}
                aria-label={ephemeralSeen ? "Vu" : "Envoyé"}
              >
                {ephemeralSeen ? "✓✓" : "✓"}
              </span>
            )}
            <button
              onClick={onOpenActions}
              className="flex h-5 w-5 items-center justify-center text-blush-200 transition hover:text-blush-400 active:scale-90"
              aria-label="Actions du message"
            >
              ⋯
            </button>
          </>
        )}
      </div>
    </div>
  );
}
