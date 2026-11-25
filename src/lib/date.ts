export const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export const WEEKDAYS_FR = ["L", "M", "M", "J", "V", "S", "D"];
export const WEEKDAYS_SHORT_FR = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}

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

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Même jour du mois suivant (ou précédent), ramené au dernier jour du mois s'il n'existe pas. */
export function addMonths(iso: string, n: number): string {
  const d = parseISODate(iso);
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), last));
  return toISODate(target);
}

/** Les sept jours (lundi → dimanche) de la semaine qui contient la date. */
export function weekDays(iso: string): string[] {
  const d = parseISODate(iso);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const monday = toISODate(d);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
