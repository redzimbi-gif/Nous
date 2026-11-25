import type { ReactNode } from "react";

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

/** Un texte dont les adresses web deviennent des liens (qui s'ouvrent sans ouvrir le menu du message). */
export default function Linkified({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    const url = match[0].replace(/[).,;:!?»”]+$/u, "");
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <a key={key++} href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="break-all font-semibold underline underline-offset-2">
        {url}
      </a>,
    );
    last = start + url.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
