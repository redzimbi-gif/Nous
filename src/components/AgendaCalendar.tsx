"use client";

import { getMonthGrid, MONTHS_FR, WEEKDAYS_FR, toISODate } from "@/lib/date";
import type { EventRow } from "@/lib/types";

export default function AgendaCalendar({
  cursor,
  onCursorChange,
  eventsByDate,
  selectedDate,
  onSelectDate,
}: {
  cursor: Date;
  onCursorChange: (d: Date) => void;
  eventsByDate: Record<string, EventRow[]>;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const days = getMonthGrid(year, month);
  const todayISO = toISODate(new Date());

  return (
    <div className="px-4 pt-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => onCursorChange(new Date(year, month - 1, 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-blush-400 transition hover:bg-blush-50 active:scale-90"
          aria-label="Mois précédent"
        >
          ‹
        </button>
        <span className="font-bold text-blush-700">
          {MONTHS_FR[month]} {year}
        </span>
        <button
          onClick={() => onCursorChange(new Date(year, month + 1, 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-blush-400 transition hover:bg-blush-50 active:scale-90"
          aria-label="Mois suivant"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-blush-300">
        {WEEKDAYS_FR.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = toISODate(day);
          const inMonth = day.getMonth() === month;
          const hasEvents = !!eventsByDate[iso]?.length;
          const isToday = iso === todayISO;
          const isSelected = iso === selectedDate;

          return (
            <button
              key={iso}
              onClick={() => onSelectDate(iso)}
              className={`relative aspect-square rounded-xl text-sm transition active:scale-90 ${
                isSelected
                  ? "bg-blush-500 font-bold text-white"
                  : isToday
                    ? "bg-blush-100 font-bold text-blush-700"
                    : inMonth
                      ? "text-blush-700"
                      : "text-blush-200"
              }`}
            >
              {day.getDate()}
              {hasEvents && (
                <span
                  className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                    isSelected ? "bg-white" : "bg-blush-400"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
