import type { IconName } from "@/components/ui/Icon";
import { tierAtLeast } from "@/lib/entitlements";
import type { SpaceType, Tier } from "@/lib/types";

export type ModuleKey =
  | "accueil" | "chat" | "photos" | "agenda" | "taches"
  | "humeur" | "jeux" | "defis" | "promesses" | "capsules" | "armoire"
  | "albums" | "question" | "souvenirs" | "retro" | "personnalite" | "localisation";

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  icon: IconName;
  /** Chemin relatif à /s/[spaceId] ; vide pour l'accueil. */
  path: string;
  /** Noyau commun : toujours actif, jamais désactivable. */
  core: boolean;
  /** Formule minimale requise. */
  tier: Tier;
  /** Types d'espace pour lesquels le module est actif par défaut. */
  presets: SpaceType[];
  /** L'écran existe-t-il déjà ? Les modules non prêts restent masqués. */
  ready: boolean;
}

const ALL: SpaceType[] = ["couple", "amis", "famille"];

export const MODULES: ModuleDef[] = [
  // Noyau commun : les cinq onglets de la barre du bas.
  { key: "accueil", label: "Accueil", icon: "home", path: "", core: true, tier: "free", presets: ALL, ready: true },
  { key: "chat", label: "Chat", icon: "chat", path: "/chat", core: true, tier: "free", presets: ALL, ready: false },
  { key: "photos", label: "Photos", icon: "photo", path: "/photos", core: true, tier: "free", presets: ALL, ready: false },
  { key: "agenda", label: "Agenda", icon: "calendar", path: "/agenda", core: true, tier: "free", presets: ALL, ready: false },
  { key: "taches", label: "À faire", icon: "tasks", path: "/taches", core: true, tier: "free", presets: ALL, ready: true },
  // Modules au choix, préréglés selon le type d'espace.
  { key: "humeur", label: "Humeur", icon: "smile", path: "/humeur", core: false, tier: "free", presets: ALL, ready: true },
  { key: "jeux", label: "Jeux", icon: "dice", path: "/jeux", core: false, tier: "free", presets: ALL, ready: false },
  { key: "defis", label: "Défis", icon: "trophy", path: "/defis", core: false, tier: "free", presets: ALL, ready: false },
  { key: "promesses", label: "Promesses", icon: "gift", path: "/promesses", core: false, tier: "free", presets: ["couple", "famille"], ready: false },
  { key: "capsules", label: "Capsules", icon: "capsule", path: "/capsules", core: false, tier: "free", presets: ["couple", "famille"], ready: false },
  { key: "armoire", label: "Armoire", icon: "archive", path: "/armoire", core: false, tier: "free", presets: ["couple"], ready: false },
  { key: "albums", label: "Albums", icon: "album", path: "/albums", core: false, tier: "free", presets: ALL, ready: false },
  { key: "question", label: "Question du jour", icon: "bulb", path: "/question", core: false, tier: "free", presets: ["couple"], ready: false },
  { key: "souvenirs", label: "Souvenirs", icon: "sparkle", path: "/souvenirs", core: false, tier: "free", presets: ALL, ready: false },
  { key: "retro", label: "Rétrospective", icon: "star", path: "/retro", core: false, tier: "free", presets: ALL, ready: false },
  { key: "personnalite", label: "Personnalité", icon: "compass", path: "/personnalite", core: false, tier: "max", presets: ["couple", "amis"], ready: false },
  { key: "localisation", label: "Localisation", icon: "pin", path: "/localisation", core: false, tier: "max", presets: ALL, ready: false },
];

export const CORE_KEYS: ModuleKey[] = MODULES.filter((m) => m.core).map((m) => m.key);

export interface ModuleState {
  def: ModuleDef;
  /** Affiché dans l'application. */
  enabled: boolean;
  /** Réservé à une formule supérieure. */
  locked: boolean;
}

/**
 * Calcule l'état de chaque module pour un espace :
 *  - le noyau est toujours actif ;
 *  - un module au choix suit le préréglage du type, sauf écart enregistré par un admin ;
 *  - une formule insuffisante verrouille le module sans toucher aux contenus.
 */
export function resolveModules(
  type: SpaceType,
  tier: Tier,
  overrides: Partial<Record<string, boolean>> = {},
): ModuleState[] {
  return MODULES.map((def) => {
    const locked = !tierAtLeast(tier, def.tier);
    if (def.core) return { def, enabled: true, locked: false };
    const wanted = overrides[def.key] ?? def.presets.includes(type);
    return { def, enabled: wanted && !locked, locked };
  });
}

export interface Navigation {
  tabs: { key: ModuleKey; label: string; icon: IconName; href: string }[];
  menu: { key: ModuleKey; label: string; icon: IconName; href: string }[];
}

/** Barre du bas = noyau commun ; menu = modules au choix actifs et prêts. */
export function buildNavigation(states: ModuleState[], base: string): Navigation {
  const toItem = (s: ModuleState) => ({ key: s.def.key, label: s.def.label, icon: s.def.icon, href: `${base}${s.def.path}` });
  return {
    tabs: states.filter((s) => s.def.core).map(toItem),
    menu: states.filter((s) => !s.def.core && s.enabled && s.def.ready).map(toItem),
  };
}
