import { cache } from "react";
import { notFound } from "next/navigation";
import { effectiveTier } from "@/lib/entitlements";
import { isUuid } from "@/lib/ids";
import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Member, Space, SpaceType, Subscription, Task, Tier } from "@/lib/types";

// Les colonnes sont toujours listées : les privilèges de colonne interdisent « select * ».
const SPACE_COLS = "id, type, name, invite_code, palette, together_since, created_at, archived_at";
const MEMBER_COLS = "id, space_id, user_id, kind, role, display_name, color, mood, simplified, joined_at";
const TASK_COLS = "id, space_id, title, category, assignee_id, due_on, created_by, created_at, done_at, done_by";

export interface SpaceSummary {
  id: string;
  type: SpaceType;
  name: string;
  role: "admin" | "member";
  archived: boolean;
}

/** Espaces dont l'utilisateur est membre (la sécurité est assurée par RLS). */
export const getMySpaces = cache(async (): Promise<SpaceSummary[]> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("space_members")
    .select("role, spaces!inner(id, type, name, archived_at)")
    .eq("user_id", user.id)
    .is("left_at", null);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Array<{
    role: "admin" | "member";
    spaces: { id: string; type: SpaceType; name: string; archived_at: string | null };
  }>;
  return rows
    .map((r) => ({ id: r.spaces.id, type: r.spaces.type, name: r.spaces.name, role: r.role, archived: Boolean(r.spaces.archived_at) }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
});

export interface SpaceContext {
  space: Space;
  me: Member;
  members: Member[];
  subscription: Subscription | null;
  tier: Tier;
  overrides: Record<string, boolean>;
}

/** Tout ce qu'il faut pour afficher un espace. Renvoie 404 si l'utilisateur n'en est pas membre. */
export const getSpaceContext = cache(async (spaceId: string): Promise<SpaceContext> => {
  if (!isUuid(spaceId)) notFound();
  const user = await requireUser();
  const supabase = await createClient();

  const [spaceRes, membersRes, subRes, modulesRes] = await Promise.all([
    supabase.from("spaces").select(SPACE_COLS).eq("id", spaceId).maybeSingle(),
    supabase.from("space_members").select(MEMBER_COLS).eq("space_id", spaceId).is("left_at", null).order("joined_at"),
    supabase
      .from("space_subscriptions")
      .select("space_id, tier, holder_id, status, current_period_end")
      .eq("space_id", spaceId)
      .maybeSingle(),
    supabase.from("space_modules").select("module_key, enabled").eq("space_id", spaceId),
  ]);

  const space = spaceRes.data as Space | null;
  const members = (membersRes.data ?? []) as Member[];
  const me = members.find((m) => m.user_id === user.id);
  if (!space || !me) notFound();

  const subscription = (subRes.data as Subscription | null) ?? null;
  const overrides: Record<string, boolean> = {};
  for (const row of (modulesRes.data ?? []) as Array<{ module_key: string; enabled: boolean }>) {
    overrides[row.module_key] = row.enabled;
  }

  return { space, me, members, subscription, tier: effectiveTier(subscription), overrides };
});

export async function getTasks(spaceId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLS)
    .eq("space_id", spaceId)
    .order("done_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getTaskStats(spaceId: string): Promise<{ total: number; done: number }> {
  const supabase = await createClient();
  const [all, done] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("space_id", spaceId),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("space_id", spaceId).not("done_at", "is", null),
  ]);
  return { total: all.count ?? 0, done: done.count ?? 0 };
}
