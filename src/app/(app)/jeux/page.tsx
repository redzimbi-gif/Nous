import Link from "next/link";

const GAMES = [
  {
    href: "/jeux/morpion",
    icon: "✕⭕",
    label: "Morpion",
    desc: "Le classique en 3x3",
  },
  {
    href: "/jeux/dames",
    icon: "⚫⚪",
    label: "Dames",
    desc: "Prises obligatoires, dames, le tout",
  },
  {
    href: "/jeux/bataille",
    icon: "🚢",
    label: "Bataille navale",
    desc: "Place ta flotte et coule l'autre",
  },
];

export default function JeuxPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="border-b border-blush-100 bg-white px-4 py-3">
        <h1 className="text-lg font-extrabold text-blush-700">🎮 Jeux</h1>
      </header>

      <div className="space-y-2 p-4">
        {GAMES.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition active:scale-[0.98]"
          >
            <span className="text-3xl">{game.icon}</span>
            <span>
              <span className="block font-bold text-blush-800">{game.label}</span>
              <span className="block text-xs text-blush-400">{game.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
