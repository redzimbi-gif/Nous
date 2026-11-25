"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export interface Tab {
  key: string;
  label: string;
  icon: IconName;
  href: string;
}

/**
 * Barre du bas : cinq icônes seulement. L'onglet actif affiche son nom, les autres
 * restent muets (le nom reste disponible pour les lecteurs d'écran).
 */
export function BottomNav({ tabs, base }: { tabs: Tab[]; base: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === base ? pathname === base : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <nav
      aria-label="Navigation principale"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="pointer-events-auto flex w-full max-w-[420px] items-center justify-between rounded-full bg-surface/85 p-1.5 shadow-float ring-1 ring-line backdrop-blur-xl">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center justify-center rounded-full px-3.5 transition-all duration-300 active:scale-95",
                  active ? "bg-tint text-primary-ink" : "text-subtle hover:text-ink",
                )}
              >
                <Icon name={tab.icon} size={22} strokeWidth={active ? 2.1 : 1.75} />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap font-display text-sm font-semibold transition-all duration-300",
                    active ? "ml-2 max-w-24 opacity-100" : "ml-0 max-w-0 opacity-0",
                  )}
                  aria-hidden="true"
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
