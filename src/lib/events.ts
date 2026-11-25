import type { EventCategory } from "@/lib/types";

export const EVENT_CATEGORIES: { value: EventCategory; emoji: string; label: string }[] = [
  { value: "date", emoji: "💕", label: "Date" },
  { value: "anniversaire", emoji: "🎂", label: "Anniversaire" },
  { value: "voyage", emoji: "✈️", label: "Voyage" },
  { value: "travail", emoji: "💼", label: "Travail" },
  { value: "sport", emoji: "🏀", label: "Sport" },
  { value: "autre", emoji: "📌", label: "Autre" },
];

export function categoryEmoji(category: string): string {
  return EVENT_CATEGORIES.find((c) => c.value === category)?.emoji ?? "📌";
}

export function categoryLabel(category: string): string {
  return EVENT_CATEGORIES.find((c) => c.value === category)?.label ?? "Autre";
}

/** « 20:00 → 22:30 », « 20:00 » ou « Journée entière ». */
export function eventTimeLabel(ev: { all_day: boolean; event_time: string | null; event_end_time: string | null }): string {
  if (ev.all_day || !ev.event_time) return "Journée entière";
  const start = ev.event_time.slice(0, 5);
  return ev.event_end_time ? `${start} → ${ev.event_end_time.slice(0, 5)}` : start;
}

/** Classe CSS qui définit les couleurs de la catégorie (--cat-bg, --cat-ink). */
export function catClass(category: string): string {
  return `cat-${EVENT_CATEGORIES.some((c) => c.value === category) ? category : "autre"}`;
}

/** Tri d'une journée : « toute la journée » d'abord, puis par heure de début. */
export function compareEvents(a: { all_day: boolean; event_time: string | null }, b: { all_day: boolean; event_time: string | null }): number {
  if (a.all_day !== b.all_day) return a.all_day ? -1 : 1;
  return (a.event_time ?? "").localeCompare(b.event_time ?? "");
}
