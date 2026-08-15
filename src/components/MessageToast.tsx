"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
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
              ? "📷 a envoyé une photo"
              : row.ref_id
                ? "🔖 a partagé une ref"
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
      className="fixed inset-x-3 z-[60] flex items-start gap-3 rounded-2xl bg-white p-3 text-left shadow-xl transition active:scale-[0.98] animate-pop-in"
      style={{ top: "calc(0.75rem + env(safe-area-inset-top))" }}
    >
      <span className="text-2xl">💬</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-blush-700">{toast.sender}</span>
        <span className="line-clamp-2 block text-sm text-blush-600">{toast.preview}</span>
      </span>
    </button>
  );
}
