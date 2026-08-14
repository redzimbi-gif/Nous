import BottomNav from "@/components/BottomNav";
import { IdentityProvider } from "@/lib/identity";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IdentityProvider>
      <div className="flex h-[100dvh] flex-col bg-cream">
        <div className="flex-1 overflow-hidden">{children}</div>
        <BottomNav />
      </div>
    </IdentityProvider>
  );
}
