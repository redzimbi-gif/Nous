"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/accueil", label: "Accueil", icon: "home" },
  { href: "/chat", label: "Chat", icon: "chat" },
  { href: "/photos", label: "Photos", icon: "photo" },
  { href: "/agenda", label: "Agenda", icon: "calendar" },
  { href: "/todo", label: "À faire", icon: "tasks" },
];

/** Barre du bas : cinq icônes ; seul l'onglet actif affiche son nom. */
export default function BottomNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Navigation principale" className="flex shrink-0 justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
      <ul className="flex w-full max-w-[420px] items-center justify-between rounded-full bg-surface p-1.5 shadow-float ring-1 ring-line">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
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
                  aria-hidden="true"
                  className={cn(
                    "overflow-hidden whitespace-nowrap font-display text-sm font-semibold transition-all duration-300",
                    active ? "ml-2 max-w-24 opacity-100" : "ml-0 max-w-0 opacity-0",
                  )}
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
