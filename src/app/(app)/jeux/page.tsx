import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageHeading } from "@/components/ui/PageHeading";

const GAMES = [
  { href: "/jeux/morpion", icon: "✕⭕", label: "Morpion", desc: "Le classique en 3 × 3" },
  { href: "/jeux/dames", icon: "⚫⚪", label: "Dames", desc: "Prises obligatoires, dames, le tout" },
  { href: "/jeux/bataille", icon: "🚢", label: "Bataille navale", desc: "Placez votre flotte et coulez l'autre" },
  { href: "/jeux/uno", icon: "🎴", label: "Uno", desc: "Le classique à deux joueurs" },
  { href: "/jeux/puissance4", icon: "🔴🟡", label: "Puissance 4", desc: "Alignez 4 pions avant l'autre" },
  { href: "/jeux/motus", icon: "🔤", label: "Motus", desc: "Devinez le mot en 6 essais, à deux" },
];

export default function JeuxPage() {
  return (
    <div className="h-full overflow-y-auto px-5 pb-6">
      <PageHeading title="Jeux" subtitle="Une partie, à deux, quand vous voulez" />
      <ul className="space-y-3">
        {GAMES.map((game) => (
          <li key={game.href}>
            <Link href={game.href} className="block">
              <Card className="flex items-center gap-4 p-4 transition active:scale-[0.99]">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-tint text-[22px]" aria-hidden="true">
                  {game.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-semibold">{game.label}</span>
                  <span className="block text-sm text-muted">{game.desc}</span>
                </span>
                <Icon name="chevronRight" size={18} className="shrink-0 text-subtle" />
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
