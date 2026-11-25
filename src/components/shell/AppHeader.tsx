"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LogoMark } from "@/components/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { moodEmoji, moodLabel } from "@/lib/moods";
import { useStatus } from "@/lib/status";
import MoodSheet from "./MoodSheet";

const rowClass = "flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left text-[17px] font-medium transition active:bg-tint/70";

const MENU: { href: string; label: string; icon: IconName }[] = [
  { href: "/jeux", label: "Jeux", icon: "dice" },
  { href: "/ref", label: "Armoire à réfs", icon: "archive" },
  { href: "/reglages", label: "Réglages", icon: "settings" },
];

/**
 * En-tête sobre : à gauche l'autre personne (humeur, présence) qui ouvre les humeurs,
 * à droite mon avatar qui ouvre le menu. Rien d'autre.
 */
export default function AppHeader() {
  const { me, others } = useStatus();
  const [sheet, setSheet] = useState<"mood" | "menu" | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    setSheet(null);
  }, [pathname]);

  const partner = others[0];
  const partnerEmoji = moodEmoji(partner?.mood);
  const myEmoji = moodEmoji(me.mood);

  return (
    <>
      <header className="relative flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => setSheet("mood")}
          aria-haspopup="dialog"
          aria-label={partner ? `Humeurs. ${partner.name}${partnerEmoji ? `, ${moodLabel(partner.mood)}` : ""}` : "Humeurs"}
          className="flex h-12 min-w-0 max-w-[70%] items-center gap-2.5 rounded-full bg-surface py-1 pl-1.5 pr-3.5 shadow-card ring-1 ring-line transition active:scale-[0.98]"
        >
          {partner ? (
            <>
              <span className="relative shrink-0">
                <Avatar name={partner.name} tone={partner.tone} size="sm" />
                {partner.online && <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-surface" aria-hidden="true" />}
              </span>
              <span className="min-w-0 text-left leading-tight">
                <span className="block truncate font-display text-[15px] font-semibold">{partner.name}</span>
                <span className="block truncate text-xs text-muted">
                  {partnerEmoji ? <span aria-hidden="true">{partnerEmoji} </span> : null}
                  {partnerEmoji ? moodLabel(partner.mood) : partner.online ? "En ligne" : "Hors ligne"}
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint"><LogoMark size={22} /></span>
              <span className="font-display text-[15px] font-semibold">Humeurs</span>
            </>
          )}
          <Icon name="chevronDown" size={16} className="shrink-0 text-subtle" />
        </button>

        <button type="button" onClick={() => setSheet("menu")} aria-haspopup="dialog" aria-label="Menu" className="relative rounded-full transition active:scale-95">
          <Avatar name={me.name} tone={me.tone} size="md" />
          {myEmoji && (
            <span aria-hidden="true" className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-surface text-sm shadow-card ring-1 ring-line">
              {myEmoji}
            </span>
          )}
        </button>
      </header>

      <MoodSheet open={sheet === "mood"} onClose={() => setSheet(null)} />

      <Sheet open={sheet === "menu"} onClose={() => setSheet(null)} title="Menu">
        <div className="mb-2 flex items-center gap-3 rounded-3xl bg-bg p-3">
          <Avatar name={me.name} tone={me.tone} size="md" />
          <div className="min-w-0">
            <p className="truncate font-display font-semibold">{me.name}</p>
            <p className="truncate text-sm text-muted">{moodLabel(me.mood) ?? "Pas de statut"}</p>
          </div>
        </div>
        <nav aria-label="Menu">
          <ul>
            <li>
              <button type="button" className={rowClass} onClick={() => setSheet("mood")}>
                <Icon name="smile" className="text-primary-ink" /> Humeur
              </button>
            </li>
            {MENU.map((item) => (
              <li key={item.href}>
                <MenuLink href={item.href} icon={item.icon}>
                  {item.label}
                </MenuLink>
              </li>
            ))}
          </ul>
        </nav>
      </Sheet>
    </>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: IconName; children: ReactNode }) {
  return (
    <Link href={href} className={cn(rowClass)}>
      <Icon name={icon} className="text-primary-ink" /> {children}
    </Link>
  );
}
