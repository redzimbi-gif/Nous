import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

/** Rafraîchit la session Supabase (cookies) et indique si l'utilisateur est connecté. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = supabaseEnv();
  if (!env) return { response, authenticated: false, configured: false };

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  // getClaims vérifie la signature du jeton ; ne pas insérer de code entre la création du client et cet appel.
  const { data } = await supabase.auth.getClaims();
  return { response, authenticated: Boolean(data?.claims?.sub), configured: true };
}
