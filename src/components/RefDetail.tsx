"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { categoryInfo, hostOf, refCategory, shortDate } from "@/lib/refs";
import type { RefRow } from "@/lib/types";

export default function RefDetail({
  item,
  url,
  onClose,
  onEdit,
  onDelete,
}: {
  item: RefRow;
  url?: string;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const category = categoryInfo(refCategory(item));
  const preview = item.preview;
  return (
    <Sheet open onClose={onClose} title={item.title}>
      <div className="space-y-4 px-3 pb-1">
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tint px-2.5 py-1 text-xs font-bold text-tint-ink">
            <Icon name={category.icon} size={14} />
            {category.label}
          </span>
          Ajouté par {item.created_by} · {shortDate(item.created_at)}
        </p>

        {url && item.media_type === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="max-h-72 w-full rounded-3xl object-cover" />
        )}
        {url && item.media_type === "video" && <video src={url} controls playsInline className="max-h-72 w-full rounded-3xl" />}

        {item.note && <p className="whitespace-pre-wrap rounded-2xl bg-surface-2 px-4 py-3 text-[15px] leading-snug ring-1 ring-line">{item.note}</p>}

        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-line transition active:scale-[0.99]">
            {!item.media_path && preview?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.image} alt="" referrerPolicy="no-referrer" className="h-40 w-full object-cover" />
            )}
            <span className="flex items-center gap-3 px-4 py-3">
              <Icon name="link" size={20} className="shrink-0 text-primary-ink" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-primary-ink">{preview?.title ?? hostOf(item.link)}</span>
                {preview?.description && <span className="line-clamp-2 block text-[13px] text-muted">{preview.description}</span>}
                <span className="block truncate text-xs text-subtle">{preview?.site ?? hostOf(item.link)}</span>
              </span>
              <Icon name="external" size={17} className="shrink-0 text-subtle" />
            </span>
          </a>
        )}

        <div className={cn("grid gap-3", onEdit ? "grid-cols-2" : "grid-cols-1")}>
          {onEdit && (
            <Button variant="soft" size="lg" onClick={onEdit}>
              <Icon name="edit" size={18} />
              Modifier
            </Button>
          )}
          <Button variant={onEdit ? "primary" : "soft"} size="lg" onClick={onClose}>
            Fermer
          </Button>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            className={cn("mx-auto flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition active:scale-95", confirmDelete ? "bg-danger text-primary-on" : "text-danger")}
          >
            <Icon name="trash" size={17} />
            {confirmDelete ? "Confirmer la suppression" : "Supprimer la réf"}
          </button>
        )}
      </div>
    </Sheet>
  );
}
