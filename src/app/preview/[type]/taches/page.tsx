import { notFound } from "next/navigation";
import { PageHeading } from "@/components/ui/PageHeading";
import { PreviewTaskList } from "@/components/views/PreviewTaskList";
import { MOCK } from "@/lib/mock";
import { isSpaceType } from "@/lib/types";

export default async function PreviewTasks({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isSpaceType(type)) notFound();
  const tasks = MOCK[type].tasks;
  const open = tasks.filter((t) => !t.done).length;
  return (
    <>
      <PageHeading title="À faire" subtitle={`${open} ${open > 1 ? "tâches" : "tâche"} en cours`} />
      <PreviewTaskList initial={tasks} />
    </>
  );
}
