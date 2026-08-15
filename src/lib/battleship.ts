import type { Ship, ShipCell } from "@/lib/types";

export const GRID_SIZE = 10;

export type Orientation = "h" | "v";

export const SHIP_DEFS = [
  { name: "Porte-avions", length: 5 },
  { name: "Cuirassé", length: 4 },
  { name: "Croiseur", length: 3 },
  { name: "Sous-marin", length: 3 },
  { name: "Torpilleur", length: 2 },
];

export function cellKey(cell: ShipCell): string {
  return `${cell.r},${cell.c}`;
}

export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
}

export function shipCellsFrom(
  r: number,
  c: number,
  length: number,
  dir: Orientation
): ShipCell[] {
  const cells: ShipCell[] = [];
  for (let i = 0; i < length; i++) {
    cells.push(dir === "h" ? { r, c: c + i } : { r: r + i, c });
  }
  return cells;
}

export function canPlace(existing: Ship[], cells: ShipCell[]): boolean {
  if (cells.some((cell) => !inBounds(cell.r, cell.c))) return false;
  const occupied = new Set(existing.flatMap((s) => s.cells).map(cellKey));
  return cells.every((cell) => !occupied.has(cellKey(cell)));
}

export function randomPlacement(): Ship[] {
  const ships: Ship[] = [];
  for (const def of SHIP_DEFS) {
    let placed = false;
    while (!placed) {
      const dir: Orientation = Math.random() < 0.5 ? "h" : "v";
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);
      const cells = shipCellsFrom(r, c, def.length, dir);
      if (canPlace(ships, cells)) {
        ships.push({ cells });
        placed = true;
      }
    }
  }
  return ships;
}

export function shipAt(ships: Ship[], cell: ShipCell): Ship | null {
  return (
    ships.find((s) => s.cells.some((sc) => sc.r === cell.r && sc.c === cell.c)) ??
    null
  );
}

export function isHit(ships: Ship[], cell: ShipCell): boolean {
  return !!shipAt(ships, cell);
}

export function isShipSunk(ship: Ship, shots: ShipCell[]): boolean {
  const shotKeys = new Set(shots.map(cellKey));
  return ship.cells.every((cell) => shotKeys.has(cellKey(cell)));
}

export function sunkShips(ships: Ship[], shots: ShipCell[]): Ship[] {
  return ships.filter((s) => isShipSunk(s, shots));
}

export function allSunk(ships: Ship[], shots: ShipCell[]): boolean {
  return ships.length > 0 && ships.every((s) => isShipSunk(s, shots));
}
