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
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-semibold transition-colors duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blush-300 ${
              active ? "text-blush-600" : "text-blush-300"
            }`}
          >
            <span
              className={`absolute top-0 h-0.5 w-8 rounded-full bg-blush-500 transition-opacity duration-200 ${
                active ? "opacity-100" : "opacity-0"
              }`}
            />
            <span className={`text-xl transition-transform duration-200 ${active ? "scale-110" : ""}`}>
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
