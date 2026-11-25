"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/ui/Avatar";
import { useIdentity } from "@/lib/identity";
import { toneOfName } from "@/lib/tone";
import type { MessageRow } from "@/lib/types";

type Toast = { sender: string; preview: string };

export default function MessageToast() {
  const { name } = useIdentity();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [toast, setToast] = useState<Toast | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const channel = supabase
      .channel("message-toast")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as MessageRow;
          if (row.sender_name === name) return;
          if (pathnameRef.current === "/chat") return;

          const preview = row.content
            ? row.content
            : row.photo_id
              ? "A envoyé une photo"
              : row.audio_path
                ? "A envoyé un message vocal"
                : row.ref_id
                  ? "A partagé une réf"
                  : "";

          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setToast({ sender: row.sender_name, preview });
          timeoutRef.current = setTimeout(() => setToast(null), 4000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [name]);

  if (!toast) return null;

  return (
    <button
      onClick={() => {
        setToast(null);
        router.push("/chat");
      }}
      className="fixed inset-x-3 z-[60] mx-auto flex max-w-[456px] animate-pop-in items-center gap-3 rounded-3xl bg-surface p-3 pr-4 text-left shadow-float ring-1 ring-line transition active:scale-[0.98]"
      style={{ top: "calc(0.75rem + env(safe-area-inset-top))" }}
    >
      <Avatar name={toast.sender} tone={toneOfName(toast.sender)} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{toast.sender}</span>
        <span className="line-clamp-2 block text-sm text-muted">{toast.preview}</span>
      </span>
    </button>
  );
}
