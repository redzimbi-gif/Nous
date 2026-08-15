"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { TodoCategory, TodoRow } from "@/lib/types";
import { TODO_CATEGORIES, categoryEmoji, categoryLabel } from "@/lib/todoCategories";
import { sendNotification } from "@/lib/notify";

export default function TodoPage() {
  const { name } = useIdentity();
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [text, setText] = useState("");
  const [newCategory, setNewCategory] = useState<TodoCategory | null>(null);
  const [editingTodo, setEditingTodo] = useState<TodoRow | null>(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState<TodoCategory | null>(null);

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
    sendNotification({
      senderName: name,
      title: "✅ Nouvelle tâche",
      body: content,
      url: "/todo",
    });
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

  function openEdit(todo: TodoRow) {
    setEditingTodo(todo);
    setEditText(todo.content);
    setEditCategory(todo.category);
  }

  async function saveEdit() {
    if (!editingTodo || !editText.trim()) return;
    const { data, error } = await supabase
      .from("todos")
      .update({ content: editText.trim(), category: editCategory })
      .eq("id", editingTodo.id)
      .select()
      .single();
    if (error) {
      alert("Tâche non modifiée : " + error.message);
      return;
    }
    if (data) setTodos((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    setEditingTodo(null);
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
                    <button
                      onClick={() => openEdit(todo)}
                      className="flex-1 py-2 text-left text-blush-800"
                    >
                      {todo.content}
                    </button>
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
                    <button
                      onClick={() => openEdit(todo)}
                      className="flex-1 py-2 text-left text-blush-300 line-through"
                    >
                      {todo.content}
                    </button>
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

      {editingTodo && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-blush-900/40 backdrop-blur-sm sm:items-center"
          onClick={() => setEditingTodo(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-3xl bg-white p-6 sm:rounded-3xl"
          >
            <h2 className="mb-4 text-lg font-extrabold text-blush-700">Modifier la tâche</h2>

            <input
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="mb-3 w-full rounded-xl border-2 border-blush-100 px-3 py-2.5 outline-none transition focus:border-blush-300 focus-visible:ring-2 focus-visible:ring-blush-200"
            />

            <div className="mb-5 flex flex-wrap gap-1.5">
              {TODO_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() =>
                    setEditCategory((prev) => (prev === c.value ? null : c.value))
                  }
                  className={`rounded-full border-2 px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                    editCategory === c.value
                      ? "border-blush-400 bg-blush-100 text-blush-700"
                      : "border-blush-100 bg-white text-blush-400"
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingTodo(null)}
                className="flex-1 rounded-xl bg-blush-50 py-3 font-bold text-blush-500 transition active:scale-[0.98]"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                disabled={!editText.trim()}
                className="flex-1 rounded-xl bg-blush-500 py-3 font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
