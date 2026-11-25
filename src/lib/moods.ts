export const MOODS = [
  { value: "content", emoji: "😊", label: "Content" },
  { value: "amoureux", emoji: "🥰", label: "Amoureux" },
  { value: "excite", emoji: "🤩", label: "Excité" },
  { value: "calin", emoji: "🤗", label: "Câlin" },
  { value: "zen", emoji: "😌", label: "Zen" },
  { value: "fatigue", emoji: "😴", label: "Fatigué" },
  { value: "ennuye", emoji: "😑", label: "Ennuyé" },
  { value: "affame", emoji: "🍔", label: "Affamé" },
  { value: "stresse", emoji: "😰", label: "Stressé" },
  { value: "triste", emoji: "😢", label: "Triste" },
  { value: "en_colere", emoji: "😠", label: "En colère" },
  { value: "malade", emoji: "🤒", label: "Malade" },
  { value: "emu", emoji: "🥹", label: "Ému" },
  { value: "clownesque", emoji: "🤡", label: "Clownesque" },
  { value: "seducteur", emoji: "😏", label: "Séducteur" },
  { value: "epuise", emoji: "🪫", label: "Épuisé" },
  { value: "agace", emoji: "😤", label: "Agacé" },
  { value: "amuse", emoji: "🤭", label: "Amusé" },
  { value: "alcoolise", emoji: "🥴", label: "Alcoolisé" },
] as const;

export type MoodValue = (typeof MOODS)[number]["value"];

export function isMood(value: unknown): value is MoodValue {
  return MOODS.some((m) => m.value === value);
}

export function moodEmoji(value: string | null | undefined): string | null {
  return MOODS.find((m) => m.value === value)?.emoji ?? null;
}

export function moodLabel(value: string | null | undefined): string | null {
  return MOODS.find((m) => m.value === value)?.label ?? null;
}
