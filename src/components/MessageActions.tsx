"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import type { MessageRow } from "@/lib/types";

function ActionRow({ icon, label, hint, onClick }: { icon: ReactNode; label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3.5 rounded-2xl px-3 py-2.5 text-left transition hover:bg-tint/50 active:scale-[0.99]">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tint text-tint-ink">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[17px] font-semibold">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </button>
  );
}

const icon = (name: IconName) => <Icon name={name} size={21} />;

export default function MessageActions({
  message,
  preview,
  onClose,
  onReply,
  onCopy,
  onToggleSaved,
  onSendToTodo,
  canSaveToArmoire,
  onSaveToArmoire,
}: {
  message: MessageRow | null;
  preview: string;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onToggleSaved: () => void;
  onSendToTodo: () => void;
  canSaveToArmoire: boolean;
  onSaveToArmoire: () => void;
}) {
  return (
    <Sheet open={!!message} onClose={onClose} title="Ce message">
      {message && (
        <div className="px-1 pb-1">
          <p className="mx-2 mb-2 line-clamp-2 rounded-2xl bg-surface-2 px-3.5 py-2.5 text-[15px] text-muted">
            <span className="font-bold text-ink">{message.sender_name}</span> · {preview}
          </p>
          <ActionRow icon={icon("reply")} label="Répondre" onClick={onReply} />
          {message.content && <ActionRow icon={icon("copy")} label="Copier le texte" onClick={onCopy} />}
          <ActionRow
            icon={<span className="text-xl leading-none">🦆</span>}
            label={message.saved ? "Retirer des canards" : "Ajouter aux canards"}
            hint={message.saved ? undefined : "Pour le retrouver facilement"}
            onClick={onToggleSaved}
          />
          {canSaveToArmoire && <ActionRow icon={icon("archive")} label="Enregistrer dans l'armoire" hint="Lien ou photo, rangé par catégorie" onClick={onSaveToArmoire} />}
          {message.content && <ActionRow icon={icon("tasks")} label="Envoyer vers À faire" onClick={onSendToTodo} />}
        </div>
      )}
    </Sheet>
  );
}
