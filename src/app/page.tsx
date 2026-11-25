import { redirect } from "next/navigation";
import { ConfigNotice } from "@/components/ConfigNotice";
import { getMySpaces } from "@/lib/data";
import { getUser } from "@/lib/session";
import { supabaseEnv } from "@/lib/supabase/env";

export default async function Home() {
  if (!supabaseEnv()) return <ConfigNotice />;
  const user = await getUser();
  if (!user) redirect("/connexion");
  const spaces = await getMySpaces();
  if (spaces.length === 1) redirect(`/s/${spaces[0].id}`);
  redirect("/espaces");
}
