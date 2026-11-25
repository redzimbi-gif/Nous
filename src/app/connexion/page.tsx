import type { Metadata } from "next";
import { ConfigNotice } from "@/components/ConfigNotice";
import { LoginForm } from "@/components/forms/LoginForm";
import { AccountShell } from "@/components/shell/AccountShell";
import { safeNext } from "@/lib/ids";
import { supabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!supabaseEnv()) return <ConfigNotice />;
  const { next } = await searchParams;
  return (
    <AccountShell>
      <div className="pt-8">
        <LoginForm next={safeNext(next) ?? undefined} />
      </div>
    </AccountShell>
  );
}
