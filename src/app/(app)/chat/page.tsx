"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, PHOTOS_BUCKET } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { MessageRow, PhotoRow, RefRow } from "@/lib/types";
import MessageBubble from "@/components/MessageBubble";
import MessageActions from "@/components/MessageActions";
import RefPicker from "@/components/RefPicker";
import { sendNotification } from "@/lib/notify";

export default function ChatPage() {
  const { name, color } = useIdentity();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [photos, setPhotos] = useState<Record<string, PhotoRow>>({});
  const [refs, setRefs] = useState<Record<string, RefRow>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<"chat" | "canards">("chat");
  const [activeMessage, setActiveMessage] = useState<MessageRow | null>(null);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
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

      const refIds = ordered.map((m) => m.ref_id).filter(Boolean) as string[];
      if (refIds.length) {
        const { data: refRows } = await supabase.from("refs").select("*").in("id", refIds);
        if (refRows && active) {
          const map: Record<string, RefRow> = {};
          refRows.forEach((r) => (map[r.id] = r));
          setRefs(map);
        }
      }
    }

    load();

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        async (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as MessageRow;
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === row.id);
            return exists ? prev.map((m) => (m.id === row.id ? row : m)) : [...prev, row];
          });
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
          if (row.ref_id) {
            const { data: refRow } = await supabase
              .from("refs")
              .select("*")
              .eq("id", row.ref_id)
              .single();
            if (refRow) {
              setRefs((prev) => ({ ...prev, [refRow.id]: refRow }));
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
    if (view === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, view]);

  function notify(preview: string) {
    sendNotification({ senderName: name, title: `💬 ${name}`, body: preview, url: "/chat" });
  }

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
        alert("Message non envoyé : " + error.message);
        return;
      }
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
      notify(content.length > 80 ? content.slice(0, 80) + "…" : content);
    } catch (e: any) {
      alert("Message non envoyé : " + (e?.message ?? String(e)));
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
      notify("📷 a envoyé une photo");
    }
    setSending(false);
  }

  async function sendRef(ref: RefRow) {
    setRefPickerOpen(false);
    const { data: row, error } = await supabase
      .from("messages")
      .insert({ sender_name: name, ref_id: ref.id })
      .select()
      .single();
    if (error) {
      alert("Ref non envoyée : " + error.message);
      return;
    }
    setRefs((prev) => ({ ...prev, [ref.id]: ref }));
    if (row) {
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
      notify(`🔖 a partagé une ref : ${ref.title}`);
    }
  }

  async function toggleSaved(message: MessageRow) {
    setActiveMessage(null);
    const { data, error } = await supabase
      .from("messages")
      .update({ saved: !message.saved })
      .eq("id", message.id)
      .select()
      .single();
    if (error) {
      alert("Non enregistré : " + error.message);
      return;
    }
    if (data) setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)));
  }

  async function sendToTodo(message: MessageRow) {
    setActiveMessage(null);
    if (!message.content) return;
    const { error } = await supabase
      .from("todos")
      .insert({ content: message.content, created_by: name, category: null });
    if (error) {
      alert("Tâche non ajoutée : " + error.message);
      return;
    }
    sendNotification({
      senderName: name,
      title: "✅ Nouvelle tâche",
      body: message.content,
      url: "/todo",
    });
  }

  const displayedMessages = view === "canards" ? messages.filter((m) => m.saved) : messages;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3">
        <h1 className="text-lg font-extrabold text-blush-700">💬 Chat</h1>
      </header>

      <div className="flex border-b border-blush-100 bg-white px-4">
        <button
          onClick={() => setView("chat")}
          className={`flex-1 border-b-2 py-2.5 text-sm font-bold transition ${
            view === "chat" ? "border-blush-500 text-blush-700" : "border-transparent text-blush-300"
          }`}
        >
          💬 Conversation
        </button>
        <button
          onClick={() => setView("canards")}
          className={`flex-1 border-b-2 py-2.5 text-sm font-bold transition ${
            view === "canards" ? "border-blush-500 text-blush-700" : "border-transparent text-blush-300"
          }`}
        >
          🦆 Les canards
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {view === "chat" && messages.length === 0 && (
          <p className="mt-16 text-center text-sm text-blush-300">Dites bonjour 👋</p>
        )}
        {view === "canards" && displayedMessages.length === 0 && (
          <p className="mt-16 text-center text-sm text-blush-300">
            Aucun message enregistré — appuie sur ⋯ sous un message pour l&apos;ajouter ici 🦆
          </p>
        )}
        {displayedMessages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            photo={m.photo_id ? photos[m.photo_id] : undefined}
            refItem={m.ref_id ? refs[m.ref_id] : undefined}
            isMine={m.sender_name === name}
            color={color}
            onOpenActions={() => setActiveMessage(m)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {view === "chat" && (
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xl transition active:scale-90 disabled:opacity-50 disabled:active:scale-100"
          >
            📷
          </button>
          <button
            type="button"
            onClick={() => setRefPickerOpen(true)}
            disabled={sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xl transition active:scale-90 disabled:opacity-50 disabled:active:scale-100"
          >
            🔖
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écris un message…"
            className="flex-1 rounded-full border-2 border-blush-100 bg-blush-50 px-4 py-2.5 outline-none transition focus:border-blush-300 focus-visible:ring-2 focus-visible:ring-blush-200"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-500 text-white transition active:scale-90 disabled:opacity-50 disabled:active:scale-100"
          >
            ➤
          </button>
        </form>
      )}

      {activeMessage && (
        <MessageActions
          message={activeMessage}
          onClose={() => setActiveMessage(null)}
          onToggleSaved={() => toggleSaved(activeMessage)}
          onSendToTodo={() => sendToTodo(activeMessage)}
        />
      )}

      {refPickerOpen && (
        <RefPicker onClose={() => setRefPickerOpen(false)} onSelect={sendRef} />
      )}
    </div>
  );
}
