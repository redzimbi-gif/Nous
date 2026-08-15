"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

const REACTION_EMOJIS = ["😂", "😮", "🔥", "👏", "😡", "😭", "😏", "❤️"];
const MAX_VISIBLE = 8;

type FloatingReaction = { id: string; emoji: string };

export default function GameReactions({ gameKey }: { gameKey: string }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recent, setRecent] = useState<FloatingReaction[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`${gameKey}-reactions`)
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        spawn(payload.emoji as string);
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameKey]);

  function spawn(emoji: string) {
    const id = crypto.randomUUID();
    setRecent((prev) => [...prev, { id, emoji }].slice(-MAX_VISIBLE));
    setTimeout(() => {
      setRecent((prev) => prev.filter((f) => f.id !== id));
    }, 3000);
  }

  function sendReaction(emoji: string) {
    setPickerOpen(false);
    spawn(emoji);
    channelRef.current?.send({
      type: "broadcast",
      event: "reaction",
      payload: { emoji },
    });
  }

  return (
    <>
      {recent.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center">
          <div className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur">
            {recent.map((f) => (
              <span key={f.id} className="animate-pop-in text-2xl">
                {f.emoji}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-50 text-lg transition active:scale-90"
          aria-label="Réagir"
        >
          😊
        </button>
        {pickerOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-1 grid grid-cols-4 gap-1 rounded-2xl bg-white p-2 shadow-lg animate-pop-in">
              {REACTION_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => sendReaction(e)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition hover:bg-blush-50 active:scale-90"
                >
                  {e}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
