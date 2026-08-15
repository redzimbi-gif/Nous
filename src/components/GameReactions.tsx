"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

const REACTION_EMOJIS = ["😂", "😮", "🔥", "👏", "😡", "😭", "😏", "❤️"];

export default function GameReactions({ gameKey }: { gameKey: string }) {
  const [pulsing, setPulsing] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`${gameKey}-reactions`)
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        pulse(payload.emoji as string);
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameKey]);

  function pulse(emoji: string) {
    setPulsing(emoji);
    setTimeout(() => {
      setPulsing((current) => (current === emoji ? null : current));
    }, 700);
  }

  function sendReaction(emoji: string) {
    pulse(emoji);
    channelRef.current?.send({
      type: "broadcast",
      event: "reaction",
      payload: { emoji },
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4">
      <div className="flex items-center gap-0.5 rounded-full bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur">
        {REACTION_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => sendReaction(e)}
            aria-label={`Réagir avec ${e}`}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl transition-transform duration-300 active:scale-90 ${
              pulsing === e ? "scale-150" : "scale-100"
            }`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
