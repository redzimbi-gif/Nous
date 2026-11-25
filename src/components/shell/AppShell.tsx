import type { ReactNode } from "react";
import type { SpaceType } from "@/lib/types";
import { AppHeader } from "./AppHeader";
import { BottomNav, type Tab } from "./BottomNav";

type HeaderProps = Parameters<typeof AppHeader>[0];

interface Props extends HeaderProps {
  type: SpaceType;
  base: string;
  tabs: Tab[];
  children: ReactNode;
}

/** Coque de l'application dans un espace : en-tête, contenu, barre du bas. */
export function AppShell({ type, base, tabs, children, ...header }: Props) {
  return (
    <div data-space-type={type} className="min-h-dvh bg-bg text-ink">
      <div className="relative mx-auto min-h-dvh w-full max-w-[480px]">
        <div className="page-glow pointer-events-none absolute inset-x-0 top-0 h-80" aria-hidden="true" />
        <AppHeader {...header} />
        <main className="relative px-5 pb-[calc(7rem+env(safe-area-inset-bottom))]">{children}</main>
        <BottomNav tabs={tabs} base={base} />
      </div>
    </div>
  );
}
