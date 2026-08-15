"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { UnoCard, UnoColor, UnoGame } from "@/lib/types";
import {
  UNO_COLOR_BG,
  UNO_COLOR_LABEL,
  canPlay,
  cardSymbol,
  dealNewGame,
  effectOf,
} from "@/lib/uno";

const COLOR_ORDER: UnoColor[] = ["red", "yellow", "green", "blue"];

export default function UnoPage() {
  const { name } = useIdentity();
  const [game, setGame] = useState<UnoGame | null | undefined>(undefined);
  const [score, setScore] = useState<Record<string, number>>({});
  const [wildPending, setWildPending] = useState<UnoCard | null>(null);

  async function loadLatestGame() {
    const { data } = await supabase
      .from("uno_games")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !data.b_name && data.a_name !== name) {
      const { data: joined } = await supabase
        .from("uno_games")
        .update({ b_name: name })
        .eq("id", data.id)
        .select()
        .single();
      setGame(joined ?? data);
      return;
    }
    setGame(data ?? null);
  }

  async function loadScore() {
    const { data } = await supabase
      .from("uno_games")
      .select("winner, a_name, b_name")
      .not("winner", "is", null);
    if (!data) return;
    const tally: Record<string, number> = {};
    for (const g of data) {
      if (g.winner === "A") tally[g.a_name] = (tally[g.a_name] ?? 0) + 1;
      else if (g.winner === "B" && g.b_name) tally[g.b_name] = (tally[g.b_name] ?? 0) + 1;
    }
    setScore(tally);
  }

  useEffect(() => {
    loadLatestGame();
    loadScore();

    const channel = supabase
      .channel("uno-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "uno_games" },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as UnoGame;
          setGame(row);
          setWildPending(null);
          if (row.winner) loadScore();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const myRole: "A" | "B" | null =
    game?.a_name === name ? "A" : game?.b_name === name ? "B" : null;
  const isMyTurn = !!myRole && !!game && !!game.b_name && !game.winner && game.turn === myRole;

  const myHand: UnoCard[] = (myRole === "A" ? game?.hand_a : game?.hand_b) ?? [];
  const opponentCount = (myRole === "A" ? game?.hand_b?.length : game?.hand_a?.length) ?? 0;
  const topCard = game?.discard_pile[game.discard_pile.length - 1];

  async function startNewGame() {
    const setup = dealNewGame();
    const { data } = await supabase
      .from("uno_games")
      .insert({ a_name: name, ...setup, turn: "A" })
      .select()
      .single();
    if (data) setGame(data);
    setWildPending(null);
  }

  async function playCard(card: UnoCard, chosenColor?: UnoColor) {
    if (!game || !myRole || !isMyTurn || !topCard) return;
    if (!canPlay(card, topCard, game.active_color)) return;
    if (card.color === "wild" && !chosenColor) {
      setWildPending(card);
      return;
    }

    const myKey = myRole === "A" ? "hand_a" : "hand_b";
    const oppKey = myRole === "A" ? "hand_b" : "hand_a";
    const newHand = myHand.filter((c) => c.id !== card.id);
    const newDiscard = [...game.discard_pile, card];
    const newActiveColor: UnoColor =
      card.color === "wild" ? (chosenColor as UnoColor) : (card.color as UnoColor);

    let drawPile = [...game.draw_pile];
    let opponentHand = [...(myRole === "A" ? game.hand_b : game.hand_a)];
    const effect = effectOf(card.value);
    const opponent: "A" | "B" = myRole === "A" ? "B" : "A";
    let nextTurn: "A" | "B" = opponent;

    if (effect === "skip") {
      nextTurn = myRole;
    } else if (effect === "draw2") {
      const drawn = drawPile.slice(0, 2);
      drawPile = drawPile.slice(2);
      opponentHand = [...opponentHand, ...drawn];
      nextTurn = myRole;
    } else if (effect === "draw4") {
      const drawn = drawPile.slice(0, 4);
      drawPile = drawPile.slice(4);
      opponentHand = [...opponentHand, ...drawn];
      nextTurn = myRole;
    }

    const winner = newHand.length === 0 ? myRole : null;

    const update: Record<string, unknown> = {
      [myKey]: newHand,
      [oppKey]: opponentHand,
      draw_pile: drawPile,
      discard_pile: newDiscard,
      active_color: newActiveColor,
      turn: winner ? game.turn : nextTurn,
      winner,
    };

    setWildPending(null);
    const { data, error } = await supabase
      .from("uno_games")
      .update(update)
      .eq("id", game.id)
      .select()
      .single();
    if (error) {
      alert("Coup non enregistré : " + error.message);
      return;
    }
    if (data) setGame(data);
  }

  async function drawCard() {
    if (!game || !myRole || !isMyTurn || game.draw_pile.length === 0) return;
    const drawn = game.draw_pile[0];
    const newDrawPile = game.draw_pile.slice(1);
    const myKey = myRole === "A" ? "hand_a" : "hand_b";
    const newHand = [...myHand, drawn];
    const opponent: "A" | "B" = myRole === "A" ? "B" : "A";

    const { data, error } = await supabase
      .from("uno_games")
      .update({ [myKey]: newHand, draw_pile: newDrawPile, turn: opponent })
      .eq("id", game.id)
      .select()
      .single();
    if (error) {
      alert("Pioche non enregistrée : " + error.message);
      return;
    }
    if (data) setGame(data);
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/jeux" className="text-xl text-blush-400" aria-label="Retour">
            ←
          </Link>
          <h1 className="text-lg font-extrabold text-blush-700">🎴 Uno</h1>
        </div>
        <button
          onClick={startNewGame}
          className="rounded-full bg-blush-500 px-4 py-1.5 text-sm font-bold text-white transition active:scale-95"
        >
          Nouvelle partie
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center gap-3 px-4 py-4">
        {Object.keys(score).length > 0 && (
          <div className="flex gap-4 text-sm font-semibold text-blush-500">
            {Object.entries(score).map(([n, wins]) => (
              <span key={n}>
                {n} : {wins}
              </span>
            ))}
          </div>
        )}

        {game === undefined && <p className="text-sm text-blush-300">Chargement…</p>}

        {game === null && (
          <p className="mt-10 text-center text-sm text-blush-300">
            Aucune partie en cours — lance-en une avec le bouton en haut 👆
          </p>
        )}

        {game && (
          <>
            <p className="text-center text-sm font-semibold text-blush-700">
              {game.winner === "A" && `${game.a_name} a gagné ! 🎉`}
              {game.winner === "B" && game.b_name && `${game.b_name} a gagné ! 🎉`}
              {!game.winner && !game.b_name && "En attente d'un·e partenaire…"}
              {!game.winner &&
                game.b_name &&
                (isMyTurn ? "À toi de jouer !" : `Au tour de ${game.turn === "A" ? game.a_name : game.b_name}…`)}
            </p>

            {!game.winner && game.b_name && myHand.length === 1 && (
              <p className="animate-pop-in text-center text-lg font-extrabold text-blush-500">
                🎉 {myRole === "A" ? game.a_name : game.b_name} a UNO !
              </p>
            )}
            {!game.winner &&
              game.b_name &&
              (myRole === "A" ? game.hand_b : game.hand_a)?.length === 1 && (
                <p className="animate-pop-in text-center text-lg font-extrabold text-sky-500">
                  🎉 {myRole === "A" ? game.b_name : game.a_name} a UNO !
                </p>
              )}

            <div className="flex flex-wrap justify-center gap-1">
              {Array.from({ length: opponentCount }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-7 shrink-0 rounded-md bg-blush-800 shadow-sm"
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 py-2">
              <button
                onClick={drawCard}
                disabled={!isMyTurn || game.draw_pile.length === 0}
                className="flex h-20 w-14 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-blush-300 text-xs font-bold text-blush-400 transition active:scale-90 disabled:opacity-40"
              >
                <span className="text-lg">🂠</span>
                Piocher
                <span className="text-[10px] font-normal">{game.draw_pile.length}</span>
              </button>

              {topCard && (
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-20 w-14 items-center justify-center rounded-xl text-2xl font-extrabold text-white shadow-md ${UNO_COLOR_BG[topCard.color]}`}
                  >
                    {cardSymbol(topCard.value)}
                  </div>
                  <span
                    className={`h-2 w-8 rounded-full ${UNO_COLOR_BG[game.active_color]}`}
                    title={UNO_COLOR_LABEL[game.active_color]}
                  />
                </div>
              )}
            </div>

            {wildPending && (
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-md">
                <p className="text-xs font-semibold text-blush-500">Choisis une couleur</p>
                <div className="flex gap-2">
                  {COLOR_ORDER.map((c) => (
                    <button
                      key={c}
                      onClick={() => playCard(wildPending, c)}
                      className={`h-11 w-11 rounded-full transition active:scale-90 ${UNO_COLOR_BG[c]}`}
                      aria-label={UNO_COLOR_LABEL[c]}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setWildPending(null)}
                  className="text-xs font-semibold text-blush-300"
                >
                  Annuler
                </button>
              </div>
            )}

            <div className="mt-auto w-full">
              <p className="mb-1.5 text-center text-xs font-bold text-blush-400">
                Ta main ({myHand.length})
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {myHand.map((card) => {
                  const playable =
                    isMyTurn && !!topCard && canPlay(card, topCard, game.active_color);
                  return (
                    <button
                      key={card.id}
                      onClick={() => playCard(card)}
                      disabled={!playable}
                      className={`flex h-20 w-14 shrink-0 items-center justify-center rounded-xl text-2xl font-extrabold text-white shadow-md transition active:scale-90 disabled:opacity-40 ${UNO_COLOR_BG[card.color]}`}
                    >
                      {cardSymbol(card.value)}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-blush-300">
              Toi : {myRole ?? "spectateur"} · {game.a_name}
              {game.b_name ? ` vs ${game.b_name}` : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
