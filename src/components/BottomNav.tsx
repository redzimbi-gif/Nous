"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/chat", label: "Chat", icon: "💬", match: ["/chat"] },
  { href: "/photos", label: "Photos", icon: "📷", match: ["/photos"] },
  { href: "/agenda", label: "Agenda", icon: "📅", match: ["/agenda"] },
  { href: "/todo", label: "À faire", icon: "✅", match: ["/todo"] },
  { href: "/plus", label: "Plus", icon: "⋯", match: ["/plus", "/jeux", "/ref"] },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex border-t border-blush-100 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {TABS.map((tab) => {
        const active = tab.match.some((m) => pathname?.startsWith(m));
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
