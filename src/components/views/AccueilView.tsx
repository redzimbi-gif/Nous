import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { Icon } from "@/components/ui/Icon";
import { daysSince, formatLongDate, greeting } from "@/lib/format";
import { moodEmoji, moodLabel } from "@/lib/moods";
import { SPACE_TYPE_INFO } from "@/lib/theme";
import type { SpaceType, Tone } from "@/lib/types";

export interface MemberView {
  id: string;
  name: string;
  tone: Tone;
  mood: string | null;
}

interface Props {
  type: SpaceType;
  spaceName: string;
  me: { name: string; tone: Tone };
  members: MemberView[];
  togetherSince?: string | null;
  tasks: { total: number; done: number };
  /** Code d'invitation, affiché seulement tant que l'espace peut accueillir quelqu'un. */
  inviteCode?: string | null;
  hrefs: { taches: string; humeur?: string };
  now?: Date;
}

const INVITE_TEXT: Record<SpaceType, string> = {
  couple: "Invite ta moitié",
  amis: "Invite tes amis",
  famille: "Invite ta famille",
};

export function AccueilView({ type, spaceName, me, members, togetherSince, tasks, inviteCode, hrefs, now = new Date() }: Props) {
  const info = SPACE_TYPE_INFO[type];
  const days = type === "couple" && togetherSince ? daysSince(togetherSince, now) : null;
  const pct = tasks.total ? Math.round((tasks.done / tasks.total) * 100) : 0;
  const sinceLabel = togetherSince
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${togetherSince}T12:00:00`))
    : null;

  return (
    <div className="space-y-4">
      <header className="pb-1 pt-3">
        <p className="text-sm font-semibold text-muted">{formatLongDate(now)}</p>
        <h1 className="mt-1 font-display text-[34px] font-bold leading-[1.05] tracking-tight">
          {greeting(now)} {me.name}
        </h1>
      </header>

      <section className="relative overflow-hidden rounded-4xl bg-primary p-6 text-primary-on shadow-float animate-rise">
        <svg className="pointer-events-none absolute -right-10 -top-12 text-primary-on opacity-[0.14]" width="220" height="150" viewBox="0 0 168 104" fill="currentColor" aria-hidden="true">
          <circle cx="62" cy="52" r="44" />
          <circle cx="106" cy="52" r="44" />
        </svg>
        <p className="relative text-xs font-bold uppercase tracking-[0.14em]">{info.hello}</p>
        {days !== null ? (
          <>
            <p className="relative mt-3 font-display text-[68px] font-bold leading-none">{days}</p>
            <p className="relative mt-1 text-lg font-semibold">jours ensemble</p>
            {sinceLabel && <p className="relative mt-3 text-sm font-medium">Depuis le {sinceLabel}</p>}
          </>
        ) : (
          <>
            <p className="relative mt-3 font-display text-[32px] font-bold leading-tight">{spaceName}</p>
            <div className="relative mt-4 flex items-center">
              {members.slice(0, 6).map((m, i) => (
                <span key={m.id} className={i === 0 ? "" : "-ml-2.5"}>
                  <Avatar name={m.name} tone={m.tone} size="md" className="ring-2 ring-primary" />
                </span>
              ))}
            </div>
            <p className="relative mt-3 text-sm font-medium">
              {members.length} {members.length > 1 ? "membres" : "membre"}
            </p>
          </>
        )}
      </section>

      {hrefs.humeur && (
        <Link href={hrefs.humeur} className="block animate-rise [animation-delay:60ms]">
          <Card className="p-4 transition active:scale-[0.99]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Humeurs</h2>
              <Icon name="chevronRight" size={18} className="text-subtle" />
            </div>
            <ul className="mt-3 flex gap-4 overflow-x-auto pb-1">
              {members.map((m) => {
                const emoji = moodEmoji(m.mood);
                return (
                  <li key={m.id} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                    <span className="relative">
                      <Avatar name={m.name} tone={m.tone} size="md" />
                      {emoji && (
                        <span role="img" aria-label={moodLabel(m.mood) ?? ""} className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-surface text-sm shadow-card ring-1 ring-line">
                          {emoji}
                        </span>
                      )}
                    </span>
                    <span className="max-w-full truncate text-xs font-semibold">{m.name}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </Link>
      )}

      <Link href={hrefs.taches} className="block animate-rise [animation-delay:120ms]">
        <Card className="flex items-center gap-4 p-4 transition active:scale-[0.99]">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-tint text-tint-ink">
            <Icon name="tasks" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">À faire</p>
            <p className="font-display text-lg font-semibold">{tasks.total === 0 ? "Rien pour l'instant" : `${tasks.done} sur ${tasks.total} terminées`}</p>
            {tasks.total > 0 && (
              <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Tâches terminées" className="mt-2 h-1.5 overflow-hidden rounded-full bg-tint">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
          <Icon name="chevronRight" size={18} className="text-subtle" />
        </Card>
      </Link>

      {inviteCode && (
        <Card className="animate-rise p-4 [animation-delay:180ms]">
          <p className="font-display text-base font-semibold">{INVITE_TEXT[type]}</p>
          <p className="mt-0.5 text-sm text-muted">Partage ce code pour inviter quelqu&apos;un dans « {spaceName} ».</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3">
            <span className="whitespace-nowrap font-display text-[19px] font-semibold tracking-[0.04em]">{inviteCode}</span>
            <CopyButton value={inviteCode} />
          </div>
        </Card>
      )}
    </div>
  );
}
