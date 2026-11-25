import type { Metadata } from "next";
import { regenerateInviteCode, setModuleEnabled } from "@/actions/space";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CopyButton } from "@/components/ui/CopyButton";
import { Icon } from "@/components/ui/Icon";
import { PageHeading } from "@/components/ui/PageHeading";
import { SwitchForm } from "@/components/ui/Switch";
import { getSpaceContext } from "@/lib/data";
import { TIER_LABEL } from "@/lib/entitlements";
import { SPACE_TYPE_INFO } from "@/lib/theme";
import { resolveModules } from "@/modules/registry";

export const metadata: Metadata = { title: "Réglages" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="px-1 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function ReglagesPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const ctx = await getSpaceContext(spaceId);
  const isAdmin = ctx.me.role === "admin";
  const optional = resolveModules(ctx.space.type, ctx.tier, ctx.overrides).filter((s) => !s.def.core);
  const info = SPACE_TYPE_INFO[ctx.space.type];

  return (
    <div className="space-y-8">
      <PageHeading title="Réglages" subtitle={`${ctx.space.name} · ${info.label}`} />

      <Section title="Mon profil dans cet espace">
        <Card className="p-5">
          <ProfileForm spaceId={spaceId} displayName={ctx.me.display_name} tone={ctx.me.color} />
        </Card>
      </Section>

      <Section title="Inviter">
        <Card className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3">
            <span className="whitespace-nowrap font-display text-[19px] font-semibold tracking-[0.04em]">{ctx.space.invite_code}</span>
            <CopyButton value={ctx.space.invite_code} />
          </div>
          <p className="text-sm text-muted">Toute personne qui a ce code peut rejoindre l&apos;espace. Un code ne se partage qu&apos;avec ceux que tu veux y voir.</p>
          {isAdmin && (
            <form action={regenerateInviteCode.bind(null, spaceId)}>
              <Button type="submit" variant="ghost" size="sm">
                Générer un nouveau code
              </Button>
            </form>
          )}
        </Card>
      </Section>

      <Section title="Modules">
        <Card className="divide-y divide-line overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 text-muted">
            <Icon name="lock" size={18} className="shrink-0" />
            <span className="text-[15px]">Accueil, chat, photos, agenda et tâches sont toujours présents.</span>
          </div>
          {optional.map(({ def, enabled, locked }) => (
            <div key={def.key} className="flex min-h-16 items-center gap-3 px-4 py-2">
              <Icon name={def.icon} className="shrink-0 text-primary-ink" />
              <span className="min-w-0 flex-1 text-[17px]">{def.label}</span>
              {locked ? (
                <Chip>
                  <Icon name="lock" size={12} strokeWidth={2.4} /> {TIER_LABEL[def.tier]}
                </Chip>
              ) : !def.ready ? (
                <Chip tone="soft">Bientôt</Chip>
              ) : (
                <SwitchForm action={setModuleEnabled.bind(null, spaceId, def.key, !enabled)} label={def.label} checked={enabled} disabled={!isAdmin} />
              )}
            </div>
          ))}
        </Card>
        {!isAdmin && <p className="px-1 text-sm text-muted">Seuls les administrateurs de l&apos;espace règlent les modules.</p>}
      </Section>

      <Section title="Formule">
        <Card className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="font-display text-lg font-semibold">{TIER_LABEL[ctx.tier]}</p>
            <p className="text-sm text-muted">{ctx.tier === "free" ? "Nous+ et Nous Max arrivent bientôt." : "Merci de soutenir Nous."}</p>
          </div>
          <Chip tone={ctx.tier === "free" ? "soft" : "solid"}>{TIER_LABEL[ctx.tier]}</Chip>
        </Card>
      </Section>
    </div>
  );
}
