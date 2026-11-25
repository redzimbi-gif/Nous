import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/ui/Icon";

/** Mise en page des écrans hors espace : connexion, liste des espaces, création. */
export function AccountShell({ children, signOut, back }: { children: ReactNode; signOut?: () => void | Promise<void>; back?: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="relative mx-auto min-h-dvh w-full max-w-[480px] px-5 pb-12">
        <div className="page-glow pointer-events-none absolute inset-x-0 top-0 h-80" aria-hidden="true" />
        <header className="relative flex h-[calc(4.25rem+env(safe-area-inset-top))] items-center justify-between pt-[env(safe-area-inset-top)]">
          {back ?? <Logo />}
          {signOut && (
            <form action={signOut}>
              <button type="submit" aria-label="Se déconnecter" className="flex size-11 items-center justify-center rounded-full bg-surface text-muted shadow-card ring-1 ring-line transition active:scale-95">
                <Icon name="logout" size={20} />
              </button>
            </form>
          )}
        </header>
        <main className="relative">{children}</main>
      </div>
    </div>
  );
}
