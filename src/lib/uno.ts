import type { UnoCard, UnoColor, UnoValue } from "@/lib/types";

const COLORS: UnoColor[] = ["red", "yellow", "green", "blue"];
const ACTIONS: UnoValue[] = ["skip", "reverse", "draw2"];

export const UNO_COLOR_BG: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-emerald-500",
  blue: "bg-sky-500",
  wild: "bg-gradient-to-br from-red-500 via-amber-400 to-sky-500",
};

export const UNO_COLOR_LABEL: Record<UnoColor, string> = {
  red: "Rouge",
  yellow: "Jaune",
  green: "Vert",
  blue: "Bleu",
};

export function cardSymbol(value: UnoValue): string {
  switch (value) {
    case "skip":
      return "🚫";
    case "reverse":
      return "🔄";
    case "draw2":
      return "+2";
    case "wild":
      return "🎨";
    case "wild4":
      return "+4";
    default:
      return value;
  }
}

export function createDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  let n = 0;
  for (const color of COLORS) {
    deck.push({ id: `c${n++}`, color, value: "0" });
    for (let copy = 0; copy < 2; copy++) {
      for (let i = 1; i <= 9; i++) {
        deck.push({ id: `c${n++}`, color, value: String(i) as UnoValue });
      }
      for (const action of ACTIONS) {
        deck.push({ id: `c${n++}`, color, value: action });
      }
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c${n++}`, color: "wild", value: "wild" });
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c${n++}`, color: "wild", value: "wild4" });
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function dealNewGame(): {
  hand_a: UnoCard[];
  hand_b: UnoCard[];
  draw_pile: UnoCard[];
  discard_pile: UnoCard[];
  active_color: UnoColor;
} {
  const deck = shuffle(createDeck());
  const hand_a = deck.slice(0, 7);
  const hand_b = deck.slice(7, 14);
  const rest = deck.slice(14);

  let firstIndex = rest.findIndex(
    (c) => c.color !== "wild" && /^[0-9]$/.test(c.value)
  );
  if (firstIndex === -1) firstIndex = 0;
  const firstCard = rest[firstIndex];
  const draw_pile = [...rest.slice(0, firstIndex), ...rest.slice(firstIndex + 1)];

  return {
    hand_a,
    hand_b,
    draw_pile,
    discard_pile: [firstCard],
    active_color: firstCard.color as UnoColor,
  };
}

export function canPlay(card: UnoCard, topCard: UnoCard, activeColor: UnoColor): boolean {
  if (card.color === "wild") return true;
  return card.color === activeColor || card.value === topCard.value;
}

export type UnoEffect = "none" | "skip" | "draw2" | "draw4";

export function effectOf(value: UnoValue): UnoEffect {
  if (value === "skip" || value === "reverse") return "skip";
  if (value === "draw2") return "draw2";
  if (value === "wild4") return "draw4";
  return "none";
}
