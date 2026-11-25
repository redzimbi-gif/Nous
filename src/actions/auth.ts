"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/ids";
import { supabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  step: "email" | "code";
  email: string;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestCode(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { step: "email", email, error: "Entre une adresse e-mail valide." };
  }
  if (!supabaseEnv()) {
    return { step: "email", email, error: "Le service de connexion n'est pas encore configuré." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) {
    const tooMany = error.status === 429;
    return { step: "email", email, error: tooMany ? "Trop d'essais. Réessaie dans quelques minutes." : "Impossible d'envoyer le code pour le moment." };
  }
  return { step: "code", email };
}

export async function verifyCode(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  const next = safeNext(String(formData.get("next") ?? ""));
  if (!/^\d{6,10}$/.test(token)) return { step: "code", email, error: "Le code est composé de chiffres uniquement." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { step: "code", email, error: "Code incorrect ou expiré. Demande-en un nouveau." };
  redirect(next ?? "/espaces");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
