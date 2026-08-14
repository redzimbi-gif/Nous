"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/photos", label: "Photos", icon: "📷" },
  { href: "/agenda", label: "Agenda", icon: "📅" },
  { href: "/jeux", label: "Jeux", icon: "🎮" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex border-t border-blush-100 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-semibold transition ${
              active ? "text-blush-600" : "text-blush-300"
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
