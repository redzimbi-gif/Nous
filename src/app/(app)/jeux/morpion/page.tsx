"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { TicTacToeGame } from "@/lib/types";
import { calculateWinner, isBoardFull, EMPTY_BOARD } from "@/lib/tictactoe";
import GameReactions from "@/components/GameReactions";
import { sendNotification } from "@/lib/notify";

export default function MorpionPage() {
  const { name } = useIdentity();
  const [game, setGame] = useState<TicTacToeGame | null | undefined>(undefined);
  const [score, setScore] = useState<Record<string, number>>({});

  async function loadLatestGame() {
    const { data } = await supabase
      .from("tictactoe_games")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !data.o_name && data.x_name !== name) {
      const { data: joined } = await supabase
        .from("tictactoe_games")
        .update({ o_name: name })
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
      .from("tictactoe_games")
      .select("winner, x_name, o_name")
      .not("winner", "is", null);
    if (!data) return;
    const tally: Record<string, number> = {};
    for (const g of data) {
      if (g.winner === "X") tally[g.x_name] = (tally[g.x_name] ?? 0) + 1;
      else if (g.winner === "O" && g.o_name) tally[g.o_name] = (tally[g.o_name] ?? 0) + 1;
    }
    setScore(tally);
  }

  useEffect(() => {
    loadLatestGame();
    loadScore();

    const channel = supabase
      .channel("tictactoe-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tictactoe_games" },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as TicTacToeGame;
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

  const myRole: "X" | "O" | null =
    game?.x_name === name ? "X" : game?.o_name === name ? "O" : null;
  const isMyTurn = !!myRole && !!game && !game.winner && game.turn === myRole;

  async function startNewGame() {
    const { data } = await supabase
      .from("tictactoe_games")
      .insert({ x_name: name, board: EMPTY_BOARD, turn: "X" })
      .select()
      .single();
    if (data) setGame(data);
    sendNotification({
      senderName: name,
      title: "🎮 Nouvelle partie",
      body: `${name} a lancé une partie de morpion !`,
      url: "/jeux/morpion",
    });
  }

  async function handleCellClick(index: number) {
    if (!game || !isMyTurn || game.board[index]) return;
    const board = [...game.board];
    board[index] = myRole as string;
    const winner = calculateWinner(board);
    const { data, error } = await supabase
      .from("tictactoe_games")
      .update({
        board,
        turn: myRole === "X" ? "O" : "X",
        winner: winner ?? (isBoardFull(board) ? "draw" : null),
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
        body: "C'est ton tour au morpion !",
        url: "/jeux/morpion",
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
          <h1 className="text-lg font-extrabold text-blush-700">✕⭕ Morpion</h1>
        </div>
        <div className="flex items-center gap-2">
          <GameReactions gameKey="tictactoe" />
          <button
            onClick={startNewGame}
            className="rounded-full bg-blush-500 px-4 py-1.5 text-sm font-bold text-white"
          >
            Nouvelle partie
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
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
            <p className="text-center font-semibold text-blush-700">
              {game.winner === "draw" && "Match nul ! 🤝"}
              {game.winner === "X" && `${game.x_name} a gagné ! 🎉`}
              {game.winner === "O" && `${game.o_name} a gagné ! 🎉`}
              {!game.winner && !game.o_name && "En attente d'un·e partenaire…"}
              {!game.winner && game.o_name && (isMyTurn ? "À toi de jouer !" : `Au tour de ${game.turn === "X" ? game.x_name : game.o_name}…`)}
              {!game.winner && game.o_name && !myRole && "Partie entre vous deux"}
            </p>

            <div className="grid w-full max-w-[280px] grid-cols-3 gap-2">
              {game.board.map((cell, i) => (
                <button
                  key={i}
                  onClick={() => handleCellClick(i)}
                  disabled={!isMyTurn || !!cell || !!game.winner}
                  className="flex aspect-square items-center justify-center rounded-2xl bg-white text-4xl font-bold shadow-sm disabled:opacity-100"
                >
                  {cell === "X" && <span className="text-blush-500">✕</span>}
                  {cell === "O" && <span className="text-sky-500">○</span>}
                </button>
              ))}
            </div>

            <p className="text-xs text-blush-300">
              Toi : {myRole ?? "spectateur"} · {game.x_name} joue ✕
              {game.o_name ? ` · ${game.o_name} joue ○` : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
