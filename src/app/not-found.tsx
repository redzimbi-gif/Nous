import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center bg-bg px-5">
      <div className="w-full">
        <EmptyState icon="compass" title="Page introuvable" action={<ButtonLink href="/">Retour à l&apos;accueil</ButtonLink>}>
          Cette page n&apos;existe pas, ou tu n&apos;as pas accès à cet espace.
        </EmptyState>
      </div>
    </main>
  );
}
