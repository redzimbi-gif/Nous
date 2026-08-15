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
  created_at: string;
};

export type EventCategory = "date" | "anniversaire" | "voyage" | "travail" | "autre";

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

export type TodoRow = {
  id: string;
  content: string;
  done: boolean;
  created_by: string;
  created_at: string;
};

export type Mood =
  | "content"
  | "amoureux"
  | "fatigue"
  | "stresse"
  | "triste"
  | "en_colere"
  | "malade"
  | "zen";

export type StatusRow = {
  name: string;
  mood: Mood;
  updated_at: string;
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
