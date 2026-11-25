import { notFound } from "next/navigation";
import { AccueilView } from "@/components/views/AccueilView";
import { MOCK, PREVIEW_NOW } from "@/lib/mock";
import { isSpaceType } from "@/lib/types";

export default async function PreviewHome({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isSpaceType(type)) notFound();
  const mock = MOCK[type];
  const done = mock.tasks.filter((t) => t.done).length;
  return (
    <AccueilView
      type={type}
      spaceName={mock.name}
      me={mock.me}
      members={mock.members}
      togetherSince={mock.togetherSince}
      tasks={{ total: mock.tasks.length, done }}
      inviteCode={mock.inviteCode}
      hrefs={{ taches: `/preview/${type}/taches`, humeur: `/preview/${type}/humeur` }}
      now={PREVIEW_NOW}
    />
  );
}
