"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import Toggle from "@/components/Toggle";
import { cn } from "@/lib/cn";
import { EVENT_CATEGORIES, catClass } from "@/lib/events";
import type { EventCategory, EventRow } from "@/lib/types";

type FormValues = Partial<EventRow>;

function EventForm({ initial, isNew, onClose, onSave, onDelete }: { initial: FormValues; isNew: boolean; onClose: () => void; onSave: (values: FormValues) => void; onDelete?: () => void }) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [date, setDate] = useState(initial.event_date ?? "");
  const [allDay, setAllDay] = useState(initial.all_day ?? true);
  const [time, setTime] = useState(initial.event_time?.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(initial.event_end_time?.slice(0, 5) ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [category, setCategory] = useState<EventCategory>(initial.category ?? "autre");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onSave({
      title: title.trim(),
      event_date: date,
      all_day: allDay,
      event_time: allDay ? null : time || null,
      event_end_time: allDay ? null : endTime || null,
      description: description.trim() || null,
      category,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-3 pb-1">
      <Field label="Titre">
        <input autoFocus={isNew} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Resto, anniversaire, week-end…" required />
      </Field>

      <Field label="Date">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(inputClass, "appearance-none")} required />
      </Field>

      <div className="flex items-center justify-between rounded-2xl bg-surface-2 py-2 pl-4 pr-3 ring-1 ring-line">
        <span className="text-[15px] font-semibold">Toute la journée</span>
        <Toggle checked={allDay} onChange={() => setAllDay(!allDay)} label="Toute la journée" />
      </div>

      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={cn(inputClass, "appearance-none")} />
          </Field>
          <Field label="Fin">
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={cn(inputClass, "appearance-none")} />
          </Field>
        </div>
      )}

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-muted">Catégorie</legend>
        <div role="radiogroup" aria-label="Catégorie" className="flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCategory(c.value)}
                className={cn(catClass(c.value), "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition active:scale-95", active ? "bg-cat-ink text-cat-bg" : "bg-cat-bg text-cat-ink")}
              >
                {active && <Icon name="check" size={15} strokeWidth={2.6} />}
                {c.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field label="Note">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={cn(inputClass, "h-auto resize-none py-3")} placeholder="Adresse, détail à ne pas oublier…" />
      </Field>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button variant="soft" size="lg" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" size="lg">
          Enregistrer
        </Button>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          className={cn("mx-auto flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition active:scale-95", confirmDelete ? "bg-danger text-primary-on" : "text-danger")}
        >
          <Icon name="trash" size={17} />
          {confirmDelete ? "Confirmer la suppression" : "Supprimer l'événement"}
        </button>
      )}
    </form>
  );
}

export default function EventSheet({
  open,
  initial,
  isNew,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  initial: FormValues;
  isNew: boolean;
  onClose: () => void;
  onSave: (values: FormValues) => void;
  onDelete?: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={isNew ? "Nouvel événement" : "Modifier l'événement"}>
      {open && <EventForm key={initial.id ?? `new-${initial.event_date}`} initial={initial} isNew={isNew} onClose={onClose} onSave={onSave} onDelete={onDelete} />}
    </Sheet>
  );
}
