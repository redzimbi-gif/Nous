import type { Viewport } from "next";
import { signOut } from "@/actions/auth";
import { ConfigNotice } from "@/components/ConfigNotice";
import { AppShell } from "@/components/shell/AppShell";
import { getMySpaces, getSpaceContext } from "@/lib/data";
import { supabaseEnv } from "@/lib/supabase/env";
import { THEME_COLOR } from "@/lib/theme";
import { buildNavigation, resolveModules } from "@/modules/registry";

type Params = { params: Promise<{ spaceId: string }> };

export async function generateViewport({ params }: Params): Promise<Viewport> {
  if (!supabaseEnv()) return {};
  const { spaceId } = await params;
  const { space } = await getSpaceContext(spaceId);
  return { themeColor: THEME_COLOR[space.type] };
}

export default async function SpaceLayout({ children, params }: Params & { children: React.ReactNode }) {
  if (!supabaseEnv()) return <ConfigNotice />;
  const { spaceId } = await params;
  const [ctx, spaces] = await Promise.all([getSpaceContext(spaceId), getMySpaces()]);
  const base = `/s/${spaceId}`;
  const nav = buildNavigation(resolveModules(ctx.space.type, ctx.tier, ctx.overrides), base);

  return (
    <AppShell
      type={ctx.space.type}
      base={base}
      tabs={nav.tabs}
      space={{ type: ctx.space.type, name: ctx.space.name }}
      spaces={spaces.map((s) => ({ id: s.id, type: s.type, name: s.name, href: `/s/${s.id}`, current: s.id === spaceId }))}
      me={{ name: ctx.me.display_name, tone: ctx.me.color }}
      menu={nav.menu}
      settingsHref={`${base}/reglages`}
      signOut={signOut}
    >
      {children}
    </AppShell>
  );
}
