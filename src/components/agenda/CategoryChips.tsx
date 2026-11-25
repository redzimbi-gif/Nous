"use client";

import { cn } from "@/lib/cn";
import { EVENT_CATEGORIES, catClass } from "@/lib/events";
import type { EventCategory } from "@/lib/types";

export type CategoryFilter = "all" | EventCategory;

/** Filtre par catégorie : une rangée de pastilles qui défile sur les petits écrans. */
export default function CategoryChips({ value, onChange }: { value: CategoryFilter; onChange: (value: CategoryFilter) => void }) {
  return (
    <div role="group" aria-label="Filtrer par catégorie" className="flex gap-2 overflow-x-auto px-5 pb-1 pt-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        aria-pressed={value === "all"}
        onClick={() => onChange("all")}
        className={cn("h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition active:scale-95", value === "all" ? "bg-primary text-primary-on shadow-press" : "bg-tint text-tint-ink")}
      >
        Toutes
      </button>
      {EVENT_CATEGORIES.map((c) => (
        <button
          key={c.value}
          type="button"
          aria-pressed={value === c.value}
          onClick={() => onChange(value === c.value ? "all" : c.value)}
          className={cn(
            catClass(c.value),
            "h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition active:scale-95",
            value === c.value ? "bg-cat-ink text-cat-bg shadow-card" : "bg-cat-bg text-cat-ink",
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
