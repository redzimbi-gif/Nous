"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

const REACTION_EMOJIS = ["😂", "😮", "🔥", "👏", "😡", "😭", "😏", "❤️"];
const MIN_GAP = 18;

type FloatingReaction = { id: string; emoji: string; x: number };

export default function GameReactions({ gameKey }: { gameKey: string }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
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

  function pickX(existing: number[]): number {
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = 12 + Math.random() * 76;
      if (existing.every((x) => Math.abs(x - candidate) >= MIN_GAP)) {
        return candidate;
      }
    }
    return 12 + Math.random() * 76;
  }

  function spawn(emoji: string) {
    const id = crypto.randomUUID();
    setFloating((prev) => [...prev, { id, emoji, x: pickX(prev.map((f) => f.x)) }]);
    setTimeout(() => {
      setFloating((prev) => prev.filter((f) => f.id !== id));
    }, 1600);
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
      <div className="pointer-events-none fixed inset-x-0 top-24 bottom-20 z-40 overflow-hidden">
        {floating.map((f) => (
          <span
            key={f.id}
            className="absolute bottom-0 animate-float-up text-4xl"
            style={{ left: `${f.x}%` }}
          >
            {f.emoji}
          </span>
        ))}
      </div>

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
