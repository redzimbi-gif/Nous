import type { TodoCategory } from "@/lib/types";

export const TODO_CATEGORIES: { value: TodoCategory; emoji: string; label: string }[] = [
  { value: "important", emoji: "⭐", label: "Important" },
  { value: "quotidien", emoji: "🏠", label: "Quotidien" },
  { value: "activites", emoji: "🎯", label: "Activités" },
  { value: "restaurants", emoji: "🍽️", label: "Restaurants" },
  { value: "repas", emoji: "🍳", label: "Repas" },
  { value: "films", emoji: "🎬", label: "Films" },
  { value: "series", emoji: "📺", label: "Séries" },
  { value: "voyages", emoji: "✈️", label: "Voyages" },
];

export function categoryEmoji(cat: TodoCategory | null): string {
  return TODO_CATEGORIES.find((c) => c.value === cat)?.emoji ?? "📝";
}

export function categoryLabel(cat: TodoCategory | null): string {
  return TODO_CATEGORIES.find((c) => c.value === cat)?.label ?? "Sans catégorie";
}
