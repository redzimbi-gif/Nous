import AppShell from "@/components/shell/AppShell";
import { IdentityProvider } from "@/lib/identity";
import { StatusProvider } from "@/lib/status";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IdentityProvider>
      <StatusProvider>
        <AppShell>{children}</AppShell>
      </StatusProvider>
    </IdentityProvider>
  );
}
