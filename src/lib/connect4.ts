import type { Connect4Board, Connect4Player } from "./types";

export const ROWS = 6;
export const COLS = 7;

export function createEmptyBoard(): Connect4Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function lowestEmptyRow(board: Connect4Board, col: number): number | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) return r;
  }
  return null;
}

export function dropPiece(
  board: Connect4Board,
  col: number,
  player: Connect4Player
): Connect4Board | null {
  const row = lowestEmptyRow(board, col);
  if (row === null) return null;
  const next = board.map((r) => [...r]);
  next[row][col] = player;
  return next;
}

export function isBoardFull(board: Connect4Board): boolean {
  return board[0].every((cell) => cell !== null);
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

export function calculateWinner(board: Connect4Board): Connect4Player | null {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const player = board[r][c];
      if (!player) continue;
      for (const [dr, dc] of DIRECTIONS) {
        let count = 1;
        for (let step = 1; step < 4; step++) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== player) break;
          count++;
        }
        if (count >= 4) return player;
      }
    }
  }
  return null;
}
