import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";

export const metadata: Metadata = { title: "Agenda" };

export default function Page() {
  return (
    <>
      <PageHeading title="Agenda" />
      <EmptyState icon="calendar" title="Bientôt dans Nous">
        Le calendrier commun arrive bientôt.
      </EmptyState>
    </>
  );
}
