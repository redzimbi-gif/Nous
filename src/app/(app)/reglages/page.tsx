"use client";

import { useRouter } from "next/navigation";
import NotificationsCard from "@/components/NotificationsCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageHeading } from "@/components/ui/PageHeading";
import { useIdentity } from "@/lib/identity";
import { toneOfIdentity } from "@/lib/tone";

export default function ReglagesPage() {
  const { name, color } = useIdentity();
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="h-full overflow-y-auto px-5 pb-6">
      <PageHeading title="Réglages" subtitle="Notifications et session" />
      <div className="space-y-4">
        <Card className="flex items-center gap-4 p-4">
          <Avatar name={name} tone={toneOfIdentity(color)} size="lg" />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">{name}</p>
            <p className="text-sm text-muted">Sur cet appareil</p>
          </div>
        </Card>
        <NotificationsCard />
        <Button variant="soft" block onClick={logout}>
          <Icon name="logout" size={20} /> Se déconnecter
        </Button>
      </div>
    </div>
  );
}
