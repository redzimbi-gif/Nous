"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { categoryInfo, hostOf, refCategory } from "@/lib/refs";
import type { RefRow } from "@/lib/types";

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/**
 * Une réf dans la conversation :
 *  - image ou vidéo : affichée directement ;
 *  - lien : carte d'aperçu (image, titre, description, site) qui ouvre la page ;
 *  - sinon : le titre et la note.
 */
export default function RefCard({ item, mediaUrl, onOpen }: { item: RefRow; mediaUrl: string | null; onOpen: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const category = categoryInfo(refCategory(item));
  const preview = item.preview;
  const host = item.link ? hostOf(item.link) : null;

  const label = (
    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide opacity-70">
      <Icon name={category.icon} size={13} />
      Armoire · {category.label}
    </p>
  );
  const note = item.note ? <p className="whitespace-pre-wrap text-[13px] leading-snug opacity-80">{item.note}</p> : null;

  if (item.media_path) {
    return (
      <div className="mb-1.5 overflow-hidden rounded-2xl bg-ink/[0.05]">
        {mediaUrl ? (
          item.media_type === "video" ? (
            <video src={mediaUrl} controls playsInline preload="metadata" onClick={stop} className="h-56 w-full bg-black object-cover" />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                onOpen();
              }}
              className="block w-full"
              aria-label={`Ouvrir la réf ${item.title}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl} alt="" className="h-56 w-full object-cover" />
            </button>
          )
        ) : (
          <div className="h-56 w-full animate-pulse bg-ink/10" />
        )}
        <div className="space-y-1 px-3 py-2.5">
          {label}
          <p className="font-semibold leading-snug">{item.title}</p>
          {note}
          {item.link && (
            <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={stop} className="flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline">
              <Icon name="external" size={12} />
              {host}
            </a>
          )}
        </div>
      </div>
    );
  }

  if (item.link) {
    return (
      <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={stop} className="mb-1.5 block overflow-hidden rounded-2xl bg-ink/[0.05] transition active:scale-[0.99]" aria-label={`Ouvrir le lien : ${item.title}`}>
        {preview?.image && !imageFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.image} alt="" referrerPolicy="no-referrer" loading="lazy" onError={() => setImageFailed(true)} className="h-40 w-full bg-ink/10 object-cover" />
        )}
        <div className="space-y-1 px-3 py-2.5">
          {label}
          <p className="font-semibold leading-snug">{item.title}</p>
          {preview?.description && <p className="line-clamp-3 text-[13px] leading-snug opacity-80">{preview.description}</p>}
          {note}
          <p className="flex items-center gap-1 text-xs font-semibold opacity-70">
            <Icon name="external" size={12} />
            <span className="truncate">{preview?.site ?? host}</span>
          </p>
        </div>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        stop(e);
        onOpen();
      }}
      className="mb-1.5 block w-full space-y-1 rounded-2xl bg-ink/[0.05] px-3 py-2.5 text-left transition active:scale-[0.99]"
    >
      {label}
      <p className="font-semibold leading-snug">{item.title}</p>
      {note}
    </button>
  );
}
