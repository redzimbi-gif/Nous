// Lecture des balises Open Graph / Twitter / <title> d'une page HTML. Pur : testable sans réseau.

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»", hellip: "…", rsquo: "’", lsquo: "‘", ndash: "–", mdash: "—", eacute: "é", egrave: "è", agrave: "à", ecirc: "ê", ccedil: "ç" };

export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeFromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeFromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

function safeFromCodePoint(code: number): string {
  try {
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  } catch {
    return "";
  }
}

function attributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m: RegExpExecArray | null;
  // On saute le nom de la balise.
  const body = tag.replace(/^<\s*[a-z0-9]+/i, "").replace(/\/?>$/, "");
  while ((m = re.exec(body))) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

export interface OpenGraph {
  title: string | null;
  description: string | null;
  image: string | null;
  site: string | null;
}

const clean = (value: string | undefined, max: number): string | null => {
  if (!value) return null;
  const text = decodeEntities(value).replace(/\s+/g, " ").trim();
  return text ? text.slice(0, max) : null;
};

export function parseOpenGraph(html: string, baseUrl: string): OpenGraph {
  const head = html.slice(0, 400_000);
  const meta: Record<string, string> = {};
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const a = attributes(tag);
    const key = (a.property ?? a.name ?? a.itemprop ?? "").toLowerCase();
    if (key && a.content !== undefined && !(key in meta)) meta[key] = a.content;
  }
  const titleTag = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const linkImage = (head.match(/<link\b[^>]*>/gi) ?? []).map(attributes).find((a) => a.rel?.toLowerCase().split(/\s+/).includes("image_src"))?.href;

  let image = clean(meta["og:image:secure_url"] ?? meta["og:image"] ?? meta["og:image:url"] ?? meta["twitter:image"] ?? meta["twitter:image:src"] ?? linkImage, 1000);
  if (image) {
    try {
      const resolved = new URL(image, baseUrl);
      image = resolved.protocol === "http:" || resolved.protocol === "https:" ? resolved.toString() : null;
    } catch {
      image = null;
    }
  }

  return {
    title: clean(meta["og:title"] ?? meta["twitter:title"] ?? titleTag, 160),
    description: clean(meta["og:description"] ?? meta["twitter:description"] ?? meta["description"], 280),
    image,
    site: clean(meta["og:site_name"] ?? meta["application-name"], 80),
  };
}

/** Jeu de caractères annoncé par l'en-tête HTTP ou par une balise <meta charset> du début de page. */
export function detectCharset(contentType: string | null, firstBytes: Uint8Array): string {
  const fromHeader = contentType?.match(/charset=([^;\s]+)/i)?.[1];
  if (fromHeader) return fromHeader.replace(/["']/g, "").toLowerCase();
  const sniff = new TextDecoder("latin1").decode(firstBytes.subarray(0, 2048));
  return sniff.match(/<meta[^>]+charset=["']?([a-z0-9_-]+)/i)?.[1]?.toLowerCase() ?? "utf-8";
}
