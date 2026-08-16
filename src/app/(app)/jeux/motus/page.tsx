"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { GuessWordGame } from "@/lib/types";
import {
  MAX_ATTEMPTS,
  WORD_LENGTH,
  evaluateGuess,
  keyboardStatuses,
  randomWord,
} from "@/lib/guessword";
import GameReactions from "@/components/GameReactions";
import { sendNotification } from "@/lib/notify";

const KEYBOARD_ROWS = [
  ["A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["Q", "S", "D", "F", "G", "H", "J", "K", "L", "M"],
  ["ENTER", "W", "X", "C", "V", "B", "N", "BACK"],
];

export default function MotusPage() {
  const { name } = useIdentity();
  const [game, setGame] = useState<GuessWordGame | null | undefined>(undefined);
  const [score, setScore] = useState<Record<string, number>>({});
  const [currentGuess, setCurrentGuess] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadLatestGame() {
    const { data } = await supabase
      .from("guessword_games")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !data.b_name && data.a_name !== name) {
      const { data: joined } = await supabase
        .from("guessword_games")
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
      .from("guessword_games")
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
      .channel("guessword-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guessword_games" },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as GuessWordGame;
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

  useEffect(() => {
    setCurrentGuess("");
    setError(null);
  }, [game?.id]);

  const myRole: "A" | "B" | null =
    game?.a_name === name ? "A" : game?.b_name === name ? "B" : null;
  const gameOver = !!game?.winner;
  const isMyTurn = !!myRole && !!game && !gameOver && game.turn === myRole;

  const keyStatuses = useMemo(
    () => (game ? keyboardStatuses(game.guesses, game.word) : {}),
    [game]
  );

  async function startNewGame() {
    const { data } = await supabase
      .from("guessword_games")
      .insert({ a_name: name, word: randomWord(), guesses: [], turn: "A" })
      .select()
      .single();
    if (data) setGame(data);
    sendNotification({
      senderName: name,
      title: "🔤 Nouvelle partie",
      body: `${name} a lancé une partie de Motus !`,
      url: "/jeux/motus",
    });
  }

  function pressLetter(letter: string) {
    if (!isMyTurn || submitting) return;
    setCurrentGuess((g) => (g.length < WORD_LENGTH ? g + letter : g));
  }

  function pressBackspace() {
    if (!isMyTurn || submitting) return;
    setCurrentGuess((g) => g.slice(0, -1));
  }

  async function submitGuess() {
    if (!game || !myRole || !isMyTurn || submitting) return;
    if (currentGuess.length !== WORD_LENGTH) {
      setError("Il manque des lettres");
      setTimeout(() => setError(null), 1500);
      return;
    }
    setSubmitting(true);
    const newGuesses = [...game.guesses, { word: currentGuess, by: myRole }];
    const isCorrect = currentGuess === game.word;
    const lost = !isCorrect && newGuesses.length >= MAX_ATTEMPTS;
    const opponent: "A" | "B" = myRole === "A" ? "B" : "A";
    const { data, error: updateError } = await supabase
      .from("guessword_games")
      .update({
        guesses: newGuesses,
        turn: opponent,
        winner: isCorrect ? myRole : lost ? "draw" : null,
      })
      .eq("id", game.id)
      .select()
      .single();
    if (updateError) {
      alert("Coup non enregistré : " + updateError.message);
      setSubmitting(false);
      return;
    }
    setCurrentGuess("");
    if (data) setGame(data);
    if (data && !data.winner) {
      sendNotification({
        senderName: name,
        title: "🔤 À toi de jouer",
        body: "C'est ton tour au Motus !",
        url: "/jeux/motus",
      });
    }
    setSubmitting(false);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isMyTurn || submitting) return;
      if (e.key === "Enter") {
        submitGuess();
      } else if (e.key === "Backspace") {
        setCurrentGuess((g) => g.slice(0, -1));
      } else {
        const letter = e.key.toUpperCase();
        if (/^[A-Z]$/.test(letter)) {
          setCurrentGuess((g) => (g.length < WORD_LENGTH ? g + letter : g));
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurn, submitting, currentGuess, game]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/jeux" className="text-xl text-blush-400" aria-label="Retour">
            ←
          </Link>
          <h1 className="text-lg font-extrabold text-blush-700">🔤 Motus</h1>
        </div>
        <div className="flex items-center gap-2">
          <GameReactions gameKey="motus" />
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
            <p className="min-h-[1.25rem] text-center text-sm font-semibold text-blush-700">
              {game.winner === "draw" && `Perdu ! Le mot était ${game.word} 😅`}
              {game.winner === "A" && `${game.a_name} a trouvé le mot ! 🎉`}
              {game.winner === "B" && game.b_name && `${game.b_name} a trouvé le mot ! 🎉`}
              {!game.winner && !game.b_name && "En attente d'un·e partenaire…"}
              {!game.winner &&
                game.b_name &&
                (isMyTurn
                  ? "À toi de proposer un mot !"
                  : `Au tour de ${game.turn === "A" ? game.a_name : game.b_name}…`)}
              {!game.winner && game.b_name && !myRole && "Partie entre vous deux"}
            </p>

            <div className="flex flex-col gap-1.5">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, r) => {
                const attempt = game.guesses[r];
                const isCurrentRow = r === game.guesses.length && !gameOver;
                const letters = attempt
                  ? attempt.word.split("")
                  : isCurrentRow
                  ? currentGuess.padEnd(WORD_LENGTH, " ").split("")
                  : Array(WORD_LENGTH).fill(" ");
                const statuses = attempt ? evaluateGuess(attempt.word, game.word) : null;
                return (
                  <div key={r} className="flex justify-center gap-1.5">
                    {letters.map((letter, c) => {
                      const status = statuses?.[c];
                      const filled = letter !== " ";
                      return (
                        <div
                          key={c}
                          className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-xl font-extrabold uppercase ${
                            status === "correct"
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : status === "present"
                              ? "border-amber-400 bg-amber-400 text-white"
                              : status === "absent"
                              ? "border-blush-200 bg-blush-200 text-blush-500"
                              : filled
                              ? "border-blush-300 bg-white text-blush-700"
                              : "border-blush-100 bg-white text-blush-700"
                          }`}
                        >
                          {filled ? letter : ""}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <p className="h-4 text-xs font-semibold text-red-500">{error}</p>

            <div className="flex w-full max-w-sm flex-col gap-1.5">
              {KEYBOARD_ROWS.map((row, i) => (
                <div key={i} className="flex justify-center gap-1">
                  {row.map((key) => {
                    if (key === "ENTER") {
                      return (
                        <button
                          key={key}
                          onClick={submitGuess}
                          disabled={!isMyTurn || submitting}
                          className="flex h-11 flex-[1.5] items-center justify-center rounded-lg bg-blush-500 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                          OK
                        </button>
                      );
                    }
                    if (key === "BACK") {
                      return (
                        <button
                          key={key}
                          onClick={pressBackspace}
                          disabled={!isMyTurn || submitting}
                          className="flex h-11 flex-[1.5] items-center justify-center rounded-lg bg-blush-100 text-sm text-blush-500 transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                          ⌫
                        </button>
                      );
                    }
                    const status = keyStatuses[key];
                    return (
                      <button
                        key={key}
                        onClick={() => pressLetter(key)}
                        disabled={!isMyTurn || submitting}
                        className={`flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-bold transition active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
                          status === "correct"
                            ? "bg-emerald-500 text-white"
                            : status === "present"
                            ? "bg-amber-400 text-white"
                            : status === "absent"
                            ? "bg-blush-200 text-blush-400"
                            : "bg-white text-blush-700 shadow-sm"
                        }`}
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <p className="text-xs text-blush-300">
              Toi : {myRole ?? "spectateur"} · {MAX_ATTEMPTS} essais pour trouver le mot
            </p>
          </>
        )}
      </div>
    </div>
  );
}
