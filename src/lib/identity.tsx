"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Identity = { name: string; color: string };

const IdentityContext = createContext<Identity | null>(null);

const NAME_KEY = "nous_display_name";
const COLOR_KEY = "nous_display_color";

export const COLORS = ["blush", "sky", "mint", "amber", "violet"] as const;

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

const SWATCH: Record<string, string> = {
  blush: "tone-rose",
  sky: "tone-sky",
  mint: "tone-mint",
  amber: "tone-sun",
  violet: "tone-lilac",
};

function NamePrompt({ onSave }: { onSave: (name: string, color: string) => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>("blush");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name, color);
  }

  return (
    <div className="page-glow fixed inset-0 z-50 flex items-center justify-center bg-bg px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm animate-rise rounded-4xl bg-surface p-7 text-center shadow-float ring-1 ring-line">
        <Logo className="mb-5 justify-center" />
        <h2 className="font-display text-2xl font-bold tracking-tight">Comment tu t&apos;appelles ?</h2>
        <p className="mb-5 mt-1 text-[15px] text-muted">Pour savoir qui a écrit quoi.</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton prénom"
          className="mb-5 h-14 w-full rounded-2xl bg-surface-2 px-4 text-center text-lg font-semibold outline-none ring-1 ring-line transition placeholder:font-normal placeholder:text-subtle focus:ring-2 focus:ring-primary"
        />
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Ta couleur</p>
        <div className="mb-6 flex justify-center gap-1.5">
          {COLORS.map((c) => (
            <button type="button" key={c} onClick={() => setColor(c)} className="flex size-11 items-center justify-center transition active:scale-90" aria-label={c} aria-pressed={color === c}>
              <span className={`${SWATCH[c]} flex size-9 items-center justify-center rounded-full bg-tone-bg text-tone-ink transition ${color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : ""}`}>
                {color === c && <Icon name="check" size={18} />}
              </span>
            </button>
          ))}
        </div>
        <Button type="submit" size="lg" block disabled={!name.trim()}>
          C&apos;est parti
        </Button>
      </form>
    </div>
  );
}
