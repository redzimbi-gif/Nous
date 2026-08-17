export type PhotoRow = {
  id: string;
  storage_path: string;
  caption: string | null;
  sender_name: string;
  created_at: string;
};

export type MessageRow = {
  id: string;
  sender_name: string;
  content: string | null;
  photo_id: string | null;
  ref_id: string | null;
  audio_path: string | null;
  ephemeral_path: string | null;
  ephemeral_type: "image" | "video" | null;
  ephemeral_viewed_at: string | null;
  ephemeral_mirrored: boolean;
  saved: boolean;
  created_at: string;
};

export type EventCategory = "date" | "anniversaire" | "voyage" | "travail" | "sport" | "autre";

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  all_day: boolean;
  category: EventCategory;
  created_by: string;
  created_at: string;
};

export type TicTacToeGame = {
  id: string;
  board: string[];
  turn: "X" | "O";
  x_name: string;
  o_name: string | null;
  winner: "X" | "O" | "draw" | null;
  created_at: string;
};

export type TodoCategory =
  | "important"
  | "quotidien"
  | "activites"
  | "restaurants"
  | "repas"
  | "films"
  | "series"
  | "voyages";

export type TodoRow = {
  id: string;
  content: string;
  done: boolean;
  category: TodoCategory | null;
  created_by: string;
  created_at: string;
};

export type Mood =
  | "content"
  | "amoureux"
  | "excite"
  | "motive"
  | "calin"
  | "fier"
  | "zen"
  | "fatigue"
  | "ennuye"
  | "occupe"
  | "affame"
  | "stresse"
  | "anxieux"
  | "triste"
  | "en_colere"
  | "malade";

export type StatusRow = {
  name: string;
  mood: Mood;
  updated_at: string;
};

export type PresenceRow = {
  name: string;
  online: boolean;
  updated_at: string;
};

export type ChatReadRow = {
  name: string;
  last_read_at: string;
};

export type RefRow = {
  id: string;
  title: string;
  link: string | null;
  media_path: string | null;
  media_type: "image" | "video" | null;
  created_by: string;
  created_at: string;
};

export type CheckersPlayer = "A" | "B";

export type CheckersPiece = {
  player: CheckersPlayer;
  king: boolean;
};

export type CheckersBoard = (CheckersPiece | null)[][];

export type CheckersGame = {
  id: string;
  board: CheckersBoard;
  turn: CheckersPlayer;
  a_name: string;
  b_name: string | null;
  winner: CheckersPlayer | null;
  created_at: string;
};

export type ShipCell = { r: number; c: number };
export type Ship = { cells: ShipCell[] };

export type BattleshipGame = {
  id: string;
  a_name: string;
  b_name: string | null;
  a_ships: Ship[] | null;
  b_ships: Ship[] | null;
  a_ready: boolean;
  b_ready: boolean;
  a_shots: ShipCell[];
  b_shots: ShipCell[];
  turn: "A" | "B";
  winner: "A" | "B" | null;
  created_at: string;
};

export type UnoColor = "red" | "yellow" | "green" | "blue";
export type UnoCardColor = UnoColor | "wild";
export type UnoValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "skip"
  | "reverse"
  | "draw2"
  | "wild"
  | "wild4";

export type UnoCard = {
  id: string;
  color: UnoCardColor;
  value: UnoValue;
};

export type UnoGame = {
  id: string;
  a_name: string;
  b_name: string | null;
  hand_a: UnoCard[];
  hand_b: UnoCard[];
  draw_pile: UnoCard[];
  discard_pile: UnoCard[];
  active_color: UnoColor;
  turn: "A" | "B";
  winner: "A" | "B" | null;
  created_at: string;
};

export type Connect4Player = "A" | "B";
export type Connect4Cell = Connect4Player | null;
export type Connect4Board = Connect4Cell[][];

export type Connect4Game = {
  id: string;
  board: Connect4Board;
  turn: Connect4Player;
  a_name: string;
  b_name: string | null;
  winner: Connect4Player | "draw" | null;
  created_at: string;
};

export type GuessWordAttempt = {
  word: string;
  by: "A" | "B";
};

export type GuessWordGame = {
  id: string;
  word: string;
  guesses: GuessWordAttempt[];
  turn: "A" | "B";
  a_name: string;
  b_name: string | null;
  winner: "A" | "B" | "draw" | null;
  created_at: string;
};
