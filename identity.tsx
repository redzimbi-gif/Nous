"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Identity = { name: string; color: string };

const IdentityContext = createContext<Identity | null>(null);

const NAME_KEY = "nous_display_name";
const COLOR_KEY = "nous_display_color";

export const COLORS = ["blush", "sky", "mint", "amber", "violet"] as const;

export const COLOR_CLASSES: Record<string, { bg: string; ring: string }> = {
  blush: { bg: "bg-blush-500", ring: "ring-blush-500" },
  sky: { bg: "bg-sky-400", ring: "ring-sky-400" },
  mint: { bg: "bg-emerald-400", ring: "ring-emerald-400" },
  amber: { bg: "bg-amber-400", ring: "ring-amber-400" },
  violet: { bg: "bg-violet-400", ring: "ring-violet-400" },
};

export function useIdentity(): Identity {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within IdentityProvider");
  return ctx;
}

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null | undefined>(undefined);

  useEffect(() => {
    const name = window.localStorage.getItem(NAME_KEY);
    const color = window.localStorage.getItem(COLOR_KEY) || "blush";
    setIdentity(name ? { name, color } : null);
  }, []);

  function save(name: string, color: string) {
    window.localStorage.setItem(NAME_KEY, name.trim());
    window.localStorage.setItem(COLOR_KEY, color);
    setIdentity({ name: name.trim(), color });
  }

  if (identity === undefined) return null;
  if (identity === null) return <NamePrompt onSave={save} />;

  return (
    <IdentityContext.Provider value={identity}>
      {children}
    </IdentityContext.Provider>
  );
}

function NamePrompt({ onSave }: { onSave: (name: string, color: string) => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>("blush");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name, color);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blush-900/40 px-6 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-xl"
      >
        <div className="mb-3 text-3xl">👋</div>
        <h2 className="mb-1 text-lg font-bold text-blush-700">
          Comment tu t&apos;appelles ?
        </h2>
        <p className="mb-4 text-sm text-blush-400">
          Pour savoir qui a écrit quoi
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton prénom"
          className="mb-4 w-full rounded-xl border-2 border-blush-200 px-4 py-3 text-center outline-none focus:border-blush-400"
        />
        <div className="mb-5 flex justify-center gap-2">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full ${COLOR_CLASSES[c].bg} ${
                color === c ? `ring-2 ring-offset-2 ${COLOR_CLASSES[c].ring}` : ""
              }`}
              aria-label={c}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full rounded-xl bg-blush-500 py-3 font-bold text-white disabled:opacity-50"
        >
          C&apos;est parti
        </button>
      </form>
    </div>
  );
}
