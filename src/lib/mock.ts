// Données fictives de l'aperçu statique (/preview) : permettent de juger l'interface
// sans base de données. Jamais utilisées par les vraies pages.
import type { MemberView } from "@/components/views/AccueilView";
import type { TaskView } from "@/components/views/TaskList";
import type { SpaceType, Tone } from "./types";

export const PREVIEW_NOW = new Date("2026-11-24T10:00:00");

interface MockSpace {
  name: string;
  me: { name: string; tone: Tone };
  members: MemberView[];
  togetherSince?: string;
  inviteCode?: string;
  tasks: TaskView[];
}

const m = (id: string, name: string, tone: Tone, mood: string | null): MemberView => ({ id, name, tone, mood });
const t = (id: string, title: string, done: boolean, by?: MemberView): TaskView => ({ id, title, done, by: by ? { name: by.name, tone: by.tone } : null });

const leo = m("1", "Léo", "lilac", "emu");
const camille = m("2", "Camille", "rose", "content");
const sam = m("3", "Sam", "peach", "excite");
const ines = m("4", "Inès", "rose", "fatigue");
const yanis = m("5", "Yanis", "sky", "seducteur");
const marion = m("6", "Marion", "mint", null);

export const MOCK: Record<SpaceType, MockSpace> = {
  couple: {
    name: "Léo & Camille",
    me: { name: leo.name, tone: leo.tone },
    members: [leo, camille],
    togetherSince: "2026-02-14",
    tasks: [
      t("a", "Appeler le garagiste", false, camille),
      t("b", "Changer les draps", false, leo),
      t("c", "Commander les cadeaux de Noël", false, camille),
      t("d", "Acheter du café", true, leo),
      t("e", "Prendre rendez-vous chez le dentiste", true, camille),
    ],
  },
  amis: {
    name: "La bande",
    me: { name: leo.name, tone: "sun" },
    members: [{ ...leo, tone: "sun", mood: "content" }, sam, ines, yanis, marion],
    inviteCode: "NOUS-7K2F-QX9A",
    tasks: [
      t("a", "Réserver la salle", false, sam),
      t("b", "Ramener les jeux", false, leo),
      t("c", "Créer le sondage pour le resto", true, ines),
    ],
  },
  famille: {
    name: "Notre famille",
    me: { name: leo.name, tone: "sky" },
    members: [{ ...leo, tone: "sky", mood: "content" }, { ...camille, tone: "mint" }, m("7", "Théo", "sun", "excite"), m("8", "Mamie", "rose", "zen"), m("9", "Lou", "peach", null)],
    inviteCode: "NOUS-4M8D-PL3H",
    tasks: [
      t("a", "Sortir les poubelles", true, m("7", "Théo", "sun", null)),
      t("b", "Faire les courses", false, camille),
      t("c", "Lancer la lessive", false, leo),
      t("d", "Appeler Mamie pour dimanche", false, leo),
    ],
  },
};

export function previewEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_PREVIEW === "1";
}
