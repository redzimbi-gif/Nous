"use server";

import { redirect } from "next/navigation";
import { normalizeInviteCode } from "@/lib/invite";
import { createClient } from "@/lib/supabase/server";
import { isSpaceType, isTone } from "@/lib/types";

export interface FormState {
  error?: string;
}

const clean = (value: FormDataEntryValue | null) => String(value ?? "").replace(/\s+/g, " ").trim();

export async function createSpace(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = clean(formData.get("name"));
  const displayName = clean(formData.get("displayName"));
  const type = formData.get("type");
  const color = formData.get("color");

  if (!isSpaceType(type)) return { error: "Choisis un type d'espace." };
  if (name.length < 1 || name.length > 60) return { error: "Le nom de l'espace doit faire entre 1 et 60 caractères." };
  if (displayName.length < 1 || displayName.length > 40) return { error: "Ton prénom doit faire entre 1 et 40 caractères." };
  if (!isTone(color)) return { error: "Choisis une couleur." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_space", {
    p_name: name,
    p_type: type,
    p_display_name: displayName,
    p_color: color,
  });
  if (error || typeof data !== "string") {
    const many = error?.message.includes("too_many_spaces");
    return { error: many ? "Tu fais déjà partie d'un très grand nombre d'espaces." : "Impossible de créer l'espace pour le moment." };
  }
  redirect(`/s/${data}`);
}

export async function joinSpace(_prev: FormState, formData: FormData): Promise<FormState> {
  const code = normalizeInviteCode(clean(formData.get("code")));
  const displayName = clean(formData.get("displayName"));
  const color = formData.get("color");

  if (!code) return { error: "Ce code n'a pas le bon format. Exemple : NOUS-7K2F-QX9A." };
  if (displayName.length < 1 || displayName.length > 40) return { error: "Ton prénom doit faire entre 1 et 40 caractères." };
  if (!isTone(color)) return { error: "Choisis une couleur." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_space", { p_code: code, p_display_name: displayName, p_color: color });
  if (error) return { error: "Impossible de rejoindre l'espace pour le moment." };

  const result = data as { status: string; space_id?: string } | null;
  switch (result?.status) {
    case "joined":
    case "already_member":
      if (result.space_id) redirect(`/s/${result.space_id}`);
      return { error: "Impossible de rejoindre l'espace pour le moment." };
    case "invalid_code":
      return { error: "Ce code n'existe pas. Vérifie-le avec la personne qui t'invite." };
    case "space_full":
      return { error: "Cet espace est complet." };
    case "too_many_attempts":
      return { error: "Trop de tentatives. Réessaie dans un quart d'heure." };
    default:
      return { error: "Impossible de rejoindre l'espace pour le moment." };
  }
}
