"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Feuille qui monte du bas, basée sur l'élément natif <dialog> :
 * focus piégé, fermeture avec Échap et clic sur le fond gérés par le navigateur.
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="sheet-panel rounded-t-4xl bg-surface px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-sheet">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/15" aria-hidden="true" />
        <h2 className="px-3 pb-2 font-display text-lg font-semibold">{title}</h2>
        <div className="max-h-[68dvh] overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </dialog>
  );
}
