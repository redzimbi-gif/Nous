"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/types";

export interface TaskView {
  id: string;
  title: string;
  done: boolean;
  by?: { name: string; tone: Tone } | null;
}

export interface TaskActions {
  add: (formData: FormData) => Promise<{ error?: string } | void>;
  toggle: (id: string, done: boolean) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

type Change = { type: "toggle"; id: string; done: boolean } | { type: "remove"; id: string } | { type: "add"; task: TaskView };

function reduce(state: TaskView[], change: Change): TaskView[] {
  switch (change.type) {
    case "toggle":
      return state.map((t) => (t.id === change.id ? { ...t, done: change.done } : t));
    case "remove":
      return state.filter((t) => t.id !== change.id);
    case "add":
      return [change.task, ...state];
  }
}

export function TaskList({ tasks, actions }: { tasks: TaskView[]; actions: TaskActions }) {
  const [items, apply] = useOptimistic(tasks, reduce);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const todo = items.filter((t) => !t.done);
  const done = items.filter((t) => t.done);

  function submit(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;
    setError(null);
    formRef.current?.reset();
    startTransition(async () => {
      apply({ type: "add", task: { id: `tmp-${Date.now()}`, title, done: false } });
      const result = await actions.add(formData);
      if (result && result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-5">
      <form ref={formRef} action={submit} className="flex items-center gap-2 rounded-full bg-surface p-1.5 pl-5 shadow-card ring-1 ring-line focus-within:ring-2 focus-within:ring-primary">
        <label htmlFor="task-title" className="sr-only">
          Nouvelle tâche
        </label>
        <input id="task-title" name="title" maxLength={200} autoComplete="off" placeholder="Ajouter une tâche…" className="h-11 min-w-0 flex-1 bg-transparent text-[17px] placeholder:text-subtle focus:outline-none" />
        <button type="submit" aria-label="Ajouter" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-on shadow-press transition active:scale-95">
          <Icon name="plus" size={22} strokeWidth={2.2} />
        </button>
      </form>
      {error && (
        <p role="alert" className="px-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState icon="tasks" title="Rien à faire">
          Ajoute une première tâche : tout le monde dans l&apos;espace la voit.
        </EmptyState>
      ) : (
        <>
          {todo.length > 0 && (
            <Card className="divide-y divide-line overflow-hidden">
              {todo.map((task) => (
                <Row key={task.id} task={task} onToggle={(d) => startTransition(async () => { apply({ type: "toggle", id: task.id, done: d }); await actions.toggle(task.id, d); })} onRemove={() => startTransition(async () => { apply({ type: "remove", id: task.id }); await actions.remove(task.id); })} />
              ))}
            </Card>
          )}
          {done.length > 0 && (
            <section>
              <h2 className="px-2 pb-2 text-sm font-semibold text-muted">Terminé · {done.length}</h2>
              <Card className="divide-y divide-line overflow-hidden">
                {done.map((task) => (
                  <Row key={task.id} task={task} onToggle={(d) => startTransition(async () => { apply({ type: "toggle", id: task.id, done: d }); await actions.toggle(task.id, d); })} onRemove={() => startTransition(async () => { apply({ type: "remove", id: task.id }); await actions.remove(task.id); })} />
                ))}
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Row({ task, onToggle, onRemove }: { task: TaskView; onToggle: (done: boolean) => void; onRemove: () => void }) {
  return (
    <div className="flex min-h-16 items-center gap-3 px-4 py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.title}
        onClick={() => onToggle(!task.done)}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90",
          task.done ? "border-primary bg-primary text-primary-on" : "border-subtle/60 bg-surface",
        )}
      >
        {task.done && <Icon name="check" size={15} strokeWidth={3} />}
      </button>
      <span className={cn("min-w-0 flex-1 break-words text-[17px] leading-snug", task.done && "text-subtle line-through")}>{task.title}</span>
      {task.by && <Avatar name={task.by.name} tone={task.by.tone} size="xs" />}
      <button type="button" onClick={onRemove} aria-label={`Supprimer « ${task.title} »`} className="flex size-9 shrink-0 items-center justify-center rounded-full text-subtle transition hover:bg-tint/60 active:scale-90">
        <Icon name="x" size={18} />
      </button>
    </div>
  );
}
