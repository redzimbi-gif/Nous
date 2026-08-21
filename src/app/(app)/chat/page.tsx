"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  supabase,
  EPHEMERAL_BUCKET,
  PHOTOS_BUCKET,
  REFS_BUCKET,
  VOICES_BUCKET,
} from "@/lib/supabase";
import { getCachedSignedUrl } from "@/lib/signedUrlCache";
import { useIdentity } from "@/lib/identity";
import type { ChatReadRow, MessageRow, PhotoRow, RefRow } from "@/lib/types";
import MessageBubble from "@/components/MessageBubble";
import MessageActions from "@/components/MessageActions";
import RefPicker from "@/components/RefPicker";
import RefDetail from "@/components/RefDetail";
import CameraCapture, { type CapturedMedia } from "@/components/CameraCapture";
import EphemeralViewer from "@/components/EphemeralViewer";
import { sendNotification } from "@/lib/notify";

export default function ChatPage() {
  const { name, color } = useIdentity();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [photos, setPhotos] = useState<Record<string, PhotoRow>>({});
  const [refs, setRefs] = useState<Record<string, RefRow>>({});
  const [reads, setReads] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [pendingStatus, setPendingStatus] = useState<Record<string, "sending" | "failed">>({});
  const [pendingKinds, setPendingKinds] = useState<Record<string, "photo" | "voice" | "video">>(
    {}
  );
  const retryFns = useRef<Record<string, () => void>>({});
  const [view, setView] = useState<"chat" | "canards">("chat");
  const [activeMessage, setActiveMessage] = useState<MessageRow | null>(null);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const [viewingRef, setViewingRef] = useState<RefRow | null>(null);
  const [viewingRefUrl, setViewingRefUrl] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [viewingEphemeral, setViewingEphemeral] = useState<{
    message: MessageRow;
    url: string | null;
    kind: "image" | "video";
    mirrored: boolean;
  } | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!data) return;
    const ordered = [...data].reverse();
    setMessages(ordered);

    const photoIds = ordered.map((m) => m.photo_id).filter(Boolean) as string[];
    if (photoIds.length) {
      const { data: photoRows } = await supabase
        .from("photos")
        .select("*")
        .in("id", photoIds);
      if (photoRows) {
        const map: Record<string, PhotoRow> = {};
        photoRows.forEach((p) => (map[p.id] = p));
        setPhotos(map);
      }
    }

    const refIds = ordered.map((m) => m.ref_id).filter(Boolean) as string[];
    if (refIds.length) {
      const { data: refRows } = await supabase.from("refs").select("*").in("id", refIds);
      if (refRows) {
        const map: Record<string, RefRow> = {};
        refRows.forEach((r) => (map[r.id] = r));
        setRefs(map);
      }
    }
  }

  async function refreshMessages() {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  }

  useEffect(() => {
    loadMessages();

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
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    supabase
      .from("chat_reads")
      .select("*")
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        data.forEach((r) => (map[r.name] = r.last_read_at));
        setReads(map);
      });

    const channel = supabase
      .channel("chat-reads-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_reads" },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as ChatReadRow;
          setReads((prev) => ({ ...prev, [row.name]: row.last_read_at }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    function markRead() {
      if (view !== "chat" || document.visibilityState !== "visible") return;
      supabase.from("chat_reads").upsert({ name, last_read_at: new Date().toISOString() });
    }
    markRead();
    document.addEventListener("visibilitychange", markRead);
    return () => document.removeEventListener("visibilitychange", markRead);
  }, [messages, view, name]);

  const otherReadAt = useMemo(() => {
    const otherTimes = Object.entries(reads)
      .filter(([n]) => n !== name)
      .map(([, t]) => new Date(t).getTime());
    return otherTimes.length ? Math.max(...otherTimes) : null;
  }, [reads, name]);

  useEffect(() => {
    if (view === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, view]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function notify(preview: string) {
    sendNotification({ senderName: name, title: `💬 ${name}`, body: preview, url: "/chat" });
  }

  async function openRef(ref: RefRow) {
    setViewingRef(ref);
    setViewingRefUrl(null);
    if (ref.media_path) {
      const url = await getCachedSignedUrl(REFS_BUCKET, ref.media_path, 3600);
      setViewingRefUrl(url);
    }
  }

  async function openEphemeral(message: MessageRow) {
    if (!message.ephemeral_path || !message.ephemeral_type) return;
    setViewingEphemeral({
      message,
      url: null,
      kind: message.ephemeral_type,
      mirrored: message.ephemeral_mirrored,
    });
    const { data } = await supabase.storage
      .from(EPHEMERAL_BUCKET)
      .createSignedUrl(message.ephemeral_path, 120);
    setViewingEphemeral((v) => (v ? { ...v, url: data?.signedUrl ?? null } : v));
  }

  async function closeEphemeral() {
    const current = viewingEphemeral;
    setViewingEphemeral(null);
    const path = current?.message.ephemeral_path;
    if (!current || !path) return;
    await supabase.storage.from(EPHEMERAL_BUCKET).remove([path]);
    const { data } = await supabase
      .from("messages")
      .update({ ephemeral_path: null, ephemeral_viewed_at: new Date().toISOString() })
      .eq("id", current.message.id)
      .select()
      .single();
    if (data) setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)));
  }

  function resolveDraft(localId: string, row: MessageRow) {
    setMessages((prev) => prev.map((m) => (m.id === localId ? row : m)));
    setPendingStatus((prev) => {
      const next = { ...prev };
      delete next[localId];
      return next;
    });
    setPendingKinds((prev) => {
      const next = { ...prev };
      delete next[localId];
      return next;
    });
    delete retryFns.current[localId];
  }

  function retryMessage(id: string) {
    retryFns.current[id]?.();
  }

  async function sendText(retryId?: string, retryContent?: string) {
    const content = retryId ? retryContent! : text.trim();
    if (!content) return;
    const localId = retryId ?? `local-${crypto.randomUUID()}`;
    if (!retryId) {
      setText("");
      const draft: MessageRow = {
        id: localId,
        sender_name: name,
        content,
        photo_id: null,
        ref_id: null,
        audio_path: null,
        ephemeral_path: null,
        ephemeral_type: null,
        ephemeral_viewed_at: null,
        ephemeral_mirrored: false,
        saved: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, draft]);
    }
    setPendingStatus((prev) => ({ ...prev, [localId]: "sending" }));
    retryFns.current[localId] = () => sendText(localId, content);
    try {
      const { data: row, error } = await supabase
        .from("messages")
        .insert({ sender_name: name, content })
        .select()
        .single();
      if (error || !row) throw error ?? new Error("Message non envoyé");
      resolveDraft(localId, row);
      notify(content.length > 80 ? content.slice(0, 80) + "…" : content);
    } catch {
      setPendingStatus((prev) => ({ ...prev, [localId]: "failed" }));
    }
  }

  async function sendCapturedMedia(media: CapturedMedia, retryId?: string) {
    const localId = retryId ?? `local-${crypto.randomUUID()}`;
    if (!retryId) {
      const draft: MessageRow = {
        id: localId,
        sender_name: name,
        content: null,
        photo_id: null,
        ref_id: null,
        audio_path: null,
        ephemeral_path: null,
        ephemeral_type: media.ephemeral ? media.kind : null,
        ephemeral_viewed_at: null,
        ephemeral_mirrored: media.mirrored,
        saved: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, draft]);
      setPendingKinds((prev) => ({
        ...prev,
        [localId]: media.kind === "video" ? "video" : "photo",
      }));
    }
    setPendingStatus((prev) => ({ ...prev, [localId]: "sending" }));
    retryFns.current[localId] = () => sendCapturedMedia(media, localId);

    try {
      if (media.ephemeral) {
        const ext = media.kind === "video" ? (media.mimeType.includes("mp4") ? "mp4" : "webm") : "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(EPHEMERAL_BUCKET)
          .upload(path, media.blob, { contentType: media.mimeType });
        if (uploadError) throw uploadError;
        const { data: row, error } = await supabase
          .from("messages")
          .insert({
            sender_name: name,
            ephemeral_path: path,
            ephemeral_type: media.kind,
            ephemeral_mirrored: media.mirrored,
          })
          .select()
          .single();
        if (error || !row) throw error ?? new Error("Message non envoyé");
        resolveDraft(localId, row);
        notify(media.kind === "video" ? "🎥 a envoyé une vidéo éphémère" : "🔥 a envoyé une photo éphémère");
      } else {
        const path = `${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(PHOTOS_BUCKET)
          .upload(path, media.blob, { contentType: media.mimeType, cacheControl: "604800" });
        if (uploadError) throw uploadError;
        const { data: photoRow, error: photoError } = await supabase
          .from("photos")
          .insert({ storage_path: path, sender_name: name })
          .select()
          .single();
        if (photoError || !photoRow) throw photoError ?? new Error("Photo non enregistrée");
        setPhotos((prev) => ({ ...prev, [photoRow.id]: photoRow }));
        const { data: row, error: msgError } = await supabase
          .from("messages")
          .insert({ sender_name: name, photo_id: photoRow.id })
          .select()
          .single();
        if (msgError || !row) throw msgError ?? new Error("Message photo non envoyé");
        resolveDraft(localId, row);
        notify("📷 a envoyé une photo");
      }
    } catch {
      setPendingStatus((prev) => ({ ...prev, [localId]: "failed" }));
    }
  }

  async function startRecording() {
    if (typeof MediaRecorder === "undefined") {
      alert("Les messages vocaux ne sont pas pris en charge par ce navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      alert("Impossible d'accéder au micro — vérifie les autorisations du navigateur.");
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  function cancelRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = stopStream;
      recorder.stop();
    } else {
      stopStream();
    }
    audioChunksRef.current = [];
    setRecording(false);
    setRecordingSeconds(0);
  }

  function stopAndSendRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];
      stopStream();
      sendVoice(blob, mimeType);
    };
    recorder.stop();
    setRecording(false);
    setRecordingSeconds(0);
  }

  async function sendVoice(blob: Blob, mimeType: string, retryId?: string) {
    const localId = retryId ?? `local-${crypto.randomUUID()}`;
    if (!retryId) {
      const draft: MessageRow = {
        id: localId,
        sender_name: name,
        content: null,
        photo_id: null,
        ref_id: null,
        audio_path: null,
        ephemeral_path: null,
        ephemeral_type: null,
        ephemeral_viewed_at: null,
        ephemeral_mirrored: false,
        saved: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, draft]);
      setPendingKinds((prev) => ({ ...prev, [localId]: "voice" }));
    }
    setPendingStatus((prev) => ({ ...prev, [localId]: "sending" }));
    retryFns.current[localId] = () => sendVoice(blob, mimeType, localId);

    try {
      const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(VOICES_BUCKET)
        .upload(path, blob, { contentType: mimeType, cacheControl: "604800" });
      if (uploadError) throw uploadError;
      const { data: row, error } = await supabase
        .from("messages")
        .insert({ sender_name: name, audio_path: path })
        .select()
        .single();
      if (error || !row) throw error ?? new Error("Message vocal non envoyé");
      resolveDraft(localId, row);
      notify("🎤 a envoyé un message vocal");
    } catch {
      setPendingStatus((prev) => ({ ...prev, [localId]: "failed" }));
    }
  }

  async function sendRef(ref: RefRow, retryId?: string) {
    if (!retryId) setRefPickerOpen(false);
    const localId = retryId ?? `local-${crypto.randomUUID()}`;
    setRefs((prev) => ({ ...prev, [ref.id]: ref }));
    if (!retryId) {
      const draft: MessageRow = {
        id: localId,
        sender_name: name,
        content: null,
        photo_id: null,
        ref_id: ref.id,
        audio_path: null,
        ephemeral_path: null,
        ephemeral_type: null,
        ephemeral_viewed_at: null,
        ephemeral_mirrored: false,
        saved: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, draft]);
    }
    setPendingStatus((prev) => ({ ...prev, [localId]: "sending" }));
    retryFns.current[localId] = () => sendRef(ref, localId);

    try {
      const { data: row, error } = await supabase
        .from("messages")
        .insert({ sender_name: name, ref_id: ref.id })
        .select()
        .single();
      if (error || !row) throw error ?? new Error("Ref non envoyée");
      resolveDraft(localId, row);
      notify(`🔖 a partagé une ref : ${ref.title}`);
    } catch {
      setPendingStatus((prev) => ({ ...prev, [localId]: "failed" }));
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
        <button
          onClick={refreshMessages}
          disabled={refreshing}
          aria-label="Rafraîchir les messages"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-50 text-lg text-blush-500 transition active:scale-90 disabled:opacity-50"
        >
          <span className={refreshing ? "animate-spin" : ""}>🔄</span>
        </button>
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
            seen={
              view === "chat" &&
              otherReadAt !== null &&
              new Date(m.created_at).getTime() <= otherReadAt
            }
            status={pendingStatus[m.id]}
            pendingKind={pendingKinds[m.id]}
            onOpenActions={() => setActiveMessage(m)}
            onOpenRef={openRef}
            onOpenEphemeral={openEphemeral}
            onRetry={() => retryMessage(m.id)}
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
          {recording ? (
            <>
              <button
                type="button"
                onClick={cancelRecording}
                aria-label="Annuler l'enregistrement"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-100 text-lg text-blush-500 transition active:scale-90"
              >
                ✕
              </button>
              <div className="flex flex-1 items-center gap-2 rounded-full border-2 border-blush-100 bg-blush-50 px-4 py-2.5">
                <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-blush-600">
                  {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, "0")}
                </span>
              </div>
              <button
                type="button"
                onClick={stopAndSendRecording}
                aria-label="Envoyer le message vocal"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-500 text-white transition active:scale-90"
              >
                ➤
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xl transition active:scale-90"
              >
                📷
              </button>
              <button
                type="button"
                onClick={() => setRefPickerOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xl transition active:scale-90"
              >
                🔖
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Écris un message…"
                className="flex-1 rounded-full border-2 border-blush-100 bg-blush-50 px-4 py-2.5 outline-none transition focus:border-blush-300 focus-visible:ring-2 focus-visible:ring-blush-200"
              />
              {text.trim() ? (
                <button
                  type="submit"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-500 text-white transition active:scale-90"
                >
                  ➤
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  aria-label="Enregistrer un message vocal"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-500 text-lg text-white transition active:scale-90"
                >
                  🎤
                </button>
              )}
            </>
          )}
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

      {viewingRef && (
        <RefDetail
          item={viewingRef}
          url={viewingRefUrl ?? undefined}
          onClose={() => {
            setViewingRef(null);
            setViewingRefUrl(null);
          }}
        />
      )}

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onSend={(media) => {
            setCameraOpen(false);
            sendCapturedMedia(media);
          }}
        />
      )}

      {viewingEphemeral && (
        <EphemeralViewer
          url={viewingEphemeral.url}
          kind={viewingEphemeral.kind}
          mirrored={viewingEphemeral.mirrored}
          onClose={closeEphemeral}
        />
      )}
    </div>
  );
}
