import type { Metadata } from "next";
import { addTask, deleteTask, toggleTask } from "@/actions/space";
import { PageHeading } from "@/components/ui/PageHeading";
import { TaskList, type TaskView } from "@/components/views/TaskList";
import { getSpaceContext, getTasks } from "@/lib/data";

export const metadata: Metadata = { title: "À faire" };

export default async function TachesPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const ctx = await getSpaceContext(spaceId);
  const tasks = await getTasks(spaceId);
  const byId = new Map(ctx.members.map((m) => [m.id, m]));

  const views: TaskView[] = tasks.map((t) => {
    const who = byId.get((t.done_at ? t.done_by : t.created_by) ?? "");
    return { id: t.id, title: t.title, done: Boolean(t.done_at), by: who ? { name: who.display_name, tone: who.color } : null };
  });
  const open = views.filter((t) => !t.done).length;

  return (
    <>
      <PageHeading title="À faire" subtitle={open === 0 ? "Tout est fait" : `${open} ${open > 1 ? "tâches" : "tâche"} en cours`} />
      <TaskList
        tasks={views}
        actions={{ add: addTask.bind(null, spaceId), toggle: toggleTask.bind(null, spaceId), remove: deleteTask.bind(null, spaceId) }}
      />
    </>
  );
}
