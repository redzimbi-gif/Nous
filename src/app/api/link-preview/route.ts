import dns from "node:dns/promises";
import net from "node:net";
import { NextResponse } from "next/server";
import { isPrivateIp } from "@/lib/netGuard";
import { detectCharset, parseOpenGraph } from "@/lib/ogParse";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const TIMEOUT_MS = 6000;
const MAX_BYTES = 600_000;
const MAX_REDIRECTS = 3;

/** Refuse les adresses internes (réseau local, métadonnées du cloud…) : ce service ne doit pas servir de passerelle. */
async function assertPublic(hostname: string) {
  if (process.env.LINK_PREVIEW_ALLOW_PRIVATE === "1") return; // essais locaux uniquement
  const host = hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("adresse interne");
    return;
  }
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("adresse interne");
  const addresses = await dns.lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) throw new Error("adresse interne");
}

async function readLimited(response: Response): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.length;
  }
  void reader.cancel().catch(() => {});
  const out = new Uint8Array(Math.min(total, MAX_BYTES));
  let offset = 0;
  for (const chunk of chunks) {
    const room = out.length - offset;
    if (room <= 0) break;
    out.set(chunk.subarray(0, room), offset);
    offset += Math.min(chunk.length, room);
  }
  return out;
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url") ?? "";
  let target: URL;
  try {
    target = new URL(raw);
    if (target.protocol !== "http:" && target.protocol !== "https:") throw new Error("protocole");
  } catch {
    return NextResponse.json({ ok: false, error: "adresse invalide" }, { status: 400 });
  }

  const base = { url: raw, host: target.hostname.replace(/^www\./, ""), fetched_at: new Date().toISOString() };
  const empty = { title: null, description: null, image: null, site: null };

  try {
    let current = target;
    let response: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertPublic(current.hostname);
      response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; NousLinkPreview/1.0; +https://nous-one.vercel.app)",
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "accept-language": "fr-FR,fr;q=0.9,en;q=0.6",
        },
      });
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        current = new URL(location, current);
        if (current.protocol !== "http:" && current.protocol !== "https:") throw new Error("redirection invalide");
        continue;
      }
      break;
    }
    if (!response || !response.ok) return NextResponse.json({ ...base, ...empty, ok: false });
    const type = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) return NextResponse.json({ ...base, ...empty, ok: false });

    const bytes = await readLimited(response);
    let html: string;
    try {
      html = new TextDecoder(detectCharset(type, bytes), { fatal: false }).decode(bytes);
    } catch {
      html = new TextDecoder("utf-8").decode(bytes);
    }
    const og = parseOpenGraph(html, current.toString());
    const ok = !!(og.title || og.description || og.image);
    return NextResponse.json(
      { ...base, ...og, site: og.site ?? base.host, ok },
      { headers: { "cache-control": "private, max-age=3600" } },
    );
  } catch {
    return NextResponse.json({ ...base, ...empty, ok: false });
  }
}
