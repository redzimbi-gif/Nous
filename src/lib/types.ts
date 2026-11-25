// Types des lignes lues depuis Supabase (à remplacer par les types générés
// quand le projet Supabase de la v2 sera créé : `supabase gen types typescript`).

export type SpaceType = "couple" | "amis" | "famille";
export type Tier = "free" | "plus" | "max";
export type Tone = "lilac" | "rose" | "sun" | "mint" | "sky" | "peach";

export interface Space {
  id: string;
  type: SpaceType;
  name: string;
  invite_code: string;
  palette: string;
  together_since: string | null;
  created_at: string;
  archived_at: string | null;
}

export interface Member {
  id: string;
  space_id: string;
  user_id: string | null;
  kind: "account" | "supervised";
  role: "admin" | "member";
  display_name: string;
  color: Tone;
  mood: string | null;
  simplified: boolean;
  joined_at: string;
}

export interface Subscription {
  space_id: string;
  tier: Tier;
  holder_id: string | null;
  status: "active" | "past_due" | "canceled";
  current_period_end: string | null;
}

export interface Task {
  id: string;
  space_id: string;
  title: string;
  category: string | null;
  assignee_id: string | null;
  due_on: string | null;
  created_by: string | null;
  created_at: string;
  done_at: string | null;
  done_by: string | null;
}

export const TONES: Tone[] = ["lilac", "rose", "sun", "mint", "sky", "peach"];
export const SPACE_TYPES: SpaceType[] = ["couple", "amis", "famille"];

export function isTone(value: unknown): value is Tone {
  return typeof value === "string" && (TONES as string[]).includes(value);
}

export function isSpaceType(value: unknown): value is SpaceType {
  return typeof value === "string" && (SPACE_TYPES as string[]).includes(value);
}
