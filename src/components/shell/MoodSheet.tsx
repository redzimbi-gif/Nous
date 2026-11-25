"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { MOODS, moodEmoji, moodLabel } from "@/lib/moods";
import { useStatus } from "@/lib/status";

/** Humeurs du couple : celle de l'autre, et le choix de la sienne. */
export default function MoodSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me, others, setMood } = useStatus();
  return (
    <Sheet open={open} onClose={onClose} title="Humeurs">
      <ul className="mb-3 space-y-1">
        {others.map((p) => (
          <li key={p.name} className="flex items-center gap-3 rounded-2xl bg-bg px-3 py-2.5">
            <Avatar name={p.name} tone={p.tone} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{p.name}</span>
              <span className="block text-sm text-muted">{p.online ? "En ligne" : "Hors ligne"}</span>
            </span>
            <span className="text-right text-sm text-muted">
              <span className="mr-1 text-xl" aria-hidden="true">{moodEmoji(p.mood) ?? "🙂"}</span>
              {moodLabel(p.mood) ?? "Pas de statut"}
            </span>
          </li>
        ))}
      </ul>
      <h3 className="px-1 pb-2 pt-1 font-display text-base font-semibold">Ma humeur</h3>
      <ul className="grid grid-cols-4 gap-2 pb-2">
        {MOODS.map((m) => {
          const selected = me.mood === m.value;
          return (
            <li key={m.value}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onClose();
                  void setMood(m.value);
                }}
                className={cn(
                  "flex h-[76px] w-full flex-col items-center justify-center rounded-2xl p-1 text-center transition active:scale-95",
                  selected ? "bg-tint text-tint-ink ring-2 ring-primary" : "bg-surface-2 text-ink",
                )}
              >
                <span className="text-[26px] leading-none" aria-hidden="true">{m.emoji}</span>
                <span className="mt-1 text-[11px] font-semibold leading-tight">{m.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
