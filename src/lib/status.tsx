"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import { PRESENCE_HEARTBEAT_MS, isPresenceOnline } from "@/lib/presence";
import { moodEmoji, moodLabel } from "@/lib/moods";
import { sendNotification } from "@/lib/notify";
import { toneOfIdentity, toneOfName, type Tone } from "@/lib/tone";
import type { Mood, PresenceRow, StatusRow } from "@/lib/types";

export interface Person {
  name: string;
  tone: Tone;
  mood: Mood | null;
  online: boolean;
}

interface StatusContextValue {
  me: Person;
  others: Person[];
  setMood: (mood: Mood) => Promise<void>;
}

const StatusContext = createContext<StatusContextValue | null>(null);

export function useStatus(): StatusContextValue {
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error("useStatus doit être utilisé dans StatusProvider");
  return ctx;
}

/**
 * Humeurs et présence du couple. Reprend la logique de l'ancienne barre d'état :
 * lecture + temps réel des tables « statuses » et « presence », battement de présence
 * toutes les 25 s tant que l'application est visible, hors ligne en quittant la page.
 */
export function StatusProvider({ children }: { children: React.ReactNode }) {
  const { name, color } = useIdentity();
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [presence, setPresence] = useState<PresenceRow[]>([]);

  useEffect(() => {
    supabase
      .from("statuses")
      .select("*")
      .then(({ data }) => {
        if (data) setStatuses(data);
      });

    const channel = supabase
      .channel("statuses-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "statuses" }, (payload) => {
        if (payload.eventType === "DELETE") return;
        const row = payload.new as StatusRow;
        setStatuses((prev) => [...prev.filter((s) => s.name !== row.name), row]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    supabase
      .from("presence")
      .select("*")
      .then(({ data }) => {
        if (data) setPresence(data);
      });

    const channel = supabase
      .channel("presence-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "presence" }, (payload) => {
        if (payload.eventType === "DELETE") return;
        const row = payload.new as PresenceRow;
        setPresence((prev) => [...prev.filter((p) => p.name !== row.name), row]);
      })
      .subscribe();

    async function setOnline(online: boolean) {
      await supabase.from("presence").upsert({ name, online, updated_at: new Date().toISOString() });
    }

    setOnline(document.visibilityState === "visible");
    const handleVisibility = () => setOnline(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handleVisibility);

    const heartbeat = setInterval(() => {
      if (document.visibilityState === "visible") setOnline(true);
    }, PRESENCE_HEARTBEAT_MS);

    const handlePageHide = () => {
      navigator.sendBeacon?.("/api/presence-offline", new Blob([JSON.stringify({ name })], { type: "application/json" }));
    };
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      clearInterval(heartbeat);
    };
  }, [name]);

  const setMood = useCallback(
    async (mood: Mood) => {
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
    },
    [name],
  );

  const value = useMemo<StatusContextValue>(() => {
    const myTone = toneOfIdentity(color);
    const person = (n: string, tone: Tone): Person => ({
      name: n,
      tone,
      mood: statuses.find((s) => s.name === n)?.mood ?? null,
      online: isPresenceOnline(presence.find((p) => p.name === n)),
    });
    const otherNames = Array.from(
      new Set([
        ...statuses.filter((s) => s.name !== name).map((s) => s.name),
        ...presence.filter((p) => p.name !== name).map((p) => p.name),
      ]),
    );
    return {
      me: person(name, myTone),
      others: otherNames.map((n) => person(n, toneOfName(n, myTone))),
      setMood,
    };
  }, [statuses, presence, name, color, setMood]);

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
}
