"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { Mood, PresenceRow, StatusRow } from "@/lib/types";
import { MOODS, moodEmoji, moodLabel } from "@/lib/moods";
import { PRESENCE_HEARTBEAT_MS, isPresenceOnline } from "@/lib/presence";
import { sendNotification } from "@/lib/notify";

export default function StatusBar() {
  const { name } = useIdentity();
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [presence, setPresence] = useState<PresenceRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("statuses")
      .select("*")
      .then(({ data }) => {
        if (data) setStatuses(data);
      });

    const statusChannel = supabase
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
      supabase.removeChannel(statusChannel);
    };
  }, []);

  useEffect(() => {
    supabase
      .from("presence")
      .select("*")
      .then(({ data }) => {
        if (data) setPresence(data);
      });

    const presenceChannel = supabase
      .channel("presence-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "presence" },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as PresenceRow;
          setPresence((prev) => [...prev.filter((p) => p.name !== row.name), row]);
        }
      )
      .subscribe();

    async function setOnline(online: boolean) {
      await supabase
        .from("presence")
        .upsert({ name, online, updated_at: new Date().toISOString() });
    }

    setOnline(document.visibilityState === "visible");

    function handleVisibility() {
      setOnline(document.visibilityState === "visible");
    }
    document.addEventListener("visibilitychange", handleVisibility);

    const heartbeat = setInterval(() => {
      if (document.visibilityState === "visible") setOnline(true);
    }, PRESENCE_HEARTBEAT_MS);

    function handlePageHide() {
      navigator.sendBeacon?.(
        "/api/presence-offline",
        new Blob([JSON.stringify({ name })], { type: "application/json" })
      );
    }
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      supabase.removeChannel(presenceChannel);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      clearInterval(heartbeat);
    };
  }, [name]);

  const mine = statuses.find((s) => s.name === name);
  const otherNames = Array.from(
    new Set([
      ...statuses.filter((s) => s.name !== name).map((s) => s.name),
      ...presence.filter((p) => p.name !== name).map((p) => p.name),
    ])
  );

  async function setMood(mood: Mood) {
    setPickerOpen(false);
    const { data } = await supabase
      .from("statuses")
      .upsert({ name, mood, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (data) setStatuses((prev) => [...prev.filter((s) => s.name !== name), data]);
    sendNotification({
      senderName: name,
      title: "💭 Changement d'humeur",
      body: `${name} se sent maintenant : ${moodLabel(mood)} ${moodEmoji(mood)}`,
      url: "/chat",
    });
  }

  const myOnline = isPresenceOnline(presence.find((p) => p.name === name));

  return (
    <div className="relative flex items-center gap-2 border-b border-blush-100 bg-white px-4 py-2 text-xs">
      <button
        onClick={() => setPickerOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-blush-50 py-1.5 pl-2 pr-3 font-semibold text-blush-600 transition active:scale-95"
      >
        <span className="text-2xl leading-none">{moodEmoji(mine?.mood)}</span>
        <span className="flex flex-col items-start leading-tight">
          <span>Toi</span>
          <span className="text-[10px] font-normal text-blush-400">
            {moodLabel(mine?.mood)}
          </span>
        </span>
        <span title={myOnline ? "En ligne" : "Hors ligne"}>{myOnline ? "🟢" : "⚪"}</span>
      </button>
      {otherNames.map((otherName) => {
        const status = statuses.find((s) => s.name === otherName);
        const online = isPresenceOnline(presence.find((p) => p.name === otherName));
        return (
          <span
            key={otherName}
            className="flex items-center gap-2 rounded-full bg-blush-50 py-1.5 pl-2 pr-3"
          >
            <span className="text-2xl leading-none">{moodEmoji(status?.mood)}</span>
            <span className="flex flex-col items-start leading-tight">
              <span className="font-semibold text-blush-600">{otherName}</span>
              <span className="text-[10px] text-blush-400">{moodLabel(status?.mood)}</span>
            </span>
            <span title={online ? "En ligne" : "Hors ligne"}>{online ? "🟢" : "⚪"}</span>
          </span>
        );
      })}

      {pickerOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setPickerOpen(false)}
          />
          <div className="absolute left-4 top-full z-50 mt-1 grid max-h-[70vh] w-72 origin-top-left grid-cols-4 gap-1 overflow-y-auto rounded-2xl bg-white p-2 shadow-lg animate-pop-in">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className="flex flex-col items-center gap-0.5 rounded-xl py-2 transition hover:bg-blush-50 active:scale-90"
              >
                <span className="text-2xl leading-none">{m.emoji}</span>
                <span className="text-center text-[9px] font-semibold leading-tight text-blush-500">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
