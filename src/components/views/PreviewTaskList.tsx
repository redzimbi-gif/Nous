"use client";

import { useState } from "react";
import { TaskList, type TaskActions, type TaskView } from "./TaskList";

/** Liste de tâches de l'aperçu : même interface que la vraie, mais en mémoire. */
export function PreviewTaskList({ initial }: { initial: TaskView[] }) {
  const [tasks, setTasks] = useState(initial);
  const actions: TaskActions = {
    add: async (formData) => {
      const title = String(formData.get("title") ?? "").trim();
      if (title) setTasks((list) => [{ id: crypto.randomUUID(), title, done: false }, ...list]);
    },
    toggle: async (id, done) => setTasks((list) => list.map((x) => (x.id === id ? { ...x, done } : x))),
    remove: async (id) => setTasks((list) => list.filter((x) => x.id !== id)),
  };
  return <TaskList tasks={tasks} actions={actions} />;
}
