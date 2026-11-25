import type { Metadata } from "next";
import Link from "next/link";
import { ConfigNotice } from "@/components/ConfigNotice";
import { CreateSpaceForm } from "@/components/forms/CreateSpaceForm";
import { AccountShell } from "@/components/shell/AccountShell";
import { Icon } from "@/components/ui/Icon";
import { requireUser } from "@/lib/session";
import { supabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Créer un espace" };

export default async function NouvelEspacePage() {
  if (!supabaseEnv()) return <ConfigNotice />;
  await requireUser("/espaces/nouveau");
  return (
    <AccountShell
      back={
        <Link href="/espaces" className="inline-flex h-11 items-center gap-1 rounded-full pr-3 text-[15px] font-semibold text-primary-ink">
          <Icon name="chevronLeft" size={20} /> Retour
        </Link>
      }
    >
      <h1 className="pb-2 pt-3 font-display text-[34px] font-bold leading-[1.05] tracking-tight">Crée ton espace</h1>
      <p className="pb-6 text-[15px] leading-relaxed text-muted">Ce que vous partagez reste entre vous. Tu inviteras les autres avec un code.</p>
      <CreateSpaceForm />
    </AccountShell>
  );
}
