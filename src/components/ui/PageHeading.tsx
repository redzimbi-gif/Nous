import type { ReactNode } from "react";

export function PageHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4 pb-5 pt-3">
      <div className="min-w-0">
        <h1 className="font-display text-[34px] font-bold leading-[1.05] tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
