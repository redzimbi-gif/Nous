"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { WEEKDAYS_SHORT_FR, parseISODate, weekDays } from "@/lib/date";

/** Les sept jours de la semaine en cours de consultation ; un balayage change de semaine. */
export default function WeekStrip({
  selected,
  today,
  counts,
  onSelect,
  onShift,
}: {
  selected: string;
  today: string;
  counts: Record<string, number>;
  onSelect: (iso: string) => void;
  onShift: (direction: -1 | 1) => void;
}) {
  const touch = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      className="grid grid-cols-7 gap-1 px-5 pt-3.5"
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) onShift(dx < 0 ? 1 : -1);
      }}
    >
      {weekDays(selected).map((iso, i) => {
        const isSelected = iso === selected;
        const isToday = iso === today;
        const date = parseISODate(iso);
        const count = counts[iso] ?? 0;
        return (
          <button
            key={iso}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}${count ? `, ${count} événement${count > 1 ? "s" : ""}` : ""}`}
            onClick={() => onSelect(iso)}
            className="flex flex-col items-center gap-1 pb-1 transition active:scale-95"
          >
            <span className={cn("text-xs font-semibold", isToday ? "text-primary-ink" : "text-muted")}>{WEEKDAYS_SHORT_FR[i]}</span>
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-full font-display text-base font-semibold transition",
                isSelected ? "bg-primary text-primary-on shadow-press" : isToday ? "bg-tint text-tint-ink" : "text-ink",
              )}
            >
              {date.getDate()}
            </span>
            <span className={cn("size-1.5 rounded-full", count ? "bg-primary" : "bg-transparent")} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
