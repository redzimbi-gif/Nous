"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Petit message qui s'efface tout seul (« Ajouté à l'album »). */
export function useNotice() {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((message: string) => {
    setText(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setText(null), 2600);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return { notice: text, show };
}

export function NoticeToast({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-6" style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}>
      <span className="animate-pop-in rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg shadow-float">{text}</span>
    </div>
  );
}
