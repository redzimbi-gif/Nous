"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { SPACE_TYPE_INFO } from "@/lib/theme";
import type { SpaceType, Tone } from "@/lib/types";

export interface SpaceLink {
  id: string;
  type: SpaceType;
  name: string;
  href: string;
  current: boolean;
}

export interface MenuItem {
  key: string;
  label: string;
  icon: IconName;
  href: string;
}

interface Props {
  space: { type: SpaceType; name: string };
  spaces: SpaceLink[];
  me: { name: string; tone: Tone };
  menu: MenuItem[];
  settingsHref: string;
  createHref?: string;
  joinHref?: string;
  /** Action serveur de déconnexion (absente dans l'aperçu statique). */
  signOut?: () => void | Promise<void>;
}

const rowClass = "flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left text-[17px] font-medium transition active:bg-tint/70";

/**
 * En-tête sobre : à gauche l'espace courant (touche pour en changer), à droite
 * l'avatar qui ouvre le menu. Rien d'autre.
 */
export function AppHeader({ space, spaces, me, menu, settingsHref, createHref = "/espaces/nouveau", joinHref = "/espaces/rejoindre", signOut }: Props) {
  const [sheet, setSheet] = useState<"spaces" | "menu" | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    setSheet(null);
  }, [pathname]);
  const close = () => setSheet(null);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[calc(3.75rem+env(safe-area-inset-top))] items-center justify-between gap-3 bg-bg/75 px-5 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setSheet("spaces")}
          aria-haspopup="dialog"
          aria-label={`Espace ${space.name}. Changer d'espace`}
          className="flex h-11 min-w-0 max-w-[68%] items-center gap-2 rounded-full bg-surface pl-1.5 pr-3 shadow-card ring-1 ring-line transition active:scale-[0.98]"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tint text-tint-ink">
            <Icon name={SPACE_TYPE_INFO[space.type].icon} size={17} />
          </span>
          <span className="truncate font-display text-[15px] font-semibold">{space.name}</span>
          <Icon name="chevronDown" size={16} className="shrink-0 text-subtle" />
        </button>

        <button type="button" onClick={() => setSheet("menu")} aria-haspopup="dialog" aria-label="Menu" className="rounded-full transition active:scale-95">
          <Avatar name={me.name} tone={me.tone} size="md" />
        </button>
      </header>

      <Sheet open={sheet === "spaces"} onClose={close} title="Mes espaces">
        <ul>
          {spaces.map((s) => (
            <li key={s.id}>
              <Link href={s.href} className={cn(rowClass, s.current && "bg-tint/60")} aria-current={s.current ? "true" : undefined}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint text-tint-ink">
                  <Icon name={SPACE_TYPE_INFO[s.type].icon} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{s.name}</span>
                  <span className="block text-sm font-normal text-muted">{SPACE_TYPE_INFO[s.type].label}</span>
                </span>
                {s.current && <Icon name="check" size={20} className="text-primary-ink" />}
              </Link>
            </li>
          ))}
        </ul>
        <div className="my-2 h-px bg-line" />
        <Link href={createHref} className={cn(rowClass, "text-primary-ink")}>
          <Icon name="plus" /> Créer un espace
        </Link>
        <Link href={joinHref} className={cn(rowClass, "text-primary-ink")}>
          <Icon name="arrowRight" /> Rejoindre avec un code
        </Link>
      </Sheet>

      <Sheet open={sheet === "menu"} onClose={close} title="Menu">
        <div className="mb-2 flex items-center gap-3 rounded-3xl bg-bg p-3">
          <Avatar name={me.name} tone={me.tone} size="md" />
          <div className="min-w-0">
            <p className="truncate font-display font-semibold">{me.name}</p>
            <p className="truncate text-sm text-muted">dans {space.name}</p>
          </div>
        </div>
        {menu.length > 0 && (
          <nav aria-label="Modules">
            <ul>
              {menu.map((item) => (
                <li key={item.key}>
                  <MenuLink href={item.href} icon={item.icon}>
                    {item.label}
                  </MenuLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {menu.length > 0 && <div className="my-2 h-px bg-line" />}
        <MenuLink href={settingsHref} icon="settings">
          Réglages
        </MenuLink>
        {signOut && (
          <form action={signOut}>
            <button type="submit" className={cn(rowClass, "text-muted")}>
              <Icon name="logout" className="text-subtle" /> Se déconnecter
            </button>
          </form>
        )}
      </Sheet>
    </>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: IconName; children: ReactNode }) {
  return (
    <Link href={href} className={rowClass}>
      <Icon name={icon} className="text-primary-ink" /> {children}
    </Link>
  );
}
