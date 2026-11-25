import type { MessageRow, RefRow } from "@/lib/types";

/** Aperçu d'un message sur une seule ligne : citation, barre de réponse, feuille d'actions. */
export function previewOf(
  message: Pick<MessageRow, "content" | "photo_id" | "audio_path" | "ref_id" | "ephemeral_type">,
  ref?: RefRow,
): string {
  const text = message.content?.replace(/\s+/g, " ").trim();
  if (text) return text;
  if (message.ephemeral_type) return message.ephemeral_type === "video" ? "Vidéo éphémère" : "Photo éphémère";
  if (message.photo_id) return "Photo";
  if (message.audio_path) return "Message vocal";
  if (message.ref_id) return ref ? `Réf · ${ref.title}` : "Réf";
  return "Message";
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** « Aujourd'hui », « Hier », « Lundi 24 novembre » (avec l'année si ce n'est pas l'année en cours). */
export function dayLabel(date: Date, now: Date = new Date()): string {
  if (isSameDay(date, now)) return "Aujourd'hui";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Hier";
  const text = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" as const }),
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Deux messages d'une même personne, à moins de cinq minutes l'un de l'autre, forment un groupe. */
export function sameGroup(a: MessageRow, b: MessageRow): boolean {
  if (a.sender_name !== b.sender_name) return false;
  const ta = new Date(a.created_at);
  const tb = new Date(b.created_at);
  return isSameDay(ta, tb) && Math.abs(tb.getTime() - ta.getTime()) < 5 * 60_000;
}
