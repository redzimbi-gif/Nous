import type { Metadata } from "next";
import Link from "next/link";
import { ConfigNotice } from "@/components/ConfigNotice";
import { JoinSpaceForm } from "@/components/forms/JoinSpaceForm";
import { AccountShell } from "@/components/shell/AccountShell";
import { Icon } from "@/components/ui/Icon";
import { requireUser } from "@/lib/session";
import { supabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Rejoindre un espace" };

export default async function RejoindrePage() {
  if (!supabaseEnv()) return <ConfigNotice />;
  await requireUser("/espaces/rejoindre");
  return (
    <AccountShell
      back={
        <Link href="/espaces" className="inline-flex h-11 items-center gap-1 rounded-full pr-3 text-[15px] font-semibold text-primary-ink">
          <Icon name="chevronLeft" size={20} /> Retour
        </Link>
      }
    >
      <h1 className="pb-2 pt-3 font-display text-[34px] font-bold leading-[1.05] tracking-tight">Rejoindre un espace</h1>
      <p className="pb-6 text-[15px] leading-relaxed text-muted">Entre le code que la personne t&apos;a donné.</p>
      <JoinSpaceForm />
    </AccountShell>
  );
}
