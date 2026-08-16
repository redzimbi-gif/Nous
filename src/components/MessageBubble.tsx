"use client";

import { useEffect, useState } from "react";
import { supabase, PHOTOS_BUCKET, REFS_BUCKET } from "@/lib/supabase";
import type { MessageRow, PhotoRow, RefRow } from "@/lib/types";
import { COLOR_CLASSES } from "@/lib/identity";
import VoiceMessage from "@/components/VoiceMessage";

export default function MessageBubble({
  message,
  photo,
  refItem,
  isMine,
  color,
  onOpenActions,
  onOpenRef,
}: {
  message: MessageRow;
  photo?: PhotoRow;
  refItem?: RefRow;
  isMine: boolean;
  color: string;
  onOpenActions: () => void;
  onOpenRef: (ref: RefRow) => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [refImgUrl, setRefImgUrl] = useState<string | null>(null);
  const classes = COLOR_CLASSES[color] ?? COLOR_CLASSES.blush;

  useEffect(() => {
    if (!photo) return;
    let active = true;
    supabase.storage
      .from(PHOTOS_BUCKET)
      .createSignedUrl(photo.storage_path, 3600)
      .then(({ data }) => {
        if (active) setImgUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [photo]);

  useEffect(() => {
    if (!refItem?.media_path || refItem.media_type !== "image") return;
    let active = true;
    supabase.storage
      .from(REFS_BUCKET)
      .createSignedUrl(refItem.media_path, 3600)
      .then(({ data }) => {
        if (active) setRefImgUrl(data?.signedUrl ?? null);
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
        className={`max-w-[75%] rounded-3xl px-4 py-2.5 shadow-sm ${
          isMine
            ? `${classes.bg} rounded-br-md text-white`
            : "rounded-bl-md bg-white text-blush-900"
        }`}
      >
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
            <button
              onClick={() => onOpenRef(refItem)}
              className={`flex w-full items-center gap-2 rounded-2xl p-2 text-left transition active:scale-[0.98] ${overlayBg}`}
            >
              {refItem.media_type === "image" && refImgUrl ? (
                <img src={refImgUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${overlayBg}`}>
                  {refItem.media_type === "video" ? "🎬" : "🔖"}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{refItem.title}</span>
                <span className="block text-xs opacity-70">Ouvrir la ref</span>
              </span>
            </button>
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
        {message.saved && <span className="text-[11px]">🦆</span>}
        <span className="text-[10px] text-blush-300">{time}</span>
        <button
          onClick={onOpenActions}
          className="flex h-5 w-5 items-center justify-center text-blush-200 transition hover:text-blush-400 active:scale-90"
          aria-label="Actions du message"
        >
          ⋯
        </button>
      </div>
    </div>
  );
}
