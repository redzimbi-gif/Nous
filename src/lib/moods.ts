import type { Mood } from "@/lib/types";

export const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "content", emoji: "😊", label: "Content" },
  { value: "amoureux", emoji: "🥰", label: "Amoureux" },
  { value: "excite", emoji: "🤩", label: "Excité" },
  { value: "motive", emoji: "💪", label: "Motivé" },
  { value: "calin", emoji: "🤗", label: "Câlin" },
  { value: "fier", emoji: "😎", label: "Fier" },
  { value: "zen", emoji: "😌", label: "Zen" },
  { value: "fatigue", emoji: "😴", label: "Fatigué" },
  { value: "ennuye", emoji: "😑", label: "Ennuyé" },
  { value: "occupe", emoji: "🏃", label: "Occupé" },
  { value: "affame", emoji: "🍔", label: "Affamé" },
  { value: "stresse", emoji: "😰", label: "Stressé" },
  { value: "anxieux", emoji: "😟", label: "Anxieux" },
  { value: "triste", emoji: "😢", label: "Triste" },
  { value: "en_colere", emoji: "😠", label: "En colère" },
  { value: "malade", emoji: "🤒", label: "Malade" },
];

export function moodEmoji(mood: string | undefined | null): string {
  return MOODS.find((m) => m.value === mood)?.emoji ?? "🙂";
}

export function moodLabel(mood: string | undefined | null): string {
  return MOODS.find((m) => m.value === mood)?.label ?? "Pas de statut";
}
