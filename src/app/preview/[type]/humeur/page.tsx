import { notFound } from "next/navigation";
import { PageHeading } from "@/components/ui/PageHeading";
import { MoodPicker } from "@/components/views/MoodPicker";
import { MOCK } from "@/lib/mock";
import { isSpaceType } from "@/lib/types";

export default async function PreviewMood({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isSpaceType(type)) notFound();
  const mock = MOCK[type];
  const current = mock.members[0].mood;
  return (
    <>
      <PageHeading title="Humeur" subtitle="Dis comment tu te sens, sans avoir à l'écrire." />
      <MoodPicker members={mock.members} currentMood={current} />
    </>
  );
}
