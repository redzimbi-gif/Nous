"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
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
  return (
    <Sheet open onClose={onClose} title={item.title}>
      <div className="space-y-4 px-3 pb-1">
        {url && item.media_type === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="max-h-72 w-full rounded-3xl object-cover" />
        )}
        {url && item.media_type === "video" && <video src={url} controls playsInline className="max-h-72 w-full rounded-3xl" />}

        <p className="text-sm text-muted">
          Ajouté par {item.created_by} · {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3 ring-1 ring-line transition active:scale-[0.99]"
          >
            <Icon name="link" size={20} className="shrink-0 text-primary-ink" />
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-primary-ink">{item.link}</span>
            <Icon name="arrowRight" size={18} className="shrink-0 text-subtle" />
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
