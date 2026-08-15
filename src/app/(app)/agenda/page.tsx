"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { EventRow } from "@/lib/types";
import AgendaCalendar from "@/components/AgendaCalendar";
import EventModal from "@/components/EventModal";
import { toISODate } from "@/lib/date";

const CATEGORY_EMOJI: Record<string, string> = {
  date: "💕",
  anniversaire: "🎂",
  voyage: "✈️",
  travail: "💼",
  autre: "📌",
};

export default function AgendaPage() {
  const { name } = useIdentity();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(
    toISODate(new Date())
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);

  async function load() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });
    if (data) setEvents(data);
  }

  useEffect(() => {
    load();
  }, []);

  const eventsByDate = useMemo(() => {
    const map: Record<string, EventRow[]> = {};
    for (const ev of events) {
      (map[ev.event_date] ??= []).push(ev);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(() => {
    const today = toISODate(new Date());
    return events.filter((e) => e.event_date >= today).slice(0, 5);
  }, [events]);

  async function handleSave(values: Partial<EventRow>) {
    if (editing) {
      await supabase.from("events").update(values).eq("id", editing.id);
    } else {
      await supabase.from("events").insert({ ...values, created_by: name });
    }
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("events").delete().eq("id", id);
    setModalOpen(false);
    setEditing(null);
    load();
  }

  const dayEvents = eventsByDate[selectedDate] ?? [];

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3">
        <h1 className="text-lg font-extrabold text-blush-700">📅 Agenda</h1>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="rounded-full bg-blush-500 px-4 py-1.5 text-sm font-bold text-white transition active:scale-95"
        >
          + Ajouter
        </button>
      </header>

      <AgendaCalendar
        cursor={cursor}
        onCursorChange={setCursor}
        eventsByDate={eventsByDate}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <div className="px-4 pb-6">
        <h2 className="mb-2 mt-4 text-sm font-bold text-blush-400">
          {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h2>
        <div className="space-y-2">
          {dayEvents.length === 0 && (
            <p className="text-sm text-blush-300">Rien de prévu ce jour-là</p>
          )}
          {dayEvents.map((ev) => (
            <button
              key={ev.id}
              onClick={() => {
                setEditing(ev);
                setModalOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition active:scale-[0.98]"
            >
              <span className="text-xl">
                {CATEGORY_EMOJI[ev.category] ?? "📌"}
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-blush-800">
                  {ev.title}
                </span>
                {!ev.all_day && ev.event_time && (
                  <span className="text-xs text-blush-400">
                    {ev.event_time.slice(0, 5)}
                  </span>
                )}
                {ev.description && (
                  <span className="block text-xs text-blush-400">
                    {ev.description}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        <h2 className="mb-2 mt-6 text-sm font-bold text-blush-400">
          À venir
        </h2>
        <div className="space-y-2">
          {upcoming.length === 0 && (
            <p className="text-sm text-blush-300">Rien de prévu prochainement</p>
          )}
          {upcoming.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-3 rounded-2xl bg-white/60 p-3 text-sm"
            >
              <span className="text-lg">
                {CATEGORY_EMOJI[ev.category] ?? "📌"}
              </span>
              <span className="flex-1 text-blush-700">{ev.title}</span>
              <span className="text-xs text-blush-400">
                {new Date(ev.event_date + "T00:00:00").toLocaleDateString(
                  "fr-FR",
                  { day: "numeric", month: "short" }
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <EventModal
          initial={editing ?? { event_date: selectedDate }}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
          onDelete={editing ? () => handleDelete(editing.id) : undefined}
        />
      )}
    </div>
  );
}
