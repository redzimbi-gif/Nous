import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui/Card";
import { previewEnabled } from "@/lib/preview";
import { SPACE_TYPE_INFO } from "@/lib/theme";
import { SPACE_TYPES } from "@/lib/types";

export default function PreviewHub() {
  if (!previewEnabled()) notFound();
  return (
    <main className="mx-auto min-h-dvh max-w-[480px] bg-bg px-5 py-8 text-ink">
      <Logo />
      <h1 className="pb-1 pt-8 font-display text-[34px] font-bold leading-[1.05]">Aperçu de l&apos;interface</h1>
      <p className="pb-6 text-[15px] text-muted">Données fictives, sans connexion. Une palette par type d&apos;espace.</p>
      <ul className="space-y-3">
        {SPACE_TYPES.map((type) => (
          <li key={type} data-space-type={type}>
            <Link href={`/preview/${type}`}>
              <Card className="p-4 font-display text-lg font-semibold">{SPACE_TYPE_INFO[type].label}</Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
