"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, PHOTOS_BUCKET } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { MessageRow, PhotoRow } from "@/lib/types";
import MessageBubble from "@/components/MessageBubble";

export default function ChatPage() {
  const { name, color } = useIdentity();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [photos, setPhotos] = useState<Record<string, PhotoRow>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!active || !data) return;
      const ordered = [...data].reverse();
      setMessages(ordered);

      const photoIds = ordered.map((m) => m.photo_id).filter(Boolean) as string[];
      if (photoIds.length) {
        const { data: photoRows } = await supabase
          .from("photos")
          .select("*")
          .in("id", photoIds);
        if (photoRows && active) {
          const map: Record<string, PhotoRow> = {};
          photoRows.forEach((p) => (map[p.id] = p));
          setPhotos(map);
        }
      }
    }

    load();

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row]
          );
          if (row.photo_id) {
            const { data: photoRow } = await supabase
              .from("photos")
              .select("*")
              .eq("id", row.photo_id)
              .single();
            if (photoRow) {
              setPhotos((prev) => ({ ...prev, [photoRow.id]: photoRow }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendText() {
    const content = text.trim();
    if (!content) return;
    setText("");
    try {
      const { data: row, error } = await supabase
        .from("messages")
        .insert({ sender_name: name, content })
        .select()
        .single();
      if (error) {
        alert("Message non envoyé (erreur Supabase) :\n" + JSON.stringify(error, null, 2));
        return;
      }
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
    } catch (e: any) {
      alert(
        "Message non envoyé (exception) :\n" +
          (e?.message ?? String(e)) +
          "\n\n--- stack ---\n" +
          (e?.stack ?? "(pas de stack)") +
          "\n\n--- nom/contenu ---\nname=" +
          JSON.stringify(name) +
          " content=" +
          JSON.stringify(content)
      );
    }
  }

  async function sendPhoto(file: File) {
    setSending(true);
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(path, file);
    if (uploadError) {
      alert("Photo non envoyée : " + uploadError.message);
      setSending(false);
      return;
    }
    const { data: photoRow, error: photoError } = await supabase
      .from("photos")
      .insert({ storage_path: path, sender_name: name })
      .select()
      .single();
    if (photoError || !photoRow) {
      alert("Photo non envoyée : " + (photoError?.message ?? "erreur inconnue"));
      setSending(false);
      return;
    }
    setPhotos((prev) => ({ ...prev, [photoRow.id]: photoRow }));
    const { data: row, error: msgError } = await supabase
      .from("messages")
      .insert({ sender_name: name, photo_id: photoRow.id })
      .select()
      .single();
    if (msgError) {
      alert("Message photo non envoyé : " + msgError.message);
    } else if (row) {
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
    }
    setSending(false);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3">
        <h1 className="text-lg font-extrabold text-blush-700">💬 Chat</h1>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="mt-16 text-center text-sm text-blush-300">
            Dites bonjour 👋
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            photo={m.photo_id ? photos[m.photo_id] : undefined}
            isMine={m.sender_name === name}
            color={color}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendText();
        }}
        className="flex items-center gap-2 border-t border-blush-100 bg-white px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) sendPhoto(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xl disabled:opacity-50"
        >
          📷
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écris un message…"
          className="flex-1 rounded-full border-2 border-blush-100 bg-blush-50 px-4 py-2.5 outline-none focus:border-blush-300"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-500 text-white disabled:opacity-50"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
