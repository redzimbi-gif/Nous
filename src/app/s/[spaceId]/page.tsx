import type { Metadata } from "next";
import { AccueilView } from "@/components/views/AccueilView";
import { getSpaceContext, getTaskStats } from "@/lib/data";
import { SPACE_TYPE_INFO } from "@/lib/theme";
import { resolveModules } from "@/modules/registry";

export const metadata: Metadata = { title: "Accueil" };

export default async function AccueilPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const ctx = await getSpaceContext(spaceId);
  const stats = await getTaskStats(spaceId);
  const base = `/s/${spaceId}`;

  const humeurOn = resolveModules(ctx.space.type, ctx.tier, ctx.overrides).find((s) => s.def.key === "humeur")?.enabled ?? false;
  const accounts = ctx.members.filter((m) => m.kind === "account");
  const canInvite = ctx.me.role === "admin" && !ctx.space.archived_at && accounts.length < SPACE_TYPE_INFO[ctx.space.type].maxMembers;

  return (
    <AccueilView
      type={ctx.space.type}
      spaceName={ctx.space.name}
      me={{ name: ctx.me.display_name, tone: ctx.me.color }}
      members={ctx.members.map((m) => ({ id: m.id, name: m.display_name, tone: m.color, mood: m.mood }))}
      togetherSince={ctx.space.together_since}
      tasks={stats}
      inviteCode={canInvite ? ctx.space.invite_code : null}
      hrefs={{ taches: `${base}/taches`, humeur: humeurOn ? `${base}/humeur` : undefined }}
    />
  );
}
