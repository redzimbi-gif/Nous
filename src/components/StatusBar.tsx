"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { StatusRow, Mood } from "@/lib/types";
import { MOODS, moodEmoji } from "@/lib/moods";

export default function StatusBar() {
  const { name } = useIdentity();
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("statuses")
      .select("*")
      .then(({ data }) => {
        if (data) setStatuses(data);
      });

    const channel = supabase
      .channel("statuses-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "statuses" },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as StatusRow;
          setStatuses((prev) => [...prev.filter((s) => s.name !== row.name), row]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const mine = statuses.find((s) => s.name === name);
  const others = statuses.filter((s) => s.name !== name);

  async function setMood(mood: Mood) {
    setPickerOpen(false);
    const { data } = await supabase
      .from("statuses")
      .upsert({ name, mood, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (data) setStatuses((prev) => [...prev.filter((s) => s.name !== name), data]);
  }

  return (
    <div className="relative flex items-center gap-2 border-b border-blush-100 bg-white px-4 py-1.5 text-xs">
      <button
        onClick={() => setPickerOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full bg-blush-50 px-2.5 py-1.5 font-semibold text-blush-600 transition active:scale-95"
      >
        <span className="text-base">{moodEmoji(mine?.mood)}</span>
        Toi
      </button>
      {others.map((s) => (
        <span
          key={s.name}
          className="flex items-center gap-1 rounded-full bg-blush-50 px-2.5 py-1 text-blush-400"
        >
          <span className="text-base">{moodEmoji(s.mood)}</span>
          {s.name}
        </span>
      ))}

      {pickerOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setPickerOpen(false)}
          />
          <div className="absolute left-4 top-full z-50 mt-1 grid origin-top-left grid-cols-4 gap-1 rounded-2xl bg-white p-2 shadow-lg animate-pop-in">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                title={m.label}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition hover:bg-blush-50 active:scale-90"
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
