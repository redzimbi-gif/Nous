import type { SpaceType } from "./types";

// Doit rester aligné avec les variables --bg de globals.css.
export const THEME_COLOR: Record<SpaceType, string> = {
  couple: "#fffaf3",
  amis: "#fff7ec",
  famille: "#f5f8f0",
};

export const SPACE_TYPE_INFO: Record<
  SpaceType,
  { label: string; tagline: string; icon: "heart" | "people" | "house"; maxMembers: number; hello: string }
> = {
  couple: { label: "Couple", tagline: "Vous deux, rien que vous", icon: "heart", maxMembers: 2, hello: "Notre histoire" },
  amis: { label: "Amis", tagline: "Un groupe de potes", icon: "people", maxMembers: 30, hello: "Amis" },
  famille: { label: "Famille", tagline: "Parents, enfants, proches", icon: "house", maxMembers: 20, hello: "Famille" },
};
