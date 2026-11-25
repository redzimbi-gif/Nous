"use client";

import Link from "next/link";
import { useMemo } from "react";
import RefThumb from "@/components/refs/RefThumb";
import { useRefDialogs } from "@/components/refs/useRefDialogs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageHeading } from "@/components/ui/PageHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useIdentity } from "@/lib/identity";
import { REF_CATEGORIES, categoryInfo, refCategory, shortDate } from "@/lib/refs";
import { useRefs } from "@/lib/useRefs";

export default function RefPage() {
  const { name } = useIdentity();
  const refs = useRefs(name);
  const { open, openNew, dialogs } = useRefDialogs(refs);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ref of refs.items) map[refCategory(ref)] = (map[refCategory(ref)] ?? 0) + 1;
    return map;
  }, [refs.items]);
  const latest = refs.items.slice(0, 5);

  return (
    <div className="h-full overflow-y-auto px-5 pb-6">
      <PageHeading
        title="Armoire à réfs"
        subtitle="Une bibliothèque collective pour garder tout ce que vous voulez retrouver."
        action={
          <Button onClick={() => openNew()} className="shrink-0">
            <Icon name="plus" size={18} strokeWidth={2.2} />
            Ajouter
          </Button>
        }
      />

      <section aria-label="Catégories">
        <h2 className="mb-2.5 font-display text-lg font-semibold">Catégories</h2>
        {!refs.loaded ? (
          <div className="space-y-2.5" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-3xl" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {REF_CATEGORIES.map((c) => (
              <li key={c.value}>
                <Link href={`/ref/${c.value}`} className="block">
                  <Card className="flex items-center gap-3.5 p-3.5 transition active:scale-[0.99]">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-tint text-tint-ink">
                      <Icon name={c.icon} size={23} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[17px] font-semibold leading-tight">{c.label}</span>
                      <span className="block truncate text-[13px] text-muted">{c.description}</span>
                    </span>
                    <span className="min-w-7 rounded-full bg-tint/70 px-2 py-0.5 text-center text-xs font-bold text-tint-ink">{counts[c.value] ?? 0}</span>
                    <Icon name="chevronRight" size={18} className="shrink-0 text-subtle" />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-5 flex items-start gap-3 rounded-2xl bg-tint/60 px-4 py-3 text-[14px] leading-snug text-tint-ink">
        <Icon name="bulb" size={20} className="mt-0.5 shrink-0" />
        <span>En un geste : dans le chat, touchez un message qui contient un lien ou une photo, puis « Enregistrer dans l&apos;armoire ».</span>
      </p>

      {latest.length > 0 && (
        <section aria-label="Derniers ajouts" className="mt-6">
          <h2 className="mb-2.5 font-display text-lg font-semibold">Derniers ajouts</h2>
          <ul className="space-y-2.5">
            {latest.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => open(item)} className="flex w-full items-center gap-3 rounded-3xl bg-surface p-3 text-left shadow-card ring-1 ring-line transition active:scale-[0.99]">
                  <RefThumb item={item} mediaUrl={item.media_path ? refs.urls[item.media_path] : undefined} className="size-14" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base font-semibold">{item.title}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[13px] text-muted">
                      <span className="rounded-full bg-tint px-2 py-0.5 text-xs font-bold text-tint-ink">{categoryInfo(refCategory(item)).label}</span>
                      <span className="truncate">
                        {item.created_by} · {shortDate(item.created_at)}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dialogs}
    </div>
  );
}
