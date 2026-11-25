"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MoodSheet from "@/components/shell/MoodSheet";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { TOGETHER_SINCE } from "@/lib/config";
import { daysSince, formatLongDate, greeting, toISODate } from "@/lib/date";
import { categoryEmoji, eventTimeLabel } from "@/lib/events";
import { useIdentity } from "@/lib/identity";
import { moodEmoji, moodLabel } from "@/lib/moods";
import { getCachedSignedUrl, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { useStatus } from "@/lib/status";
import { PHOTOS_BUCKET, supabase } from "@/lib/supabase";
import type { EventRow, PhotoRow } from "@/lib/types";

interface HomeData {
  nextEvent: EventRow | null;
  todos: { total: number; done: number };
  photo: { row: PhotoRow; url: string | null } | null;
}

function useHomeData() {
  const [data, setData] = useState<HomeData | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      const today = toISODate(new Date());
      const [events, todos, photos] = await Promise.all([
        supabase.from("events").select("*").gte("event_date", today).order("event_date", { ascending: true }).order("event_time", { ascending: true }).limit(1),
        supabase.from("todos").select("id, done"),
        supabase.from("photos").select("*").order("created_at", { ascending: false }).limit(1),
      ]);
      const photoRow = (photos.data?.[0] as PhotoRow | undefined) ?? null;
      const url = photoRow ? await getCachedSignedUrl(PHOTOS_BUCKET, photoRow.storage_path, LONG_TTL_SECONDS) : null;
      if (!active) return;
      const todoRows = (todos.data ?? []) as { id: string; done: boolean }[];
      setData({
        nextEvent: (events.data?.[0] as EventRow | undefined) ?? null,
        todos: { total: todoRows.length, done: todoRows.filter((t) => t.done).length },
        photo: photoRow ? { row: photoRow, url } : null,
      });
    })();
    return () => {
      active = false;
    };
  }, []);
  return data;
}

function HomeLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block">
      <Card className="flex items-center gap-4 p-4 transition active:scale-[0.99]">{children}</Card>
    </Link>
  );
}

const tile = "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-tint text-tint-ink";

export default function AccueilPage() {
  const { name } = useIdentity();
  const { me, others } = useStatus();
  const data = useHomeData();
  const [moodOpen, setMoodOpen] = useState(false);
  const now = new Date();

  const partner = others[0];
  const people = [me, ...others];
  const days = TOGETHER_SINCE ? daysSince(TOGETHER_SINCE, now) : null;
  const pct = data && data.todos.total ? Math.round((data.todos.done / data.todos.total) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-4">
        <header className="pb-1 pt-2">
          <p className="text-sm font-semibold text-muted">{formatLongDate(now)}</p>
          <h1 className="mt-1 font-display text-[34px] font-bold leading-[1.05] tracking-tight">
            {greeting(now)} {name}
          </h1>
        </header>

        <section className="relative animate-rise overflow-hidden rounded-4xl bg-primary p-6 text-primary-on shadow-float">
          <svg className="pointer-events-none absolute -right-10 -top-12 opacity-[0.14]" width="220" height="150" viewBox="0 0 168 104" fill="currentColor" aria-hidden="true">
            <circle cx="62" cy="52" r="44" />
            <circle cx="106" cy="52" r="44" />
          </svg>
          {days !== null ? (
            <>
              <p className="relative text-xs font-bold uppercase tracking-[0.14em]">Notre histoire</p>
              <p className="relative mt-3 font-display text-[68px] font-bold leading-none">{days}</p>
              <p className="relative mt-1 text-lg font-semibold">jours ensemble</p>
            </>
          ) : (
            <>
              <p className="relative text-xs font-bold uppercase tracking-[0.14em]">Notre espace</p>
              <p className="relative mt-3 font-display text-[32px] font-bold leading-tight">{people.map((p) => p.name).join(" & ")}</p>
              <div className="relative mt-4 flex items-center">
                {people.map((p, i) => (
                  <span key={p.name} className={i === 0 ? "" : "-ml-2.5"}>
                    <Avatar name={p.name} tone={p.tone} size="md" className="ring-2 ring-primary" />
                  </span>
                ))}
              </div>
              {partner && <p className="relative mt-3 text-sm font-medium">{partner.online ? `${partner.name} est en ligne` : `${partner.name} n'est pas en ligne`}</p>}
            </>
          )}
        </section>

        <button type="button" onClick={() => setMoodOpen(true)} className="block w-full animate-rise text-left [animation-delay:60ms]" aria-haspopup="dialog">
          <Card className="p-4 transition active:scale-[0.99]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Humeurs</h2>
              <Icon name="chevronRight" size={18} className="text-subtle" />
            </div>
            <ul className="mt-3 flex gap-5">
              {people.map((p) => {
                const emoji = p.mood ? moodEmoji(p.mood) : null;
                return (
                  <li key={p.name} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                    <span className="relative">
                      <Avatar name={p.name} tone={p.tone} size="md" />
                      {emoji && (
                        <span role="img" aria-label={moodLabel(p.mood) ?? ""} className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-surface text-sm shadow-card ring-1 ring-line">
                          {emoji}
                        </span>
                      )}
                    </span>
                    <span className="max-w-full truncate text-xs font-semibold">{p.name === me.name ? "Toi" : p.name}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </button>

        {!data ? (
          <>
            <Skeleton className="h-[88px] rounded-3xl" />
            <Skeleton className="h-[88px] rounded-3xl" />
            <Skeleton className="h-[88px] rounded-3xl" />
          </>
        ) : (
          <>
            <div className="animate-rise [animation-delay:120ms]">
              <HomeLink href="/agenda">
                <span className={tile}>
                  <Icon name="calendar" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-muted">Prochain rendez-vous</span>
                  {data.nextEvent ? (
                    <>
                      <span className="block truncate font-display text-lg font-semibold">
                        <span aria-hidden="true">{categoryEmoji(data.nextEvent.category)} </span>
                        {data.nextEvent.title}
                      </span>
                      <span className="block text-sm text-muted">
                        {new Date(`${data.nextEvent.event_date}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · {eventTimeLabel(data.nextEvent)}
                      </span>
                    </>
                  ) : (
                    <span className="block font-display text-lg font-semibold">Rien de prévu</span>
                  )}
                </span>
                <Icon name="chevronRight" size={18} className="text-subtle" />
              </HomeLink>
            </div>

            <div className="animate-rise [animation-delay:180ms]">
              <HomeLink href="/todo">
                <span className={tile}>
                  <Icon name="tasks" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-muted">À faire</span>
                  <span className="block font-display text-lg font-semibold">{data.todos.total === 0 ? "Rien pour l'instant" : `${data.todos.done} sur ${data.todos.total} terminées`}</span>
                  {data.todos.total > 0 && (
                    <span role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Tâches terminées" className="mt-2 block h-1.5 overflow-hidden rounded-full bg-tint">
                      <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </span>
                  )}
                </span>
                <Icon name="chevronRight" size={18} className="text-subtle" />
              </HomeLink>
            </div>

            {data.photo && (
              <div className="animate-rise [animation-delay:240ms]">
                <HomeLink href="/photos">
                  {data.photo.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.photo.url} alt="" className="size-12 shrink-0 rounded-2xl object-cover" />
                  ) : (
                    <span className={tile}>
                      <Icon name="photo" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-muted">Dernier souvenir</span>
                    <span className="block font-display text-lg font-semibold">
                      Photo du {new Date(data.photo.row.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    </span>
                  </span>
                  <Icon name="chevronRight" size={18} className="text-subtle" />
                </HomeLink>
              </div>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 px-5 pb-2 pt-1">
        <ButtonLink href="/chat" size="lg" block>
          <Icon name="chat" size={20} /> {partner ? `Écrire à ${partner.name}` : "Ouvrir le chat"}
        </ButtonLink>
      </div>

      <MoodSheet open={moodOpen} onClose={() => setMoodOpen(false)} />
    </div>
  );
}

