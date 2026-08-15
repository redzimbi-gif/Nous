import type { CheckersBoard, CheckersPlayer } from "@/lib/types";

export type CheckersPos = { r: number; c: number };
export type CheckersMove = { to: CheckersPos; captured?: CheckersPos };

const KING_ROW: Record<CheckersPlayer, number> = { A: 7, B: 0 };

const ALL_DIRS = [
  { dr: -1, dc: -1 },
  { dr: -1, dc: 1 },
  { dr: 1, dc: -1 },
  { dr: 1, dc: 1 },
];

function inBounds(r: number, c: number) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function forwardDirs(player: CheckersPlayer) {
  return ALL_DIRS.filter((d) => (player === "A" ? d.dr === 1 : d.dr === -1));
}

export function posKey(pos: CheckersPos): string {
  return `${pos.r},${pos.c}`;
}

export function createInitialBoard(): CheckersBoard {
  const board: CheckersBoard = Array.from({ length: 8 }, () =>
    Array(8).fill(null)
  );
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[r][c] = { player: "A", king: false };
    }
  }
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[r][c] = { player: "B", king: false };
    }
  }
  return board;
}

export function capturesForPiece(
  board: CheckersBoard,
  pos: CheckersPos
): CheckersMove[] {
  const piece = board[pos.r][pos.c];
  if (!piece) return [];
  const dirs = piece.king ? ALL_DIRS : forwardDirs(piece.player);
  const moves: CheckersMove[] = [];
  for (const { dr, dc } of dirs) {
    const midR = pos.r + dr;
    const midC = pos.c + dc;
    const toR = pos.r + dr * 2;
    const toC = pos.c + dc * 2;
    if (!inBounds(toR, toC)) continue;
    const midPiece = board[midR][midC];
    if (midPiece && midPiece.player !== piece.player && !board[toR][toC]) {
      moves.push({ to: { r: toR, c: toC }, captured: { r: midR, c: midC } });
    }
  }
  return moves;
}

export function simpleMovesForPiece(
  board: CheckersBoard,
  pos: CheckersPos
): CheckersMove[] {
  const piece = board[pos.r][pos.c];
  if (!piece) return [];
  const dirs = piece.king ? ALL_DIRS : forwardDirs(piece.player);
  const moves: CheckersMove[] = [];
  for (const { dr, dc } of dirs) {
    const toR = pos.r + dr;
    const toC = pos.c + dc;
    if (inBounds(toR, toC) && !board[toR][toC]) {
      moves.push({ to: { r: toR, c: toC } });
    }
  }
  return moves;
}

export function movesForPiece(
  board: CheckersBoard,
  pos: CheckersPos
): CheckersMove[] {
  const captures = capturesForPiece(board, pos);
  return captures.length ? captures : simpleMovesForPiece(board, pos);
}

export function allCapturesFor(
  board: CheckersBoard,
  player: CheckersPlayer
): CheckersPos[] {
  const origins: CheckersPos[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (
        piece &&
        piece.player === player &&
        capturesForPiece(board, { r, c }).length
      ) {
        origins.push({ r, c });
      }
    }
  }
  return origins;
}

// Prise obligatoire : si une capture existe pour ce joueur, seules les
// captures sont des coups légaux (pour toutes ses pièces qui en ont une).
export function legalMovesFor(
  board: CheckersBoard,
  player: CheckersPlayer
): Map<string, CheckersMove[]> {
  const result = new Map<string, CheckersMove[]>();
  const forced = allCapturesFor(board, player);
  if (forced.length) {
    for (const pos of forced) {
      result.set(posKey(pos), capturesForPiece(board, pos));
    }
    return result;
  }
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.player === player) {
        const moves = simpleMovesForPiece(board, { r, c });
        if (moves.length) result.set(posKey({ r, c }), moves);
      }
    }
  }
  return result;
}

export function applyMove(
  board: CheckersBoard,
  from: CheckersPos,
  move: CheckersMove
): { board: CheckersBoard; promoted: boolean } {
  const next = board.map((row) => row.slice());
  const piece = next[from.r][from.c];
  if (!piece) return { board: next, promoted: false };
  next[from.r][from.c] = null;
  if (move.captured) next[move.captured.r][move.captured.c] = null;
  const promoted = !piece.king && move.to.r === KING_ROW[piece.player];
  next[move.to.r][move.to.c] = promoted ? { ...piece, king: true } : piece;
  return { board: next, promoted };
}

export function hasMoreCaptures(board: CheckersBoard, pos: CheckersPos): boolean {
  return capturesForPiece(board, pos).length > 0;
}

export function countPieces(board: CheckersBoard, player: CheckersPlayer): number {
  let n = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.player === player) n++;
    }
  }
  return n;
}

export function hasAnyMove(board: CheckersBoard, player: CheckersPlayer): boolean {
  return legalMovesFor(board, player).size > 0;
}
