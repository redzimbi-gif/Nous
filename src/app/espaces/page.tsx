import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/actions/auth";
import { ConfigNotice } from "@/components/ConfigNotice";
import { AccountShell } from "@/components/shell/AccountShell";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { getMySpaces } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { supabaseEnv } from "@/lib/supabase/env";
import { SPACE_TYPE_INFO } from "@/lib/theme";

export const metadata: Metadata = { title: "Mes espaces" };

export default async function EspacesPage() {
  if (!supabaseEnv()) return <ConfigNotice />;
  await requireUser("/espaces");
  const spaces = await getMySpaces();

  return (
    <AccountShell signOut={signOut}>
      <h1 className="pb-5 pt-3 font-display text-[34px] font-bold leading-[1.05] tracking-tight">{spaces.length ? "Tes espaces" : "Bienvenue"}</h1>
      {spaces.length === 0 ? (
        <p className="-mt-2 pb-6 text-[15px] leading-relaxed text-muted">Crée ton premier espace, ou rejoins celui de quelqu&apos;un avec son code d&apos;invitation.</p>
      ) : (
        <ul className="space-y-3 pb-6">
          {spaces.map((space) => {
            const info = SPACE_TYPE_INFO[space.type];
            return (
              <li key={space.id} data-space-type={space.type}>
                <Link href={`/s/${space.id}`} className="block">
                  <Card className="flex items-center gap-4 p-4 transition active:scale-[0.99]">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-tint text-tint-ink">
                      <Icon name={info.icon} size={24} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-lg font-semibold">{space.name}</span>
                      <span className="block text-sm text-muted">{info.label}</span>
                    </span>
                    {space.archived && <Chip tone="soft">Archivé</Chip>}
                    <Icon name="chevronRight" size={18} className="text-subtle" />
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="space-y-3">
        <ButtonLink href="/espaces/nouveau" size="lg" block>
          <Icon name="plus" size={20} strokeWidth={2.2} /> Créer un espace
        </ButtonLink>
        <ButtonLink href="/espaces/rejoindre" variant="soft" size="lg" block>
          Rejoindre avec un code
        </ButtonLink>
      </div>
    </AccountShell>
  );
}
