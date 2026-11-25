import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Utilisateur connecté (vérifié auprès de Supabase Auth), ou null. */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export async function requireUser(next?: string) {
  const user = await getUser();
  if (!user) redirect(next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion");
  return user;
}
