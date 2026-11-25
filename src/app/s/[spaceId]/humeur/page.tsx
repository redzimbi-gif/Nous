import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setMood } from "@/actions/space";
import { PageHeading } from "@/components/ui/PageHeading";
import { MoodPicker } from "@/components/views/MoodPicker";
import { getSpaceContext } from "@/lib/data";
import { resolveModules } from "@/modules/registry";

export const metadata: Metadata = { title: "Humeur" };

export default async function HumeurPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const ctx = await getSpaceContext(spaceId);
  const on = resolveModules(ctx.space.type, ctx.tier, ctx.overrides).find((s) => s.def.key === "humeur")?.enabled;
  if (!on) notFound();

  return (
    <>
      <PageHeading title="Humeur" subtitle="Dis comment tu te sens, sans avoir à l'écrire." />
      <MoodPicker
        members={ctx.members.map((m) => ({ id: m.id, name: m.display_name, tone: m.color, mood: m.mood }))}
        currentMood={ctx.me.mood}
        makeAction={(mood) => setMood.bind(null, spaceId, mood)}
      />
    </>
  );
}
