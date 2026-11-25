"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CategoryChips, { type CategoryFilter } from "@/components/agenda/CategoryChips";
import EventSheet from "@/components/agenda/EventSheet";
import MonthGrid from "@/components/agenda/MonthGrid";
import WeekStrip from "@/components/agenda/WeekStrip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageHeading } from "@/components/ui/PageHeading";
import { cn } from "@/lib/cn";
import { MONTHS_FR, addDays, addMonths, parseISODate, toISODate } from "@/lib/date";
import { catClass, categoryLabel, compareEvents, eventTimeLabel } from "@/lib/events";
import { useIdentity } from "@/lib/identity";
import { sendNotification } from "@/lib/notify";
import { supabase } from "@/lib/supabase";
import type { EventRow } from "@/lib/types";

const UPCOMING_COUNT = 5;

export default function AgendaPage() {
  const { name } = useIdentity();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<"week" | "month">("week");
  const [selected, setSelected] = useState(() => toISODate(new Date()));
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);

  const today = toISODate(new Date());

  const load = useCallback(async () => {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    if (data) setEvents(data);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
    // L'autre personne modifie l'agenda : on le voit sans rien faire. Au retour sur l'appli, on rattrape.
    const channel = supabase
      .channel("events-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => load())
      .subscribe();
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const visible = useMemo(() => (filter === "all" ? events : events.filter((e) => e.category === filter)), [events, filter]);

  const byDate = useMemo(() => {
    const map: Record<string, EventRow[]> = {};
    for (const ev of visible) (map[ev.event_date] ??= []).push(ev);
    for (const list of Object.values(map)) list.sort(compareEvents);
    return map;
  }, [visible]);

  const counts = useMemo(() => Object.fromEntries(Object.entries(byDate).map(([date, list]) => [date, list.length])), [byDate]);

  const upcoming = useMemo(
    () =>
      visible
        .filter((e) => e.event_date >= today)
        .sort((a, b) => a.event_date.localeCompare(b.event_date) || compareEvents(a, b))
        .slice(0, UPCOMING_COUNT),
    [visible, today],
  );

  function shift(direction: -1 | 1) {
    setSelected((current) => (mode === "week" ? addDays(current, direction * 7) : addMonths(current, direction)));
  }

  function openNew() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(ev: EventRow) {
    setEditing(ev);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
  }

  async function handleSave(values: Partial<EventRow>) {
    if (editing) {
      await supabase.from("events").update(values).eq("id", editing.id);
    } else {
      await supabase.from("events").insert({ ...values, created_by: name });
      const dateLabel = values.event_date ? parseISODate(values.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "";
      sendNotification({
        senderName: name,
        title: "📅 Nouvel événement",
        body: `${values.title ?? "Événement"}${dateLabel ? ` le ${dateLabel}` : ""}`,
        url: "/agenda",
      });
      if (values.event_date) setSelected(values.event_date);
    }
    closeSheet();
    load();
  }

  async function handleDelete() {
    if (!editing) return;
    await supabase.from("events").delete().eq("id", editing.id);
    closeSheet();
    load();
  }

  const current = parseISODate(selected);
  const dayEvents = byDate[selected] ?? [];
  const dayTitle = current.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const Navigator = mode === "week" ? WeekStrip : MonthGrid;

  return (
    <div className="h-full overflow-y-auto pb-6">
      <div className="px-5">
        <PageHeading
          title="Agenda"
          action={
            <Button size="md" onClick={openNew} className="shrink-0">
              <Icon name="plus" size={18} strokeWidth={2.2} />
              Ajouter
            </Button>
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 px-5">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => shift(-1)} aria-label={mode === "week" ? "Semaine précédente" : "Mois précédent"} className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-primary-ink transition active:scale-90">
            <Icon name="chevronLeft" size={19} />
          </button>
          <span className="px-1 text-center font-display text-[17px] font-semibold" aria-live="polite">
            {MONTHS_FR[current.getMonth()]} {current.getFullYear()}
          </span>
          <button type="button" onClick={() => shift(1)} aria-label={mode === "week" ? "Semaine suivante" : "Mois suivant"} className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-primary-ink transition active:scale-90">
            <Icon name="chevronRight" size={19} />
          </button>
        </div>
        <div role="group" aria-label="Affichage" className="flex rounded-full bg-tint/70 p-1">
          {(["week", "month"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn("h-8 rounded-full px-2.5 text-[13px] font-bold transition", mode === m ? "bg-surface text-ink shadow-card" : "text-muted")}
            >
              {m === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>
      </div>

      <Navigator selected={selected} today={today} counts={counts} onSelect={setSelected} onShift={shift} />

      <CategoryChips value={filter} onChange={setFilter} />

      <section className="space-y-3 px-5 pt-5" aria-label={dayTitle}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-body text-[15px] font-semibold capitalize text-muted">{dayTitle}</h2>
          {selected !== today && (
            <button type="button" onClick={() => setSelected(today)} className="rounded-full bg-tint px-3 py-1 text-xs font-bold text-tint-ink transition active:scale-95">
              Aujourd&apos;hui
            </button>
          )}
        </div>

        {!loaded ? (
          <div className="h-24 animate-pulse rounded-3xl bg-tint/70" aria-hidden="true" />
        ) : dayEvents.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 border-dashed px-5 py-7 text-center shadow-none">
            <p className="text-[15px] text-muted">{filter === "all" ? "Rien de prévu ce jour-là." : `Aucun événement « ${categoryLabel(filter)} » ce jour-là.`}</p>
            <Button variant="soft" size="sm" onClick={openNew}>
              <Icon name="plus" size={16} strokeWidth={2.2} />
              Ajouter un événement
            </Button>
          </Card>
        ) : (
          dayEvents.map((ev) => (
            <button key={ev.id} type="button" onClick={() => openEdit(ev)} className="block w-full text-left">
              <Card className={cn(catClass(ev.category), "flex flex-col gap-1.5 p-4 transition active:scale-[0.99]")}>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-cat-bg px-2.5 py-0.5 text-[13px] font-semibold text-cat-ink">{categoryLabel(ev.category)}</span>
                  <span className="text-sm font-semibold tabular-nums text-muted">{eventTimeLabel(ev)}</span>
                </div>
                <span className="font-display text-lg font-semibold leading-snug">{ev.title}</span>
                {ev.description && <span className="line-clamp-2 text-sm text-muted">{ev.description}</span>}
                <span className="text-[13px] text-muted">Ajouté par {ev.created_by}</span>
              </Card>
            </button>
          ))
        )}
      </section>

      <section className="px-5 pt-7" aria-label="À venir">
        <h2 className="mb-3 font-display text-lg font-semibold">À venir</h2>
        {loaded && upcoming.length === 0 ? (
          <p className="text-[15px] text-muted">Rien de prévu prochainement.</p>
        ) : (
          <ul className="space-y-2.5">
            {upcoming.map((ev) => {
              const d = parseISODate(ev.event_date);
              return (
                <li key={ev.id}>
                  <button type="button" onClick={() => setSelected(ev.event_date)} className="flex w-full items-center gap-3 rounded-3xl bg-surface p-3 text-left shadow-card ring-1 ring-line transition active:scale-[0.99]">
                    <span className={cn(catClass(ev.category), "flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-cat-bg text-cat-ink")} aria-hidden="true">
                      <span className="font-display text-lg font-bold leading-none">{d.getDate()}</span>
                      <span className="mt-0.5 text-[10px] font-bold uppercase leading-none">{d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-base font-semibold">{ev.title}</span>
                      <span className="block text-sm text-muted">
                        {d.toLocaleDateString("fr-FR", { weekday: "long" })} · {eventTimeLabel(ev)}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={18} className="shrink-0 text-subtle" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <EventSheet open={sheetOpen} initial={editing ?? { event_date: selected }} isNew={!editing} onClose={closeSheet} onSave={handleSave} onDelete={editing ? handleDelete : undefined} />
    </div>
  );
}
