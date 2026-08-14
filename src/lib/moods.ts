import type { Mood } from "@/lib/types";

export const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "content", emoji: "😊", label: "Content" },
  { value: "amoureux", emoji: "🥰", label: "Amoureux" },
  { value: "fatigue", emoji: "😴", label: "Fatigué" },
  { value: "stresse", emoji: "😰", label: "Stressé" },
  { value: "triste", emoji: "😢", label: "Triste" },
  { value: "en_colere", emoji: "😠", label: "En colère" },
  { value: "malade", emoji: "🤒", label: "Malade" },
  { value: "zen", emoji: "😌", label: "Zen" },
];

export function moodEmoji(mood: string | undefined | null): string {
  return MOODS.find((m) => m.value === mood)?.emoji ?? "🙂";
}

export function moodLabel(mood: string | undefined | null): string {
  return MOODS.find((m) => m.value === mood)?.label ?? "Pas de statut";
}
