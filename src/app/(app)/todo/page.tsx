"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { TodoCategory, TodoRow } from "@/lib/types";
import { TODO_CATEGORIES, categoryEmoji, categoryLabel } from "@/lib/todoCategories";
import { sendNotification } from "@/lib/notify";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, inputClass } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { PageHeading } from "@/components/ui/PageHeading";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";

function CategoryPicker({ value, onChange }: { value: TodoCategory | null; onChange: (next: TodoCategory | null) => void }) {
  return (
    <div role="group" aria-label="Catégorie" className="flex flex-wrap gap-1.5">
      {TODO_CATEGORIES.map((c) => (
        <button
          key={c.value}
          type="button"
          aria-pressed={value === c.value}
          onClick={() => onChange(value === c.value ? null : c.value)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition active:scale-95",
            value === c.value ? "bg-primary text-primary-on shadow-press" : "bg-tint/70 text-tint-ink",
          )}
        >
          <span aria-hidden="true">{c.emoji}</span>
          {c.label}
        </button>
      ))}
    </div>
  );
}

function Row({ todo, onToggle, onEdit, onDelete }: { todo: TodoRow; onToggle: (todo: TodoRow) => void; onEdit: (todo: TodoRow) => void; onDelete: (id: string) => void }) {
  return (
    <li className={cn("flex items-center gap-1 rounded-2xl bg-surface py-1 pl-1.5 pr-1 shadow-card ring-1 ring-line transition", todo.done && "opacity-60")}>
      <button type="button" onClick={() => onToggle(todo)} className="flex size-11 shrink-0 items-center justify-center" aria-label={todo.done ? "Décocher" : "Cocher"} aria-pressed={todo.done}>
        <span className={cn("flex size-7 items-center justify-center rounded-full transition", todo.done ? "bg-primary text-primary-on" : "ring-2 ring-primary/40")}>
          {todo.done && <Icon name="check" size={16} strokeWidth={3} />}
        </span>
      </button>
      <button type="button" onClick={() => onEdit(todo)} className={cn("min-w-0 flex-1 py-2.5 text-left text-[16px] leading-snug", todo.done && "text-muted line-through")}>
        {todo.content}
      </button>
      <button type="button" onClick={() => onDelete(todo.id)} className="flex size-11 shrink-0 items-center justify-center rounded-full text-subtle transition hover:text-danger active:scale-90" aria-label="Supprimer">
        <Icon name="trash" size={18} />
      </button>
    </li>
  );
}


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
    // Le temps réel a pu livrer la ligne avant la réponse de l'insertion : pas de doublon.
    if (data) setTodos((prev) => (prev.some((t) => t.id === data.id) ? prev : [...prev, data]));
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

  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="h-full overflow-y-auto px-5 pb-6">
      <PageHeading title="À faire" subtitle={total === 0 ? "Rien pour l'instant" : `${doneCount} sur ${total} terminée${doneCount > 1 ? "s" : ""}`} />

      <form onSubmit={addTodo} className="space-y-3 rounded-3xl bg-surface p-3 shadow-card ring-1 ring-line">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nouvelle tâche…"
            aria-label="Nouvelle tâche"
            className="h-12 min-w-0 flex-1 rounded-full bg-surface-2 px-5 text-base outline-none ring-1 ring-line transition placeholder:text-subtle focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-on shadow-press transition active:scale-90 disabled:opacity-50 disabled:active:scale-100"
            aria-label="Ajouter la tâche"
          >
            <Icon name="plus" size={22} strokeWidth={2.2} />
          </button>
        </div>
        <CategoryPicker value={newCategory} onChange={setNewCategory} />
      </form>

      <div className="mt-6 space-y-6">
        {todos.length === 0 && (
          <EmptyState icon="tasks" title="Rien à faire">
            Ajoutez une tâche, une idée de resto ou un film à voir : vous la retrouverez ici.
          </EmptyState>
        )}

        {groups.map((group) => {
          const pending = group.items.filter((t) => !t.done);
          const done = group.items.filter((t) => t.done);
          return (
            <section key={group.category ?? "none"} aria-label={categoryLabel(group.category)}>
              <h2 className="mb-2.5 flex items-center gap-2 px-1 font-display text-[15px] font-semibold text-muted">
                <span aria-hidden="true">{categoryEmoji(group.category)}</span>
                {categoryLabel(group.category)}
                <span className="rounded-full bg-tint/70 px-2 py-0.5 text-xs font-bold text-tint-ink">{group.items.length}</span>
              </h2>
              <ul className="space-y-2">
                {pending.map((todo) => (
                  <Row key={todo.id} todo={todo} onToggle={toggleTodo} onEdit={openEdit} onDelete={deleteTodo} />
                ))}
                {done.map((todo) => (
                  <Row key={todo.id} todo={todo} onToggle={toggleTodo} onEdit={openEdit} onDelete={deleteTodo} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <Sheet open={!!editingTodo} onClose={() => setEditingTodo(null)} title="Modifier la tâche">
        {editingTodo && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveEdit();
            }}
            className="space-y-4 px-3 pb-1"
          >
            <Field label="Tâche">
              <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} className={inputClass} />
            </Field>
            <CategoryPicker value={editCategory} onChange={setEditCategory} />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button variant="soft" size="lg" onClick={() => setEditingTodo(null)}>
                Annuler
              </Button>
              <Button type="submit" size="lg" disabled={!editText.trim()}>
                Enregistrer
              </Button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
