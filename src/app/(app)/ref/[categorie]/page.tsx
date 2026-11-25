"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import RefThumb from "@/components/refs/RefThumb";
import { useRefDialogs } from "@/components/refs/useRefDialogs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useIdentity } from "@/lib/identity";
import { categoryInfo, isRefCategory, refCategory, shortDate } from "@/lib/refs";
import { useRefs } from "@/lib/useRefs";

export default function RefCategoryPage() {
  const { categorie } = useParams<{ categorie: string }>();
  const { name } = useIdentity();
  const refs = useRefs(name);
  const { open, openNew, dialogs } = useRefDialogs(refs);
  const valid = isRefCategory(categorie);
  const category = categoryInfo(valid ? categorie : "references");
  const items = useMemo(() => refs.items.filter((r) => refCategory(r) === category.value), [refs.items, category.value]);

  if (!valid) {
    return (
      <div className="h-full overflow-y-auto px-5 pt-3">
        <EmptyState icon="archive" title="Catégorie introuvable" action={<Link href="/ref" className="font-display text-[17px] font-semibold text-primary-ink">Retour à l&apos;armoire</Link>} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-5 pb-6">
      <div className="flex items-center justify-between pt-2">
        <Link href="/ref" className="-ml-2 flex h-10 items-center gap-1 rounded-full pl-1 pr-3 text-[15px] font-semibold text-primary-ink transition active:scale-95">
          <Icon name="chevronLeft" size={20} />
          Armoire
        </Link>
        <Button size="sm" onClick={() => openNew(category.value)}>
          <Icon name="plus" size={17} strokeWidth={2.2} />
          Ajouter
        </Button>
      </div>

      <header className="flex items-center gap-4 pb-5 pt-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-3xl bg-tint text-tint-ink">
          <Icon name={category.icon} size={28} />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-[30px] font-bold leading-[1.1] tracking-tight">{category.label}</h1>
          <p className="mt-1 text-[14px] text-muted">
            {category.description} · {items.length} {items.length > 1 ? category.unit[1] : category.unit[0]}
          </p>
        </div>
      </header>

      {!refs.loaded ? (
        <div className="space-y-2.5" aria-hidden="true">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={category.icon} title={`Rien dans « ${category.label} » pour l'instant`} action={<Button onClick={() => openNew(category.value)}>Ajouter une réf</Button>}>
          {category.description}.
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => open(item)} className="flex w-full items-center gap-3.5 rounded-3xl bg-surface p-3 text-left shadow-card ring-1 ring-line transition active:scale-[0.99]">
                <RefThumb item={item} mediaUrl={item.media_path ? refs.urls[item.media_path] : undefined} className="size-16" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[17px] font-semibold leading-snug">{item.title}</span>
                  {item.note && <span className="line-clamp-2 block text-[14px] leading-snug text-muted">{item.note}</span>}
                  <span className="mt-0.5 block text-[13px] text-subtle">
                    Ajouté par {item.created_by} · {shortDate(item.created_at)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {dialogs}
    </div>
  );
}
