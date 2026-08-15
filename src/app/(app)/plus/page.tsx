import Link from "next/link";

const ITEMS = [
  { href: "/jeux", icon: "🎮", label: "Jeux", desc: "Morpion, dames" },
  { href: "/ref", icon: "🖼️", label: "Armoire à ref", desc: "Titre, lien, photo/vidéo" },
];

export default function PlusPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="border-b border-blush-100 bg-white px-4 py-3">
        <h1 className="text-lg font-extrabold text-blush-700">⋯ Plus</h1>
      </header>

      <div className="space-y-2 p-4">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
          >
            <span className="text-3xl">{item.icon}</span>
            <span>
              <span className="block font-bold text-blush-800">{item.label}</span>
              <span className="block text-xs text-blush-400">{item.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
