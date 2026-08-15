"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";

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
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-3">
        <span className="text-3xl">🔔</span>
        <div>
          <p className="font-bold text-blush-800">Notifications</p>
          <p className="text-xs text-blush-400">Être prévenu·e des nouveaux messages</p>
        </div>
      </div>

      <div className="mt-3">
        {status === "checking" && <p className="text-sm text-blush-300">Vérification…</p>}

        {status === "unsupported" && (
          <p className="text-sm text-blush-400">
            Ton navigateur ne supporte pas les notifications.
          </p>
        )}

        {status === "ios-needs-install" && (
          <p className="text-sm text-blush-400">
            Sur iPhone, ajoute d&apos;abord Nous à ton écran d&apos;accueil (bouton Partager ⬆️
            → &quot;Sur l&apos;écran d&apos;accueil&quot;), puis ouvre l&apos;app depuis
            l&apos;icône et reviens ici.
          </p>
        )}

        {status === "denied" && (
          <p className="text-sm text-blush-400">
            Les notifications sont bloquées pour ce site. Autorise-les dans les réglages de
            ton navigateur pour les activer.
          </p>
        )}

        {status === "default" && (
          <button
            onClick={enable}
            disabled={busy}
            className="w-full rounded-xl bg-blush-500 py-2.5 font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "…" : "Activer les notifications"}
          </button>
        )}

        {status === "subscribed" && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-600">Activées ✅</span>
            <button
              onClick={disable}
              disabled={busy}
              className="rounded-full bg-blush-50 px-3 py-1.5 text-xs font-bold text-blush-500 transition active:scale-95 disabled:opacity-50"
            >
              Désactiver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
