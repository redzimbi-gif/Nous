"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { BattleshipGame, Ship, ShipCell } from "@/lib/types";
import {
  GRID_SIZE,
  SHIP_DEFS,
  allSunk,
  canPlace,
  isHit,
  isShipSunk,
  randomPlacement,
  shipAt,
  shipCellsFrom,
  sunkShips,
  type Orientation,
} from "@/lib/battleship";
import GameReactions from "@/components/GameReactions";
import { sendNotification } from "@/lib/notify";

export default function BatailleNavalePage() {
  const { name } = useIdentity();
  const [game, setGame] = useState<BattleshipGame | null | undefined>(undefined);
  const [score, setScore] = useState<Record<string, number>>({});
  const [draftShips, setDraftShips] = useState<Ship[]>([]);
  const [orientation, setOrientation] = useState<Orientation>("h");
  const [placementMsg, setPlacementMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastShotResult, setLastShotResult] = useState<
    "hit" | "miss" | "sunk" | null
  >(null);

  async function loadLatestGame() {
    const { data } = await supabase
      .from("battleship_games")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !data.b_name && data.a_name !== name) {
      const { data: joined } = await supabase
        .from("battleship_games")
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
      .from("battleship_games")
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
      .channel("battleship-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "battleship_games" },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as BattleshipGame;
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
    setDraftShips([]);
    setOrientation("h");
    setPlacementMsg(null);
  }, [game?.id]);

  const myRole: "A" | "B" | null =
    game?.a_name === name ? "A" : game?.b_name === name ? "B" : null;

  const myShips: Ship[] = ((myRole === "A" ? game?.a_ships : game?.b_ships) ?? []) as Ship[];
  const myShots: ShipCell[] = (myRole === "A" ? game?.a_shots : game?.b_shots) ?? [];
  const opponentShots: ShipCell[] = (myRole === "A" ? game?.b_shots : game?.a_shots) ?? [];
  const opponentShips: Ship[] = ((myRole === "A" ? game?.b_ships : game?.a_ships) ?? []) as Ship[];

  const iAmReady = myRole === "A" ? game?.a_ready : myRole === "B" ? game?.b_ready : false;
  const partnerReady = myRole === "A" ? game?.b_ready : myRole === "B" ? game?.a_ready : false;
  const bothReady = !!game?.a_ready && !!game?.b_ready;
  const isMyTurn = !!myRole && !!game && bothReady && !game.winner && game.turn === myRole;

  const nextShipDef = SHIP_DEFS[draftShips.length];

  const fleetSunk = useMemo(
    () => sunkShips(opponentShips, myShots).length,
    [opponentShips, myShots]
  );

  async function startNewGame() {
    const { data } = await supabase
      .from("battleship_games")
      .insert({ a_name: name })
      .select()
      .single();
    if (data) setGame(data);
    sendNotification({
      senderName: name,
      title: "🎮 Nouvelle partie",
      body: `${name} a lancé une partie de bataille navale !`,
      url: "/jeux/bataille",
    });
  }

  function handlePlacementCellClick(r: number, c: number) {
    if (!nextShipDef) return;
    const cells = shipCellsFrom(r, c, nextShipDef.length, orientation);
    if (!canPlace(draftShips, cells)) {
      setPlacementMsg("Ça dépasse la grille ou ça touche un autre navire !");
      setTimeout(() => setPlacementMsg(null), 1800);
      return;
    }
    setDraftShips([...draftShips, { cells }]);
  }

  async function confirmReady() {
    if (!game || !myRole || draftShips.length !== SHIP_DEFS.length) return;
    setSubmitting(true);
    const field = myRole === "A" ? "a_ships" : "b_ships";
    const readyField = myRole === "A" ? "a_ready" : "b_ready";
    const { data, error } = await supabase
      .from("battleship_games")
      .update({ [field]: draftShips, [readyField]: true })
      .eq("id", game.id)
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      alert("Flotte non enregistrée : " + error.message);
      return;
    }
    if (data) setGame(data);
  }

  async function handleFire(r: number, c: number) {
    if (!game || !myRole || !isMyTurn) return;
    if (myShots.some((s) => s.r === r && s.c === c)) return;
    const newShots = [...myShots, { r, c }];
    const hitShip = shipAt(opponentShips, { r, c });
    const won = allSunk(opponentShips, newShots);
    const sunkThisShip = hitShip ? isShipSunk(hitShip, newShots) : false;
    setLastShotResult(won || sunkThisShip ? "sunk" : hitShip ? "hit" : "miss");
    setTimeout(() => setLastShotResult(null), 2000);
    const opponent: "A" | "B" = myRole === "A" ? "B" : "A";
    const field = myRole === "A" ? "a_shots" : "b_shots";
    const { data, error } = await supabase
      .from("battleship_games")
      .update({ [field]: newShots, turn: opponent, winner: won ? myRole : null })
      .eq("id", game.id)
      .select()
      .single();
    if (error) {
      alert("Tir non enregistré : " + error.message);
      return;
    }
    if (data) setGame(data);
    if (data && !won) {
      sendNotification({
        senderName: name,
        title: "🎮 À toi de jouer",
        body: "C'est ton tour à la bataille navale !",
        url: "/jeux/bataille",
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
          <h1 className="text-lg font-extrabold text-blush-700">🚢 Bataille navale</h1>
        </div>
        <div className="flex items-center gap-2">
          <GameReactions gameKey="bataille" />
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

        {game && !myRole && (
          <p className="mt-10 text-center text-sm text-blush-300">
            Partie déjà en cours entre {game.a_name} et {game.b_name} — attends la
            prochaine 👀
          </p>
        )}

        {game && myRole && !iAmReady && (
          <>
            <div className="flex flex-wrap justify-center gap-1.5">
              {SHIP_DEFS.map((def, i) => (
                <span
                  key={def.name}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    i < draftShips.length
                      ? "bg-emerald-100 text-emerald-700"
                      : i === draftShips.length
                      ? "bg-blush-500 text-white"
                      : "bg-blush-50 text-blush-300"
                  }`}
                >
                  {def.name} ({def.length})
                </span>
              ))}
            </div>

            <p className="text-center text-sm font-semibold text-blush-700">
              {nextShipDef
                ? `Place ton ${nextShipDef.name.toLowerCase()} (${nextShipDef.length} cases)`
                : "Flotte complète !"}
            </p>

            <div className="grid w-full max-w-[360px] grid-cols-10 gap-[2px] rounded-lg bg-blush-100 p-[2px]">
              {Array.from({ length: GRID_SIZE }).map((_, r) =>
                Array.from({ length: GRID_SIZE }).map((_, c) => {
                  const occupied = isHit(draftShips, { r, c });
                  return (
                    <button
                      key={`pl-${r}-${c}`}
                      onClick={() => handlePlacementCellClick(r, c)}
                      disabled={!nextShipDef}
                      className={`aspect-square rounded-[3px] ${
                        occupied ? "bg-blush-500" : "bg-white active:bg-blush-50"
                      }`}
                    />
                  );
                })
              )}
            </div>

            {placementMsg && (
              <p className="text-center text-xs font-semibold text-red-500">
                {placementMsg}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setOrientation((o) => (o === "h" ? "v" : "h"))}
                className="rounded-full bg-blush-100 px-3 py-1.5 text-xs font-bold text-blush-600"
              >
                {orientation === "h" ? "↔ Horizontal" : "↕ Vertical"}
              </button>
              <button
                onClick={() => setDraftShips(randomPlacement())}
                className="rounded-full bg-blush-100 px-3 py-1.5 text-xs font-bold text-blush-600"
              >
                🎲 Aléatoire
              </button>
              <button
                onClick={() => setDraftShips(draftShips.slice(0, -1))}
                disabled={!draftShips.length}
                className="rounded-full bg-blush-100 px-3 py-1.5 text-xs font-bold text-blush-600 disabled:opacity-40"
              >
                ↩ Annuler
              </button>
            </div>

            {draftShips.length === SHIP_DEFS.length && (
              <button
                onClick={confirmReady}
                disabled={submitting}
                className="w-full max-w-[360px] rounded-xl bg-emerald-500 py-3 font-bold text-white disabled:opacity-60"
              >
                {submitting ? "…" : "Prêt ! ⚓"}
              </button>
            )}
          </>
        )}

        {game && myRole && iAmReady && !bothReady && (
          <div className="mt-10 text-center">
            <p className="text-4xl">⏳</p>
            <p className="mt-2 text-sm text-blush-400">
              Ta flotte est prête ! En attente que{" "}
              {myRole === "A" ? game.b_name : game.a_name} place la sienne…
            </p>
          </div>
        )}

        {game && myRole && bothReady && (
          <>
            <p className="text-center text-sm font-semibold text-blush-700">
              {game.winner && game.winner === myRole && "Tu as gagné ! 🎉"}
              {game.winner && game.winner !== myRole && "Tu as perdu… 😢"}
              {!game.winner &&
                (isMyTurn
                  ? "À toi de tirer !"
                  : `Au tour de ${game.turn === "A" ? game.a_name : game.b_name}…`)}
            </p>

            {lastShotResult && (
              <p className="text-center text-sm font-bold text-blush-500">
                {lastShotResult === "sunk" && "🔥 Coulé !"}
                {lastShotResult === "hit" && "💥 Touché !"}
                {lastShotResult === "miss" && "🌊 À l'eau !"}
              </p>
            )}

            <div className="w-full max-w-[360px]">
              <p className="mb-1 text-center text-xs font-bold text-blush-400">
                Flotte adverse — {fleetSunk}/{SHIP_DEFS.length} coulés
              </p>
              <div className="grid grid-cols-10 gap-[2px] rounded-lg bg-blush-200 p-[2px]">
                {Array.from({ length: GRID_SIZE }).map((_, r) =>
                  Array.from({ length: GRID_SIZE }).map((_, c) => {
                    const shot = myShots.some((s) => s.r === r && s.c === c);
                    const hit = shot && isHit(opponentShips, { r, c });
                    const ship = shot ? shipAt(opponentShips, { r, c }) : null;
                    const sunk = ship ? isShipSunk(ship, myShots) : false;
                    return (
                      <button
                        key={`atk-${r}-${c}`}
                        onClick={() => handleFire(r, c)}
                        disabled={!isMyTurn || shot}
                        className={`aspect-square rounded-[3px] text-xs ${
                          !shot
                            ? "bg-sky-50 active:bg-sky-100"
                            : sunk
                            ? "bg-red-700"
                            : hit
                            ? "bg-red-400"
                            : "bg-sky-200"
                        }`}
                      >
                        {shot && (hit ? "🔥" : "•")}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="w-full max-w-[360px]">
              <p className="mb-1 text-center text-xs font-bold text-blush-400">Ta flotte</p>
              <div className="grid grid-cols-10 gap-[2px] rounded-lg bg-blush-100 p-[2px]">
                {Array.from({ length: GRID_SIZE }).map((_, r) =>
                  Array.from({ length: GRID_SIZE }).map((_, c) => {
                    const hasShip = isHit(myShips, { r, c });
                    const shot = opponentShots.some((s) => s.r === r && s.c === c);
                    const ship = hasShip ? shipAt(myShips, { r, c }) : null;
                    const sunk = ship ? isShipSunk(ship, opponentShots) : false;
                    return (
                      <div
                        key={`def-${r}-${c}`}
                        className={`flex aspect-square items-center justify-center rounded-[3px] text-[10px] ${
                          sunk
                            ? "bg-red-700"
                            : shot && hasShip
                            ? "bg-red-400"
                            : hasShip
                            ? "bg-blush-400"
                            : shot
                            ? "bg-blush-50"
                            : "bg-white"
                        }`}
                      >
                        {shot && (hasShip ? "🔥" : "•")}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <p className="text-xs text-blush-300">
              Toi : {myRole} · {game.a_name} vs {game.b_name}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
