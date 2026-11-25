import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { MODULES } from "@/modules/registry";

export default async function PreviewPlaceholder({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const def = MODULES.find((m) => m.key === module);
  if (!def) notFound();
  return (
    <>
      <PageHeading title={def.label} />
      <EmptyState icon={def.icon} title="Bientôt dans Nous">
        Cet écran arrive dans une prochaine étape.
      </EmptyState>
    </>
  );
}
