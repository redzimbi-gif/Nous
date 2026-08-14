import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://peokuzlhhskecyjtgubd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGci••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

export const PHOTOS_BUCKET = "nous-photos";
