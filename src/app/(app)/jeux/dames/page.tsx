"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { CheckersGame, CheckersPlayer } from "@/lib/types";
import {
  applyMove,
  countPieces,
  createInitialBoard,
  hasAnyMove,
  hasMoreCaptures,
  legalMovesFor,
  posKey,
  type CheckersMove,
  type CheckersPos,
} from "@/lib/checkers";
import GameReactions from "@/components/GameReactions";
import { sendNotification } from "@/lib/notify";

export default function DamesPage() {
  const { name } = useIdentity();
  const [game, setGame] = useState<CheckersGame | null | undefined>(undefined);
  const [score, setScore] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<CheckersPos | null>(null);
  const [forcedPos, setForcedPos] = useState<CheckersPos | null>(null);

  async function loadLatestGame() {
    const { data } = await supabase
      .from("checkers_games")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !data.b_name && data.a_name !== name) {
      const { data: joined } = await supabase
        .from("checkers_games")
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
      .from("checkers_games")
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
      .channel("checkers-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkers_games" },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as CheckersGame;
          setGame(row);
          setSelected(null);
          setForcedPos(null);
          if (row.winner) loadScore();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const myRole: CheckersPlayer | null =
    game?.a_name === name ? "A" : game?.b_name === name ? "B" : null;
  const isMyTurn = !!myRole && !!game && !game.winner && game.turn === myRole;

  const legalMoves = useMemo(() => {
    if (!game || !myRole || game.winner) return new Map<string, CheckersMove[]>();
    return legalMovesFor(game.board, myRole);
  }, [game, myRole]);

  const allowedOrigins = useMemo(() => {
    if (forcedPos) return new Set([posKey(forcedPos)]);
    return new Set(legalMoves.keys());
  }, [legalMoves, forcedPos]);

  const destinations = useMemo(() => {
    if (!selected) return [];
    return legalMoves.get(posKey(selected)) ?? [];
  }, [legalMoves, selected]);

  async function startNewGame() {
    const { data } = await supabase
      .from("checkers_games")
      .insert({ a_name: name, board: createInitialBoard(), turn: "A" })
      .select()
      .single();
    if (data) setGame(data);
    setSelected(null);
    setForcedPos(null);
    sendNotification({
      senderName: name,
      title: "🎮 Nouvelle partie",
      body: `${name} a lancé une partie de dames !`,
      url: "/jeux/dames",
    });
  }

  async function performMove(from: CheckersPos, move: CheckersMove) {
    if (!game || !myRole) return;
    const { board: nextBoard, promoted } = applyMove(game.board, from, move);
    const opponent: CheckersPlayer = myRole === "A" ? "B" : "A";
    const chains = !!move.captured && !promoted && hasMoreCaptures(nextBoard, move.to);

    let winner: CheckersPlayer | null = null;
    if (countPieces(nextBoard, opponent) === 0) winner = myRole;
    else if (!chains && !hasAnyMove(nextBoard, opponent)) winner = myRole;

    const nextTurn = chains ? myRole : opponent;

    const { data, error } = await supabase
      .from("checkers_games")
      .update({ board: nextBoard, turn: nextTurn, winner })
      .eq("id", game.id)
      .select()
      .single();

    if (error) {
      alert("Coup non enregistré : " + error.message);
      return;
    }
    if (data) setGame(data);
    if (data && !chains && !data.winner) {
      sendNotification({
        senderName: name,
        title: "🎮 À toi de jouer",
        body: "C'est ton tour aux dames !",
        url: "/jeux/dames",
      });
    }
    if (chains) {
      setSelected(move.to);
      setForcedPos(move.to);
    } else {
      setSelected(null);
      setForcedPos(null);
    }
  }

  function handleSquareClick(r: number, c: number) {
    if (!game || !isMyTurn) return;
    const piece = game.board[r][c];

    if (piece && piece.player === myRole && allowedOrigins.has(posKey({ r, c }))) {
      setSelected({ r, c });
      return;
    }

    if (selected) {
      const move = destinations.find((m) => m.to.r === r && m.to.c === c);
      if (move) performMove(selected, move);
    }
  }

  const flip = myRole === "B";

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/jeux" className="text-xl text-blush-400" aria-label="Retour">
            ←
          </Link>
          <h1 className="text-lg font-extrabold text-blush-700">⚫⚪ Dames</h1>
        </div>
        <div className="flex items-center gap-2">
          <GameReactions gameKey="dames" />
          <button
            onClick={startNewGame}
            className="rounded-full bg-blush-500 px-4 py-1.5 text-sm font-bold text-white"
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
              {game.winner === "A" && `${game.a_name} a gagné ! 🎉`}
              {game.winner === "B" && game.b_name && `${game.b_name} a gagné ! 🎉`}
              {!game.winner && !game.b_name && "En attente d'un·e partenaire…"}
              {!game.winner &&
                game.b_name &&
                (isMyTurn
                  ? forcedPos
                    ? "Enchaîne ta prise ! ⚡"
                    : "À toi de jouer !"
                  : `Au tour de ${game.turn === "A" ? game.a_name : game.b_name}…`)}
              {!game.winner && game.b_name && !myRole && "Partie entre vous deux"}
            </p>

            <div className="grid w-full max-w-[360px] grid-cols-8 overflow-hidden rounded-2xl border-4 border-amber-950 shadow-md">
              {Array.from({ length: 8 }).map((_, dr) =>
                Array.from({ length: 8 }).map((_, dc) => {
                  const r = flip ? 7 - dr : dr;
                  const c = flip ? 7 - dc : dc;
                  const dark = (r + c) % 2 === 1;
                  const piece = game.board[r]?.[c];
                  const isSelected = selected?.r === r && selected?.c === c;
                  const isDestination = destinations.some(
                    (m) => m.to.r === r && m.to.c === c
                  );
                  const isEligible =
                    isMyTurn &&
                    !isSelected &&
                    piece?.player === myRole &&
                    allowedOrigins.has(posKey({ r, c }));

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      disabled={!dark || !isMyTurn}
                      className={`relative flex aspect-square items-center justify-center ${
                        dark ? "bg-amber-800" : "bg-amber-50"
                      }`}
                    >
                      {isDestination && (
                        <span className="absolute h-1/4 w-1/4 rounded-full bg-emerald-400/80" />
                      )}
                      {piece && (
                        <span
                          className={`flex h-[76%] w-[76%] items-center justify-center rounded-full shadow-md ${
                            piece.player === "A" ? "bg-blush-500" : "bg-sky-400"
                          } ${isSelected ? "ring-4 ring-emerald-400" : ""} ${
                            isEligible ? "ring-2 ring-amber-300" : ""
                          }`}
                        >
                          {piece.king && <span className="text-sm leading-none">👑</span>}
                        </span>
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
