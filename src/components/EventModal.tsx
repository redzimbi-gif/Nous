"use client";

import { useState } from "react";
import type { EventCategory, EventRow } from "@/lib/types";

type FormValues = Partial<EventRow>;

const CATEGORIES: { value: EventCategory; emoji: string; label: string }[] = [
  { value: "date", emoji: "💕", label: "Date" },
  { value: "anniversaire", emoji: "🎂", label: "Anniv" },
  { value: "voyage", emoji: "✈️", label: "Voyage" },
  { value: "travail", emoji: "💼", label: "Travail" },
  { value: "sport", emoji: "🏀", label: "Sport" },
  { value: "autre", emoji: "📌", label: "Autre" },
];

export default function EventModal({
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  initial: FormValues;
  onClose: () => void;
  onSave: (values: FormValues) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [date, setDate] = useState(initial.event_date ?? "");
  const [allDay, setAllDay] = useState(initial.all_day ?? true);
  const [time, setTime] = useState(initial.event_time?.slice(0, 5) ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [category, setCategory] = useState<EventCategory>(
    initial.category ?? "autre"
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onSave({
      title: title.trim(),
      event_date: date,
      all_day: allDay,
      event_time: allDay ? null : time || null,
      description: description.trim() || null,
      category,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-blush-900/40 backdrop-blur-sm sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl"
      >
        <h2 className="mb-4 text-lg font-extrabold text-blush-700">
          {initial.title ? "Modifier" : "Nouvel événement"}
        </h2>

        <label className="mb-3 block text-sm font-semibold text-blush-500">
          Titre
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-blush-100 px-3 py-2.5 outline-none transition focus:border-blush-300 focus-visible:ring-2 focus-visible:ring-blush-200"
            placeholder="Resto, anniversaire, week-end…"
          />
        </label>

        <label className="mb-3 block text-sm font-semibold text-blush-500">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-blush-100 px-3 py-2.5 outline-none transition focus:border-blush-300 focus-visible:ring-2 focus-visible:ring-blush-200"
          />
        </label>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-blush-500">
            Toute la journée
          </span>
          <button
            type="button"
            onClick={() => setAllDay(!allDay)}
            className={`h-7 w-12 rounded-full transition active:scale-95 ${
              allDay ? "bg-blush-400" : "bg-blush-100"
            }`}
          >
            <span
              className={`block h-5 w-5 translate-y-1 rounded-full bg-white transition ${
                allDay ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {!allDay && (
          <label className="mb-3 block text-sm font-semibold text-blush-500">
            Heure
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-blush-100 px-3 py-2.5 outline-none transition focus:border-blush-300 focus-visible:ring-2 focus-visible:ring-blush-200"
            />
          </label>
        )}

        <label className="mb-3 block text-sm font-semibold text-blush-500">
          Catégorie
          <div className="mt-1 flex gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`flex-1 rounded-xl border-2 py-2 text-sm transition active:scale-95 ${
                  category === c.value
                    ? "border-blush-400 bg-blush-50"
                    : "border-blush-100"
                }`}
                title={c.label}
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </label>

        <label className="mb-4 block text-sm font-semibold text-blush-500">
          Note
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border-2 border-blush-100 px-3 py-2.5 outline-none transition focus:border-blush-300 focus-visible:ring-2 focus-visible:ring-blush-200"
          />
        </label>

        <div className="flex gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex-1 rounded-xl bg-red-50 py-3 font-bold text-red-500 transition active:scale-[0.98]"
            >
              Supprimer
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-blush-50 py-3 font-bold text-blush-500 transition active:scale-[0.98]"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-blush-500 py-3 font-bold text-white transition active:scale-[0.98]"
          >
            OK
          </button>
        </div>
      </form>
    </div>
  );
}
