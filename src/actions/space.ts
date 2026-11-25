"use server";

import { revalidatePath } from "next/cache";
import { getSpaceContext } from "@/lib/data";
import { isMood } from "@/lib/moods";
import { createClient } from "@/lib/supabase/server";
import { isTone } from "@/lib/types";
import { MODULES } from "@/modules/registry";

export interface FormState {
  error?: string;
  ok?: boolean;
}

const clean = (value: FormDataEntryValue | null) => String(value ?? "").replace(/\s+/g, " ").trim();

// ----------------------------------------------------------------- profil
export async function updateProfile(spaceId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { me } = await getSpaceContext(spaceId);
  const displayName = clean(formData.get("displayName"));
  const color = formData.get("color");
  if (displayName.length < 1 || displayName.length > 40) return { error: "Ton prénom doit faire entre 1 et 40 caractères." };
  if (!isTone(color)) return { error: "Choisis une couleur." };

  const supabase = await createClient();
  const { error } = await supabase.from("space_members").update({ display_name: displayName, color }).eq("id", me.id);
  if (error) return { error: "Impossible d'enregistrer pour le moment." };
  revalidatePath(`/s/${spaceId}`, "layout");
  return { ok: true };
}

export async function setMood(spaceId: string, mood: string | null) {
  const { me } = await getSpaceContext(spaceId);
  if (mood !== null && !isMood(mood)) return;
  const supabase = await createClient();
  await supabase.from("space_members").update({ mood, mood_set_at: mood ? new Date().toISOString() : null }).eq("id", me.id);
  revalidatePath(`/s/${spaceId}`, "layout");
}

// ---------------------------------------------------------------- admin
export async function regenerateInviteCode(spaceId: string) {
  await getSpaceContext(spaceId);
  const supabase = await createClient();
  await supabase.rpc("regenerate_invite_code", { p_space: spaceId });
  revalidatePath(`/s/${spaceId}`, "layout");
}

export async function setModuleEnabled(spaceId: string, moduleKey: string, enabled: boolean) {
  await getSpaceContext(spaceId);
  const def = MODULES.find((m) => m.key === moduleKey);
  if (!def || def.core) return;
  const supabase = await createClient();
  await supabase
    .from("space_modules")
    .upsert({ space_id: spaceId, module_key: def.key, enabled, updated_at: new Date().toISOString() }, { onConflict: "space_id,module_key" });
  revalidatePath(`/s/${spaceId}`, "layout");
}

// ----------------------------------------------------------------- tâches
export async function addTask(spaceId: string, formData: FormData): Promise<FormState> {
  const { me } = await getSpaceContext(spaceId);
  const title = clean(formData.get("title"));
  if (title.length < 1 || title.length > 200) return { error: "Écris une tâche de 200 caractères maximum." };
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({ space_id: spaceId, title, created_by: me.id });
  if (error) return { error: "Impossible d'ajouter la tâche pour le moment." };
  revalidatePath(`/s/${spaceId}`, "layout");
  return { ok: true };
}

export async function toggleTask(spaceId: string, taskId: string, done: boolean) {
  const { me } = await getSpaceContext(spaceId);
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ done_at: done ? new Date().toISOString() : null, done_by: done ? me.id : null })
    .eq("id", taskId)
    .eq("space_id", spaceId);
  revalidatePath(`/s/${spaceId}`, "layout");
}

export async function deleteTask(spaceId: string, taskId: string) {
  await getSpaceContext(spaceId);
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId).eq("space_id", spaceId);
  revalidatePath(`/s/${spaceId}`, "layout");
}
