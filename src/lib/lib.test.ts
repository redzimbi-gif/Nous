import { describe, expect, it } from "vitest";
import { effectiveTier, tierAtLeast } from "./entitlements";
import { daysSince, initialOf } from "./format";
import { isUuid, safeNext } from "./ids";
import { normalizeInviteCode } from "./invite";
import { buildNavigation, resolveModules } from "@/modules/registry";

describe("normalizeInviteCode", () => {
  it("accepte plusieurs écritures du même code", () => {
    for (const input of ["NOUS-7K2F-QX9A", "nous-7k2f-qx9a", "7k2f qx9a", " NOUS7K2FQX9A "]) {
      expect(normalizeInviteCode(input)).toBe("NOUS-7K2F-QX9A");
    }
  });
  it("refuse les codes mal formés ou ambigus", () => {
    for (const input of ["", "NOUS-7K2F", "NOUS-7K2F-QX9A-ZZ", "NOUS-0K2F-QX9A", "NOUS-7K2F-QXIA"]) {
      expect(normalizeInviteCode(input)).toBeNull();
    }
  });
});

describe("safeNext", () => {
  it("n'autorise que des chemins internes", () => {
    expect(safeNext("/espaces")).toBe("/espaces");
    expect(safeNext("//evil.test")).toBeNull();
    expect(safeNext("https://evil.test")).toBeNull();
    expect(safeNext("/\\evil")).toBeNull();
    expect(safeNext(null)).toBeNull();
  });
  it("reconnaît les UUID", () => {
    expect(isUuid("00000000-0000-0000-0000-0000000000a1")).toBe(true);
    expect(isUuid("pas-un-uuid")).toBe(false);
  });
});

describe("daysSince", () => {
  it("compte les jours entiers, jamais négatifs", () => {
    expect(daysSince("2026-02-14", new Date("2026-11-24T10:00:00"))).toBe(283);
    expect(daysSince("2030-01-01", new Date("2026-11-24T10:00:00"))).toBe(0);
  });
  it("prend l'initiale du prénom", () => {
    expect(initialOf("  camille")).toBe("C");
    expect(initialOf("")).toBe("?");
  });
});

describe("effectiveTier", () => {
  const now = new Date("2026-11-24T10:00:00Z");
  it("retombe en gratuit sans abonnement valide", () => {
    expect(effectiveTier(null, now)).toBe("free");
    expect(effectiveTier({ tier: "max", status: "canceled", current_period_end: "2026-11-01T00:00:00Z" }, now)).toBe("free");
  });
  it("garde la formule jusqu'à la fin de la période payée", () => {
    expect(effectiveTier({ tier: "plus", status: "canceled", current_period_end: "2026-12-03T00:00:00Z" }, now)).toBe("plus");
    expect(effectiveTier({ tier: "plus", status: "active", current_period_end: null }, now)).toBe("plus");
    expect(effectiveTier({ tier: "max", status: "past_due", current_period_end: null }, now)).toBe("max");
  });
  it("compare les formules", () => {
    expect(tierAtLeast("plus", "free")).toBe(true);
    expect(tierAtLeast("free", "max")).toBe(false);
  });
});

describe("modules", () => {
  it("garde le noyau commun dans la barre du bas, dans cet ordre", () => {
    const nav = buildNavigation(resolveModules("couple", "free"), "/s/x");
    expect(nav.tabs.map((t) => t.key)).toEqual(["accueil", "chat", "photos", "agenda", "taches"]);
    expect(nav.tabs[0].href).toBe("/s/x");
    expect(nav.tabs[4].href).toBe("/s/x/taches");
  });
  it("applique le préréglage du type, puis les écarts de l'admin", () => {
    const humeur = (o?: Record<string, boolean>) => resolveModules("amis", "free", o).find((s) => s.def.key === "humeur")!;
    expect(humeur().enabled).toBe(true);
    expect(humeur({ humeur: false }).enabled).toBe(false);
  });
  it("ne permet jamais de désactiver le noyau", () => {
    const chat = resolveModules("couple", "free", { chat: false }).find((s) => s.def.key === "chat")!;
    expect(chat.enabled).toBe(true);
  });
  it("verrouille les modules d'une formule supérieure sans les supprimer", () => {
    const perso = (tier: "free" | "max") => resolveModules("couple", tier, { personnalite: true }).find((s) => s.def.key === "personnalite")!;
    expect(perso("free")).toMatchObject({ enabled: false, locked: true });
    expect(perso("max")).toMatchObject({ enabled: true, locked: false });
  });
  it("masque du menu les modules dont l'écran n'existe pas encore", () => {
    const nav = buildNavigation(resolveModules("couple", "free"), "/s/x");
    expect(nav.menu.map((m) => m.key)).toEqual(["humeur"]);
  });
});
