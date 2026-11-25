const DAY_MS = 86_400_000;

/** Nombre de jours entiers écoulés depuis une date « AAAA-MM-JJ » (jamais négatif). */
export function daysSince(isoDate: string, now: Date = new Date()): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today - start) / DAY_MS));
}

export function formatLongDate(date: Date = new Date()): string {
  const text = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 18) return "Bonjour";
  return "Bonsoir";
}

export function initialOf(name: string): string {
  return (name.trim().charAt(0) || "?").toUpperCase();
}
