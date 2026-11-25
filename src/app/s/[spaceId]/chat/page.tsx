import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";

export const metadata: Metadata = { title: "Chat" };

export default function Page() {
  return (
    <>
      <PageHeading title="Chat" />
      <EmptyState icon="chat" title="Bientôt dans Nous">
        Les messages arrivent bientôt.
      </EmptyState>
    </>
  );
}
