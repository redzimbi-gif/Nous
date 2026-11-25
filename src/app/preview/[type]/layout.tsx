import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { MOCK } from "@/lib/mock";
import { previewEnabled } from "@/lib/preview";
import { isSpaceType, SPACE_TYPES } from "@/lib/types";
import { buildNavigation, resolveModules } from "@/modules/registry";

export default async function PreviewLayout({ children, params }: { children: React.ReactNode; params: Promise<{ type: string }> }) {
  if (!previewEnabled()) notFound();
  const { type } = await params;
  if (!isSpaceType(type)) notFound();
  const mock = MOCK[type];
  const base = `/preview/${type}`;
  const nav = buildNavigation(resolveModules(type, "free", {}), base);

  return (
    <AppShell
      type={type}
      base={base}
      tabs={nav.tabs}
      space={{ type, name: mock.name }}
      spaces={SPACE_TYPES.map((t) => ({ id: t, type: t, name: MOCK[t].name, href: `/preview/${t}`, current: t === type }))}
      me={mock.me}
      menu={nav.menu}
      settingsHref={base}
    >
      <div className="animate-rise">{children}</div>
    </AppShell>
  );
}
