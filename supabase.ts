import { createClient } from "@supabase/supabase-js";

// Clé publique ("anon") : conçue pour être visible côté navigateur, la
// sécurité vient des policies RLS côté Supabase, pas du secret de cette clé.
const SUPABASE_URL = "https://peokuzlhhskecyjtgubd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlb2t1emxoaHNrZWN5anRndWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDczMzQsImV4cCI6MjEwMjI4MzMzNH0.IMQREFyW2H4dhIF-jgqAoyc1KTJms_lX7j0ADxDtZVA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

export const PHOTOS_BUCKET = "nous-photos";
