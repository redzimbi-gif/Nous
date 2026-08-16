import { createClient } from "@supabase/supabase-js";

// Clé publique ("anon") : conçue pour être visible côté navigateur, la
// sécurité vient des policies RLS côté Supabase, pas du secret de cette clé.
const SUPABASE_URL = "https://peokuzlhhskecyjtgubd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGci••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  // Force le vrai fetch du navigateur : avec Next.js 16 + Turbopack, la lib
  // Supabase peut sinon embarquer un polyfill fetch/Headers moins tolérant,
  // qui plante sur des requêtes que le navigateur gère très bien seul.
  global: {
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
  },
});

export const PHOTOS_BUCKET = "nous-photos";
export const REFS_BUCKET = "nous-refs";
export const VOICES_BUCKET = "nous-voices";
