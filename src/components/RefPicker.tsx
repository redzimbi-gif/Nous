"use client";

import { useMemo, useState } from "react";
import RefThumb from "@/components/refs/RefThumb";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { REF_CATEGORIES, refCategory } from "@/lib/refs";
import type { RefCategory, RefRow } from "@/lib/types";
import { useRefs } from "@/lib/useRefs";

function Body({ onSelect }: { onSelect: (ref: RefRow) => void }) {
  const { items, urls, loaded } = useRefs("");
  const [category, setCategory] = useState<RefCategory | null>(null);
  const used = useMemo(() => REF_CATEGORIES.filter((c) => items.some((r) => refCategory(r) === c.value)), [items]);
  const shown = category ? items.filter((r) => refCategory(r) === category) : items;
  const chip = (active: boolean) => cn("h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition active:scale-95", active ? "bg-primary text-primary-on shadow-press" : "bg-tint text-tint-ink");

  if (!loaded) return <p className="py-10 text-center text-sm text-muted">Chargement…</p>;
  if (items.length === 0) return <p className="py-10 text-center text-sm text-muted">Aucune réf pour l&apos;instant. Ajoutez-en depuis l&apos;armoire.</p>;

  return (
    <>
      {used.length > 1 && (
        <div role="group" aria-label="Filtrer par catégorie" className="mb-2 flex gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button type="button" aria-pressed={category === null} className={chip(category === null)} onClick={() => setCategory(null)}>
            Toutes
          </button>
          {used.map((c) => (
            <button key={c.value} type="button" aria-pressed={category === c.value} className={chip(category === c.value)} onClick={() => setCategory(c.value)}>
              {c.label}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 px-2 pb-2">
        {shown.map((item) => (
          <button key={item.id} type="button" onClick={() => onSelect(item)} className="overflow-hidden rounded-2xl bg-surface-2 text-left ring-1 ring-line transition active:scale-95">
            <RefThumb item={item} mediaUrl={item.media_path ? urls[item.media_path] : undefined} className="aspect-square w-full rounded-none" />
            <p className="truncate px-2 py-1.5 text-xs font-semibold">{item.title}</p>
          </button>
        ))}
      </div>
    </>
  );
}

export default function RefPicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (ref: RefRow) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Envoyer une réf" tall>
      {open && <Body onSelect={onSelect} />}
    </Sheet>
  );
}
