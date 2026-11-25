import { supabaseEnv } from "@/lib/supabase/env";

/**
 * L'aperçu de l'interface (données fictives) est ouvert en développement, avec
 * NEXT_PUBLIC_ENABLE_PREVIEW=1, et tant que Supabase n'est pas configuré
 * (déploiement de démonstration). Une production configurée le garde fermé.
 */
export function previewEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_PREVIEW === "1" || !supabaseEnv();
}
