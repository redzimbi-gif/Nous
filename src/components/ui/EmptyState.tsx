import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function EmptyState({ icon, title, children, action }: { icon: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-16 items-center justify-center rounded-3xl bg-tint text-tint-ink">
        <Icon name={icon} size={28} />
      </span>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {children && <p className="max-w-xs text-[15px] leading-relaxed text-muted">{children}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
