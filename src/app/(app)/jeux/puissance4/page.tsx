"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { Connect4Game, Connect4Player } from "@/lib/types";
import {
  COLS,
  ROWS,
  calculateWinner,
  createEmptyBoard,
  dropPiece,
  isBoardFull,
} from "@/lib/connect4";
import GameReactions from "@/components/GameReactions";
import { sendNotification } from "@/lib/notify";

export default function Puissance4Page() {
  const { name } = useIdentity();
  const [game, setGame] = useState<Connect4Game | null | undefined>(undefined);
  const [score, setScore] = useState<Record<string, number>>({});

  async function loadLatestGame() {
    const { data } = await supabase
      .from("connect4_games")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !data.b_name && data.a_name !== name) {
      const { data: joined } = await supabase
        .from("connect4_games")
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
      .from("connect4_games")
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
      .channel("connect4-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connect4_games" },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as Connect4Game;
          setGame(row);
          if (row.winner) loadScore();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const myRole: Connect4Player | null =
    game?.a_name === name ? "A" : game?.b_name === name ? "B" : null;
  const isMyTurn = !!myRole && !!game && !game.winner && game.turn === myRole;

  async function startNewGame() {
    const { data } = await supabase
      .from("connect4_games")
      .insert({ a_name: name, board: createEmptyBoard(), turn: "A" })
      .select()
      .single();
    if (data) setGame(data);
    sendNotification({
      senderName: name,
      title: "🎮 Nouvelle partie",
      body: `${name} a lancé une partie de puissance 4 !`,
      url: "/jeux/puissance4",
    });
  }

  async function handleDrop(col: number) {
    if (!game || !myRole || !isMyTurn) return;
    const nextBoard = dropPiece(game.board, col, myRole);
    if (!nextBoard) return;
    const winner = calculateWinner(nextBoard);
    const opponent: Connect4Player = myRole === "A" ? "B" : "A";
    const { data, error } = await supabase
      .from("connect4_games")
      .update({
        board: nextBoard,
        turn: opponent,
        winner: winner ?? (isBoardFull(nextBoard) ? "draw" : null),
      })
      .eq("id", game.id)
      .select()
      .single();
    if (error) {
      alert("Coup non enregistré : " + error.message);
      return;
    }
    if (data) setGame(data);
    if (data && !data.winner) {
      sendNotification({
        senderName: name,
        title: "🎮 À toi de jouer",
        body: "C'est ton tour au puissance 4 !",
        url: "/jeux/puissance4",
      });
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/jeux" className="text-xl text-blush-400" aria-label="Retour">
            ←
          </Link>
          <h1 className="text-lg font-extrabold text-blush-700">🔴🟡 Puissance 4</h1>
        </div>
        <div className="flex items-center gap-2">
          <GameReactions gameKey="puissance4" />
          <button
            onClick={startNewGame}
            className="rounded-full bg-blush-500 px-4 py-1.5 text-sm font-bold text-white transition active:scale-95"
          >
            Nouvelle partie
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center gap-3 px-4 py-6">
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
              {game.winner === "draw" && "Match nul ! 🤝"}
              {game.winner === "A" && `${game.a_name} a gagné ! 🎉`}
              {game.winner === "B" && game.b_name && `${game.b_name} a gagné ! 🎉`}
              {!game.winner && !game.b_name && "En attente d'un·e partenaire…"}
              {!game.winner &&
                game.b_name &&
                (isMyTurn ? "À toi de jouer !" : `Au tour de ${game.turn === "A" ? game.a_name : game.b_name}…`)}
              {!game.winner && game.b_name && !myRole && "Partie entre vous deux"}
            </p>

            <div className="grid w-full max-w-[360px] grid-cols-7 gap-1.5 rounded-2xl border-4 border-blush-900 bg-blush-900 p-2 shadow-md">
              {Array.from({ length: ROWS }).map((_, r) =>
                Array.from({ length: COLS }).map((_, c) => {
                  const cell = game.board[r][c];
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleDrop(c)}
                      disabled={!isMyTurn}
                      className="flex aspect-square items-center justify-center rounded-full bg-cream/90 transition active:scale-90 disabled:opacity-100"
                    >
                      {cell && (
                        <span
                          className={`h-[82%] w-[82%] rounded-full shadow-inner ${
                            cell === "A" ? "bg-blush-500" : "bg-sky-400"
                          }`}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <p className="text-xs text-blush-300">
              Toi : {myRole ?? "spectateur"} · {game.a_name} joue en rose 🩷
              {game.b_name ? ` · ${game.b_name} joue en bleu 🩵` : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
