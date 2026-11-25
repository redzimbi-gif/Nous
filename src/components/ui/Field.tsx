import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "h-12 w-full rounded-2xl bg-surface-2 px-4 text-base outline-none ring-1 ring-line transition placeholder:text-subtle focus:ring-2 focus:ring-primary";

/** Un champ de formulaire avec son libellé. */
export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}
