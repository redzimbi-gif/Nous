"use client";

import type { MessageRow } from "@/lib/types";

export default function MessageActions({
  message,
  onClose,
  onToggleSaved,
  onSendToTodo,
}: {
  message: MessageRow;
  onClose: () => void;
  onToggleSaved: () => void;
  onSendToTodo: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-blush-900/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-3xl bg-white p-4 sm:rounded-3xl"
      >
        <div className="mb-3 flex justify-center">
          <span className="h-1 w-10 rounded-full bg-blush-100" />
        </div>

        <button
          onClick={onToggleSaved}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold text-blush-700 transition active:scale-[0.98]"
        >
          <span className="text-2xl">🦆</span>
          {message.saved ? "Retirer des canards" : "Enregistrer dans les canards"}
        </button>

        {message.content && (
          <button
            onClick={onSendToTodo}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold text-blush-700 transition active:scale-[0.98]"
          >
            <span className="text-2xl">✅</span>
            Envoyer vers la to-do
          </button>
        )}

        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl bg-blush-50 py-3 font-bold text-blush-500 transition active:scale-[0.98]"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
