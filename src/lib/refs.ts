import type { IconName } from "@/components/ui/Icon";
import type { RefCategory, RefRow } from "@/lib/types";

export const REF_CATEGORIES: { value: RefCategory; label: string; description: string; icon: IconName; unit: [string, string] }[] = [
  { value: "references", label: "Références", description: "Memes, blagues et références communes", icon: "smile", unit: ["réf", "réfs"] },
  { value: "restaurants", label: "Restaurants", description: "Adresses découvertes", icon: "utensils", unit: ["adresse", "adresses"] },
  { value: "activites", label: "Activités", description: "Sorties, loisirs et idées à faire à deux", icon: "compass", unit: ["idée", "idées"] },
  { value: "voyages", label: "Voyages", description: "Destinations et hébergements", icon: "plane", unit: ["destination", "destinations"] },
  { value: "musique", label: "Musique", description: "Titres et playlists", icon: "music", unit: ["titre", "titres"] },
  { value: "videos", label: "Vidéos", description: "TikTok, Reels, YouTube", icon: "video", unit: ["vidéo", "vidéos"] },
  { value: "inspirations", label: "Inspirations", description: "Décoration, vêtements, idées", icon: "sparkle", unit: ["inspiration", "inspirations"] },
  { value: "documents", label: "Documents", description: "Informations utiles", icon: "file", unit: ["document", "documents"] },
];

export function isRefCategory(value: unknown): value is RefCategory {
  return REF_CATEGORIES.some((c) => c.value === value);
}

export function categoryInfo(value: RefCategory) {
  return REF_CATEGORIES.find((c) => c.value === value) ?? REF_CATEGORIES[0];
}

/** Une réf sans catégorie (les anciennes) range dans « Références », le fourre-tout des mèmes et blagues. */
export function refCategory(ref: Pick<RefRow, "category">): RefCategory {
  return isRefCategory(ref.category) ? ref.category : "references";
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function normalizeUrl(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.toString();
  } catch {
    return null;
  }
}

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

/** Adresses web présentes dans un texte (sans la ponctuation finale). */
export function extractUrls(text: string | null | undefined): string[] {
  if (!text) return [];
  return (text.match(URL_PATTERN) ?? []).map((u) => u.replace(/[).,;:!?»”]+$/u, ""));
}

function hostMatches(host: string, patterns: string[]): boolean {
  const labels = host.split(".");
  return patterns.some((p) => (p.endsWith(".") ? labels.includes(p.slice(0, -1)) : host === p || host.endsWith(`.${p}`)));
}

/** Catégorie proposée d'après le lien ou le média : toujours modifiable par la personne. */
export function suggestCategory({ link, mediaType }: { link?: string | null; mediaType?: "image" | "video" | null }): RefCategory {
  if (link) {
    const host = hostOf(link);
    let path = "";
    try {
      path = new URL(link).pathname;
    } catch {
      /* lien non valide : on s'en tient à l'hôte */
    }
    if (hostMatches(host, ["music.youtube.com", "spotify.com", "deezer.com", "music.apple.com", "soundcloud.com", "bandcamp.com", "tidal.com"])) return "musique";
    if (hostMatches(host, ["instagram.com"])) return /^\/(reel|reels|tv)\b/.test(path) ? "videos" : "inspirations";
    if (hostMatches(host, ["tiktok.com", "youtube.com", "youtu.be", "vimeo.com", "dailymotion.com", "twitch.tv"])) return "videos";
    if (hostMatches(host, ["booking.com", "airbnb.", "tripadvisor.", "skyscanner.", "kayak.", "expedia.", "lonelyplanet.com", "routard.com", "hotels.com", "abritel.", "vrbo.", "sncf-connect.com", "ouigo.com", "ryanair.com", "easyjet.com", "airfrance."])) return "voyages";
    if (hostMatches(host, ["thefork.", "lafourchette.com", "ubereats.com", "deliveroo.", "guide.michelin.com", "maps.app.goo.gl"])) return "restaurants";
    if (hostMatches(host, ["google.com", "google.fr"]) && path.startsWith("/maps")) return "restaurants";
    if (hostMatches(host, ["pinterest.", "vinted.", "ikea.", "zara.com", "etsy.com", "behance.net"])) return "inspirations";
    if (hostMatches(host, ["billetreduc.com", "fnac.com", "ticketmaster.", "eventbrite.", "sortiraparis.com", "allocine.fr", "meetup.com"])) return "activites";
    if (/\.pdf$/i.test(path) || hostMatches(host, ["drive.google.com", "docs.google.com", "dropbox.com", "notion.so", "service-public.fr", "ameli.fr"])) return "documents";
  }
  if (mediaType === "video") return "videos";
  return "references";
}

/** « 24 nov. » */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
