import type { ReactNode } from "react";
import MessageToast from "@/components/MessageToast";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";

/** Coque de l'application : en-tête, contenu qui défile dans sa zone, barre du bas. */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-bg text-ink">
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden">
        <div className="page-glow pointer-events-none absolute inset-x-0 top-0 h-64" aria-hidden="true" />
        <MessageToast />
        <AppHeader />
        <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
