import { createClient } from "@supabase/supabase-js";

// Clé publique ("anon") : conçue pour être visible côté navigateur, la
// sécurité vient des policies RLS côté Supabase, pas du secret de cette clé.
const SUPABASE_URL = "https://peokuzlhhskecyjtgubd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ" +
  "pc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlb2t1emx" +
  "oaHNrZWN5anRndWJkIiwicm9sZSI6ImFub24iLCJ" +
  "pYXQiOjE3ODY3MDczMzQsImV4cCI6MjEwMjI4MzM" +
  "zNH0.IMQREFyW2H4dhIF-jgqAoyc1KTJms_lX7j0" +
  "ADxDtZVA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  // Force le vrai fetch du navigateur, appelé via globalThis pour garder le
  // bon "this" : un appel nu (juste "fetch(...)") perd son contexte une fois
  // réassigné dans un module en mode strict, ce qui fait planter certaines
  // implémentations de fetch patchées ("Illegal invocation").
  global: {
    fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
  },
});

export const PHOTOS_BUCKET = "nous-photos";
export const REFS_BUCKET = "nous-refs";
export const VOICES_BUCKET = "nous-voices";
export const EPHEMERAL_BUCKET = "nous-ephemeral";
