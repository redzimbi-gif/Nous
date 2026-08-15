"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { TodoCategory, TodoRow } from "@/lib/types";
import { TODO_CATEGORIES, categoryEmoji, categoryLabel } from "@/lib/todoCategories";

export default function TodoPage() {
  const { name } = useIdentity();
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [text, setText] = useState("");
  const [newCategory, setNewCategory] = useState<TodoCategory | null>(null);

  useEffect(() => {
    supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setTodos(data);
      });

    const channel = supabase
      .channel("todos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id: string };
            setTodos((prev) => prev.filter((t) => t.id !== oldRow.id));
            return;
          }
          const row = payload.new as TodoRow;
          setTodos((prev) => {
            const exists = prev.some((t) => t.id === row.id);
            return exists ? prev.map((t) => (t.id === row.id ? row : t)) : [...prev, row];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");
    const category = newCategory;
    setNewCategory(null);
    const { data, error } = await supabase
      .from("todos")
      .insert({ content, created_by: name, category })
      .select()
      .single();
    if (error) {
      alert("Tâche non ajoutée : " + error.message);
      return;
    }
    if (data) setTodos((prev) => [...prev, data]);
  }

  async function toggleTodo(todo: TodoRow) {
    const { data } = await supabase
      .from("todos")
      .update({ done: !todo.done })
      .eq("id", todo.id)
      .select()
      .single();
    if (data) setTodos((prev) => prev.map((t) => (t.id === data.id ? data : t)));
  }

  async function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("todos").delete().eq("id", id);
  }

  const groups: { category: TodoCategory | null; items: TodoRow[] }[] = [
    ...TODO_CATEGORIES.map((c) => ({
      category: c.value,
      items: todos.filter((t) => t.category === c.value),
    })),
    { category: null, items: todos.filter((t) => !t.category) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3">
        <h1 className="text-lg font-extrabold text-blush-700">✅ À faire</h1>
      </header>

      <form onSubmit={addTodo} className="space-y-2.5 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nouvelle tâche…"
            className="flex-1 rounded-full border-2 border-blush-100 bg-white px-4 py-2.5 outline-none transition focus:border-blush-300 focus-visible:ring-2 focus-visible:ring-blush-200"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-500 text-xl text-white transition active:scale-90 disabled:opacity-50 disabled:active:scale-100"
            aria-label="Ajouter la tâche"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TODO_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setNewCategory((prev) => (prev === c.value ? null : c.value))}
              className={`rounded-full border-2 px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                newCategory === c.value
                  ? "border-blush-400 bg-blush-100 text-blush-700"
                  : "border-blush-100 bg-white text-blush-400"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </form>

      <div className="flex-1 space-y-5 px-4 pb-6">
        {todos.length === 0 && (
          <p className="mt-10 text-center text-sm text-blush-300">
            Rien à faire pour l&apos;instant 🤍
          </p>
        )}

        {groups.map((group) => {
          const pending = group.items.filter((t) => !t.done);
          const done = group.items.filter((t) => t.done);
          return (
            <section key={group.category ?? "none"}>
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blush-400">
                <span className="text-sm">{categoryEmoji(group.category)}</span>
                {categoryLabel(group.category)}
                <span className="font-normal normal-case text-blush-300">
                  · {group.items.length}
                </span>
              </h2>
              <div className="space-y-2">
                {pending.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-1 rounded-2xl bg-white py-1 pl-3 pr-1 shadow-sm"
                  >
                    <button
                      onClick={() => toggleTodo(todo)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center"
                      aria-label="Cocher"
                    >
                      <span className="h-6 w-6 rounded-full border-2 border-blush-300 transition" />
                    </button>
                    <span className="flex-1 py-2 text-blush-800">{todo.content}</span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-blush-200 transition hover:text-blush-400 active:scale-90"
                      aria-label="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {done.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-1 rounded-2xl bg-white/60 py-1 pl-3 pr-1"
                  >
                    <button
                      onClick={() => toggleTodo(todo)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center"
                      aria-label="Décocher"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blush-400 text-xs text-white">
                        ✓
                      </span>
                    </button>
                    <span className="flex-1 py-2 text-blush-300 line-through">
                      {todo.content}
                    </span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-blush-200 transition hover:text-blush-400 active:scale-90"
                      aria-label="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
