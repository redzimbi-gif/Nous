"use client";

import { useEffect, useState } from "react";
import { supabase, PHOTOS_BUCKET } from "@/lib/supabase";
import type { MessageRow, PhotoRow } from "@/lib/types";
import { COLOR_CLASSES } from "@/lib/identity";

export default function MessageBubble({
  message,
  photo,
  isMine,
  color,
}: {
  message: MessageRow;
  photo?: PhotoRow;
  isMine: boolean;
  color: string;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
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

  const time = new Date(message.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

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
        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>
      <span className="mt-0.5 px-2 text-[10px] text-blush-300">{time}</span>
    </div>
  );
}
