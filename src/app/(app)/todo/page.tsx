"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { TodoRow } from "@/lib/types";

export default function TodoPage() {
  const { name } = useIdentity();
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [text, setText] = useState("");

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
    const { data, error } = await supabase
      .from("todos")
      .insert({ content, created_by: name })
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

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3">
        <h1 className="text-lg font-extrabold text-blush-700">✅ À faire</h1>
      </header>

      <form onSubmit={addTodo} className="flex items-center gap-2 px-4 py-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nouvelle tâche…"
          className="flex-1 rounded-full border-2 border-blush-100 bg-white px-4 py-2.5 outline-none focus:border-blush-300"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-500 text-xl text-white disabled:opacity-50"
        >
          +
        </button>
      </form>

      <div className="flex-1 space-y-2 px-4 pb-6">
        {todos.length === 0 && (
          <p className="mt-10 text-center text-sm text-blush-300">
            Rien à faire pour l&apos;instant 🤍
          </p>
        )}

        {pending.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
          >
            <button
              onClick={() => toggleTodo(todo)}
              className="h-6 w-6 shrink-0 rounded-full border-2 border-blush-300"
              aria-label="Cocher"
            />
            <span className="flex-1 text-blush-800">{todo.content}</span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-blush-200 hover:text-blush-400"
              aria-label="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}

        {done.length > 0 && (
          <>
            <p className="mt-4 text-xs font-semibold uppercase text-blush-300">
              Fait ({done.length})
            </p>
            {done.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 rounded-2xl bg-white/60 p-3"
              >
                <button
                  onClick={() => toggleTodo(todo)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blush-400 text-xs text-white"
                  aria-label="Décocher"
                >
                  ✓
                </button>
                <span className="flex-1 text-blush-300 line-through">{todo.content}</span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-blush-200 hover:text-blush-400"
                  aria-label="Supprimer"
                >
                  ✕
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
