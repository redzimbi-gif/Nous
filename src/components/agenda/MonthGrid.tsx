"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { WEEKDAYS_FR, getMonthGrid, parseISODate, toISODate } from "@/lib/date";

/** Le mois entier : un jour par case, un point quand il y a quelque chose de prévu. */
export default function MonthGrid({
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
  const current = parseISODate(selected);
  const days = getMonthGrid(current.getFullYear(), current.getMonth());
  return (
    <div
      className="px-5 pt-3"
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
      <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold text-muted" aria-hidden="true">
        {WEEKDAYS_FR.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const iso = toISODate(day);
          const inMonth = day.getMonth() === current.getMonth();
          const isSelected = iso === selected;
          const isToday = iso === today;
          const count = counts[iso] ?? 0;
          return (
            <button
              key={iso}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}${count ? `, ${count} événement${count > 1 ? "s" : ""}` : ""}`}
              onClick={() => onSelect(iso)}
              className="relative flex h-11 items-center justify-center transition active:scale-90"
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full font-display text-[15px] font-semibold transition",
                  isSelected ? "bg-primary text-primary-on shadow-press" : isToday ? "bg-tint text-tint-ink" : inMonth ? "text-ink" : "text-subtle/60",
                )}
              >
                {day.getDate()}
              </span>
              {count > 0 && <span className={cn("absolute bottom-0.5 size-1.5 rounded-full", isSelected ? "bg-primary" : "bg-primary/70")} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
