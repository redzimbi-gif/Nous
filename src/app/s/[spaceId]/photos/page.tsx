import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";

export const metadata: Metadata = { title: "Photos" };

export default function Page() {
  return (
    <>
      <PageHeading title="Photos" />
      <EmptyState icon="photo" title="Bientôt dans Nous">
        La galerie partagée arrive bientôt.
      </EmptyState>
    </>
  );
}
