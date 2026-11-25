"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import PillButton from "@/components/PillButton";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import Toggle from "@/components/Toggle";

type Status =
  | "checking"
  | "unsupported"
  | "ios-needs-install"
  | "denied"
  | "default"
  | "subscribed";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationsCard() {
  const { name } = useIdentity();
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) {
      setStatus("unsupported");
      return;
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isIOS && !isStandalone) {
      setStatus("ios-needs-install");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setStatus(sub ? "subscribed" : "default");
    });
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setBusy(false);
        return;
      }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        alert("Les notifications ne sont pas encore configurées côté serveur.");
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          { name, endpoint: sub.endpoint, subscription: sub.toJSON() },
          { onConflict: "endpoint" }
        );
      if (error) {
        alert("Notifications non enregistrées : " + error.message);
        setBusy(false);
        return;
      }
      setStatus("subscribed");
    } catch (e: unknown) {
      alert("Notifications non activées : " + (e instanceof Error ? e.message : String(e)));
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
    setStatus("default");
    setBusy(false);
  }

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-tint text-tint-ink">
          <Icon name="bell" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold">Notifications</p>
          <p className="text-sm text-muted">Être prévenu·e des nouveaux messages</p>
        </div>
      </div>

      <div className="mt-4">
        {status === "checking" && <p className="text-sm text-muted">Vérification…</p>}

        {status === "unsupported" && (
          <p className="text-sm leading-relaxed text-muted">Ton navigateur ne supporte pas les notifications.</p>
        )}

        {status === "ios-needs-install" && (
          <p className="text-sm leading-relaxed text-muted">
            Sur iPhone, ajoute d&apos;abord Nous à ton écran d&apos;accueil (bouton Partager ⬆️
            → &quot;Sur l&apos;écran d&apos;accueil&quot;), puis ouvre l&apos;app depuis
            l&apos;icône et reviens ici.
          </p>
        )}

        {status === "denied" && (
          <p className="text-sm leading-relaxed text-muted">
            Les notifications sont bloquées pour ce site. Autorise-les dans les réglages de
            ton navigateur pour les activer.
          </p>
        )}

        {status === "default" && (
          <PillButton onClick={enable} disabled={busy} className="w-full">
            {busy ? "…" : "Activer les notifications"}
          </PillButton>
        )}

        {status === "subscribed" && (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ok-ink">Activées</span>
            <Toggle checked onChange={disable} disabled={busy} label="Désactiver les notifications" />
          </div>
        )}
      </div>
    </Card>
  );
}
