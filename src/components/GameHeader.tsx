"use client";

import Link from "next/link";
import GameReactions from "@/components/GameReactions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** En-tête commun des jeux : retour à la liste, nom du jeu, réactions et nouvelle partie. */
export default function GameHeader({ title, gameKey, onNewGame }: { title: string; gameKey: string; onNewGame: () => void }) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <Link href="/jeux" aria-label="Retour aux jeux" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary-ink ring-1 ring-line transition active:scale-90">
          <Icon name="chevronLeft" size={20} />
        </Link>
        <h1 className="truncate font-display text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <GameReactions gameKey={gameKey} />
        <Button size="sm" onClick={onNewGame} className="shrink-0">
          Nouvelle partie
        </Button>
      </div>
    </header>
  );
}
