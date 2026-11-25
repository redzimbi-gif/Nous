"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Feuille qui monte du bas, basée sur l'élément natif <dialog> :
 * focus piégé, fermeture avec Échap et clic sur le fond gérés par le navigateur.
 *
 * `onClose` n'est appelé que pour une fermeture venue de l'utilisateur (Échap, fond).
 * Quand c'est le parent qui ferme la feuille (open → false), le navigateur émet quand même
 * un évènement « close », un peu plus tard : sans filtre, il refermerait la feuille suivante
 * que le parent vient d'ouvrir (menu → humeurs).
 */
export function Sheet({ open, onClose, title, children, tall }: { open: boolean; onClose: () => void; title: string; children: ReactNode; tall?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closedByParent = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) {
      closedByParent.current = true;
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onClose={() => {
        if (closedByParent.current) {
          closedByParent.current = false;
          return;
        }
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="sheet-panel rounded-t-4xl bg-surface px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-sheet">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/15" aria-hidden="true" />
        <h2 className="px-3 pb-2 font-display text-lg font-semibold">{title}</h2>
        <div className={cn("overflow-y-auto overscroll-contain", tall ? "max-h-[80dvh]" : "max-h-[68dvh]")}>{children}</div>
      </div>
    </dialog>
  );
}
