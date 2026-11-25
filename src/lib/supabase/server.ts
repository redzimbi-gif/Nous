import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SupabaseNotConfigured, supabaseEnv } from "./env";

/** Client Supabase côté serveur : agit toujours avec les droits de l'utilisateur connecté (RLS). */
export async function createClient() {
  const env = supabaseEnv();
  if (!env) throw new SupabaseNotConfigured();
  const store = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Appel depuis un Server Component : le proxy se charge de rafraîchir la session.
        }
      },
    },
  });
}
