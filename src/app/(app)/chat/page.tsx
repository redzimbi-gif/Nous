"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AttachSheet from "@/components/AttachSheet";
import CameraCapture, { type CapturedMedia } from "@/components/CameraCapture";
import EphemeralViewer from "@/components/EphemeralViewer";
import Lightbox from "@/components/Lightbox";
import MessageActions from "@/components/MessageActions";
import MessageBubble, { type Quote, type RefState } from "@/components/MessageBubble";
import PhotoPicker from "@/components/PhotoPicker";
import RefDetail from "@/components/RefDetail";
import RefPicker from "@/components/RefPicker";
import SaveToArmoireSheet, { type SaveSource } from "@/components/refs/SaveToArmoireSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { dayLabel, isSameDay, previewOf, sameGroup } from "@/lib/chat";
import { cn } from "@/lib/cn";
import { useIdentity } from "@/lib/identity";
import { prepareImage, type PreparedImage } from "@/lib/image";
import { ensureRefPreview, needsPreview } from "@/lib/linkPreview";
import { extractUrls } from "@/lib/refs";
import { sendNotification } from "@/lib/notify";
import { getCachedSignedUrl, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { EPHEMERAL_BUCKET, PHOTOS_BUCKET, REFS_BUCKET, VOICES_BUCKET, supabase } from "@/lib/supabase";
import { toneOfIdentity } from "@/lib/tone";
import type { ChatReadRow, MessageRow, PhotoRow, RefRow } from "@/lib/types";

const noop = () => {};
const MAX_PHONE_PHOTOS = 10;

type PendingKind = "photo" | "voice" | "video";

type Delivery = {
  /** Présent quand on réessaie un envoi qui a échoué. */
  localId?: string;
  draft: Partial<MessageRow>;
  kind?: PendingKind;
  previewUrl?: string;
  notifyText: string;
  /** Téléverse ce qu'il faut, insère le message et renvoie la ligne créée. */
  run: () => Promise<MessageRow>;
};

export default function ChatPage() {
  const { name, color } = useIdentity();
  const myTone = toneOfIdentity(color);

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [photos, setPhotos] = useState<Record<string, PhotoRow>>({});
  const [refs, setRefs] = useState<Record<string, RefRow>>({});
  const [missingRefs, setMissingRefs] = useState<Set<string>>(new Set());
  const [originals, setOriginals] = useState<Record<string, MessageRow>>({});
  const [reads, setReads] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [pendingStatus, setPendingStatus] = useState<Record<string, "sending" | "failed">>({});
  const [pendingKinds, setPendingKinds] = useState<Record<string, PendingKind>>({});
  const [pendingPreviews, setPendingPreviews] = useState<Record<string, string>>({});
  const [view, setView] = useState<"chat" | "canards">("chat");
  const [activeMessage, setActiveMessage] = useState<MessageRow | null>(null);
  const [replyTo, setReplyToState] = useState<MessageRow | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [viewingRef, setViewingRef] = useState<RefRow | null>(null);
  const [viewingRefUrl, setViewingRefUrl] = useState<string | null>(null);
  const [saveSource, setSaveSource] = useState<SaveSource | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<{ photo: PhotoRow; url: string } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [viewingEphemeral, setViewingEphemeral] = useState<{ message: MessageRow; url: string | null; kind: "image" | "video"; mirrored: boolean } | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nearBottomRef = useRef(true);
  const previousCountRef = useRef(0);
  const replyRef = useRef<MessageRow | null>(null);
  const retryFns = useRef<Record<string, () => void>>({});
  const requestedOriginals = useRef<Set<string>>(new Set());
  const pendingScrollTo = useRef<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewUrlsRef = useRef<Record<string, string>>({});

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2600);
  }, []);

  function setReply(message: MessageRow | null) {
    replyRef.current = message;
    setReplyToState(message);
  }

  /** Récupère (et efface) le message auquel on est en train de répondre. */
  function takeReply(): string | null {
    const id = replyRef.current?.id ?? null;
    if (id) setReply(null);
    return id;
  }

  // ---------------------------------------------------------------- chargement

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(50);
    if (!data) return;
    const ordered = [...data].reverse() as MessageRow[];
    // On garde les messages en cours d'envoi : un rafraîchissement ne doit jamais les faire disparaître.
    setMessages((prev) => [...ordered, ...prev.filter((m) => m.id.startsWith("local-"))]);
    setLoaded(true);

    const photoIds = ordered.map((m) => m.photo_id).filter(Boolean) as string[];
    if (photoIds.length) {
      const { data: photoRows } = await supabase.from("photos").select("*").in("id", photoIds);
      if (photoRows) {
        setPhotos((prev) => {
          const next = { ...prev };
          photoRows.forEach((p) => (next[p.id] = p));
          return next;
        });
      }
    }

    const refIds = ordered.map((m) => m.ref_id).filter(Boolean) as string[];
    if (refIds.length) {
      const { data: refRows } = await supabase.from("refs").select("*").in("id", refIds);
      if (refRows) {
        setRefs((prev) => {
          const next = { ...prev };
          refRows.forEach((r) => (next[r.id] = r));
          return next;
        });
        const found = new Set(refRows.map((r) => r.id));
        setMissingRefs((prev) => new Set([...prev, ...refIds.filter((id) => !found.has(id))]));
      }
    }
  }, []);

  async function refreshMessages() {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  }

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, async (payload) => {
        if (payload.eventType === "DELETE") return;
        const row = payload.new as MessageRow;
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === row.id);
          return exists ? prev.map((m) => (m.id === row.id ? row : m)) : [...prev, row];
        });
        if (row.photo_id) {
          const { data: photoRow } = await supabase.from("photos").select("*").eq("id", row.photo_id).single();
          if (photoRow) setPhotos((prev) => ({ ...prev, [photoRow.id]: photoRow }));
        }
        if (row.ref_id) {
          const { data: refRow } = await supabase.from("refs").select("*").eq("id", row.ref_id).single();
          if (refRow) setRefs((prev) => ({ ...prev, [refRow.id]: refRow }));
          else setMissingRefs((prev) => new Set(prev).add(row.ref_id as string));
        }
      })
      .subscribe();

    // Au retour sur l'application (PWA mise en veille), on rattrape ce qu'on a manqué.
    function onVisible() {
      if (document.visibilityState === "visible") loadMessages();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadMessages]);

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
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reads" }, (payload) => {
        if (payload.eventType === "DELETE") return;
        const row = payload.new as ChatReadRow;
        setReads((prev) => ({ ...prev, [row.name]: row.last_read_at }));
      })
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

  // Les réfs avec un lien n'ont pas toutes leur aperçu : on le lit une fois, puis il est mémorisé pour tout le monde.
  useEffect(() => {
    for (const ref of Object.values(refs).filter(needsPreview).slice(0, 6)) {
      ensureRefPreview(ref).then((updated) => {
        if (updated) setRefs((prev) => ({ ...prev, [updated.id]: updated }));
      });
    }
  }, [refs]);

  // ---------------------------------------------------------------- citations

  const byId = useMemo(() => {
    const map = new Map<string, MessageRow>();
    Object.values(originals).forEach((m) => map.set(m.id, m));
    messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [messages, originals]);

  // Un message cite parfois un message plus ancien que les 50 chargés : on va le chercher.
  useEffect(() => {
    const ids = new Set<string>();
    for (const m of messages) {
      if (m.reply_to && !byId.has(m.reply_to) && !requestedOriginals.current.has(m.reply_to)) ids.add(m.reply_to);
    }
    if (!ids.size) return;
    ids.forEach((id) => requestedOriginals.current.add(id));
    supabase
      .from("messages")
      .select("*")
      .in("id", [...ids])
      .then(({ data }) => {
        if (!data?.length) return;
        setOriginals((prev) => {
          const next = { ...prev };
          (data as MessageRow[]).forEach((r) => (next[r.id] = r));
          return next;
        });
      });
  }, [messages, byId]);

  function quoteOf(message: MessageRow): Quote | null {
    if (!message.reply_to) return null;
    const original = byId.get(message.reply_to);
    if (!original) return null;
    return {
      id: original.id,
      sender: original.sender_name === name ? "Toi" : original.sender_name,
      preview: previewOf(original, original.ref_id ? refs[original.ref_id] : undefined),
    };
  }

  const scrollToMessage = useCallback(
    (id: string) => {
      const el = scrollRef.current?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(id)}"]`);
      if (!el) {
        showNotice("Ce message est plus ancien que ceux affichés.");
        return;
      }
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      setHighlightId(id);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setHighlightId(null), 1500);
    },
    [showNotice],
  );

  function openQuote(id: string) {
    if (view === "canards") {
      // L'original n'est pas forcément un canard : on revient à la conversation avant de s'y rendre.
      pendingScrollTo.current = id;
      setView("chat");
      return;
    }
    scrollToMessage(id);
  }

  useEffect(() => {
    if (view === "chat" && pendingScrollTo.current) {
      const id = pendingScrollTo.current;
      pendingScrollTo.current = null;
      requestAnimationFrame(() => scrollToMessage(id));
    }
  }, [view, scrollToMessage]);

  // ---------------------------------------------------------------- défilement

  useEffect(() => {
    if (view !== "chat") return;
    const el = scrollRef.current;
    if (!el) return;
    const count = messages.length;
    const grew = count > previousCountRef.current;
    const first = previousCountRef.current === 0 && count > 0;
    previousCountRef.current = count;
    if (first) {
      el.scrollTop = el.scrollHeight;
      return;
    }
    const last = messages[count - 1];
    if (grew && (nearBottomRef.current || last?.sender_name === name)) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, view, name]);

  useEffect(() => {
    if (view === "chat" && !pendingScrollTo.current) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [view]);

  // Photos, aperçus et polices arrivent après les messages et allongent la liste : tant qu'on est en bas, on y reste.
  useEffect(() => {
    const el = scrollRef.current;
    const inner = innerRef.current;
    if (!el || !inner || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (nearBottomRef.current && !pendingScrollTo.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(inner);
    observer.observe(el); // le champ de saisie grandit : la zone visible rétrécit
    return () => observer.disconnect();
  }, [view]);

  // Le champ de saisie grandit avec le texte, jusqu'à cinq lignes environ.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [text, view, recording]);

  useEffect(() => {
    const previews = previewUrlsRef.current;
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // ---------------------------------------------------------------- ouverture de contenus

  function notify(preview: string) {
    sendNotification({ senderName: name, title: `💬 ${name}`, body: preview, url: "/chat" });
  }

  async function openRef(ref: RefRow) {
    setViewingRef(ref);
    setViewingRefUrl(null);
    if (ref.media_path) {
      const url = await getCachedSignedUrl(REFS_BUCKET, ref.media_path, LONG_TTL_SECONDS);
      setViewingRefUrl(url);
    }
  }

  async function openEphemeral(message: MessageRow) {
    if (!message.ephemeral_path || !message.ephemeral_type) return;
    setViewingEphemeral({ message, url: null, kind: message.ephemeral_type, mirrored: message.ephemeral_mirrored });
    const { data } = await supabase.storage.from(EPHEMERAL_BUCKET).createSignedUrl(message.ephemeral_path, 120);
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

  // ---------------------------------------------------------------- envoi

  function makeDraft(localId: string, patch: Partial<MessageRow>): MessageRow {
    return {
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
      reply_to: null,
      created_at: new Date().toISOString(),
      ...patch,
    };
  }

  function resolveDraft(localId: string, row: MessageRow) {
    setMessages((prev) => {
      // Le temps réel a pu livrer la ligne avant la réponse de l'insertion : on évite le doublon.
      if (prev.some((m) => m.id === row.id)) return prev.filter((m) => m.id !== localId).map((m) => (m.id === row.id ? row : m));
      return prev.map((m) => (m.id === localId ? row : m));
    });
    const drop = <T,>(prev: Record<string, T>) => {
      const next = { ...prev };
      delete next[localId];
      return next;
    };
    setPendingStatus(drop);
    setPendingKinds(drop);
    setPendingPreviews(drop);
    const preview = previewUrlsRef.current[localId];
    if (preview) {
      URL.revokeObjectURL(preview);
      delete previewUrlsRef.current[localId];
    }
    delete retryFns.current[localId];
  }

  async function deliver(opts: Delivery) {
    const localId = opts.localId ?? `local-${crypto.randomUUID()}`;
    if (!opts.localId) {
      setMessages((prev) => [...prev, makeDraft(localId, opts.draft)]);
      if (opts.kind) setPendingKinds((prev) => ({ ...prev, [localId]: opts.kind as PendingKind }));
      if (opts.previewUrl) {
        previewUrlsRef.current[localId] = opts.previewUrl;
        setPendingPreviews((prev) => ({ ...prev, [localId]: opts.previewUrl as string }));
      }
    }
    setPendingStatus((prev) => ({ ...prev, [localId]: "sending" }));
    retryFns.current[localId] = () => deliver({ ...opts, localId });
    try {
      const row = await opts.run();
      resolveDraft(localId, row);
      notify(opts.notifyText);
    } catch {
      setPendingStatus((prev) => ({ ...prev, [localId]: "failed" }));
    }
  }

  async function insertMessage(payload: Record<string, unknown>, replyId: string | null): Promise<MessageRow> {
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_name: name, ...payload, ...(replyId ? { reply_to: replyId } : {}) })
      .select()
      .single();
    if (error || !data) throw error ?? new Error("Message non envoyé");
    return data as MessageRow;
  }

  function sendText() {
    const content = text.trim();
    if (!content) return;
    const replyId = takeReply();
    setText("");
    deliver({
      draft: { content, reply_to: replyId },
      notifyText: content.length > 80 ? `${content.slice(0, 80)}…` : content,
      run: () => insertMessage({ content }, replyId),
    });
  }

  function sendPhoto(image: PreparedImage, replyId: string | null) {
    deliver({
      draft: { reply_to: replyId },
      kind: "photo",
      previewUrl: URL.createObjectURL(image.blob),
      notifyText: "📷 a envoyé une photo",
      run: async () => {
        const path = `${crypto.randomUUID()}.${image.ext}`;
        const { error: uploadError } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, image.blob, { contentType: image.mimeType, cacheControl: "604800" });
        if (uploadError) throw uploadError;
        const { data: photoRow, error: photoError } = await supabase.from("photos").insert({ storage_path: path, sender_name: name }).select().single();
        if (photoError || !photoRow) throw photoError ?? new Error("Photo non enregistrée");
        setPhotos((prev) => ({ ...prev, [photoRow.id]: photoRow }));
        return insertMessage({ photo_id: photoRow.id }, replyId);
      },
    });
  }

  function sendEphemeral(media: CapturedMedia, replyId: string | null) {
    deliver({
      draft: { ephemeral_type: media.kind, ephemeral_mirrored: media.mirrored, reply_to: replyId },
      kind: media.kind === "video" ? "video" : "photo",
      notifyText: media.kind === "video" ? "🎥 a envoyé une vidéo éphémère" : "🔥 a envoyé une photo éphémère",
      run: async () => {
        const ext = media.kind === "video" ? (media.mimeType.includes("mp4") ? "mp4" : "webm") : "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from(EPHEMERAL_BUCKET).upload(path, media.blob, { contentType: media.mimeType });
        if (uploadError) throw uploadError;
        return insertMessage({ ephemeral_path: path, ephemeral_type: media.kind, ephemeral_mirrored: media.mirrored }, replyId);
      },
    });
  }

  function sendCapturedMedia(media: CapturedMedia) {
    const replyId = takeReply();
    if (media.ephemeral) {
      sendEphemeral(media, replyId);
    } else {
      sendPhoto({ blob: media.blob, mimeType: media.mimeType, ext: "jpg" }, replyId);
    }
  }

  async function handlePhoneFiles(files: FileList) {
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, MAX_PHONE_PHOTOS);
    if (!picked.length) return;
    if (files.length > MAX_PHONE_PHOTOS) showNotice(`${MAX_PHONE_PHOTOS} photos au maximum à la fois.`);
    let replyId = takeReply();
    for (const file of picked) {
      const prepared = await prepareImage(file);
      sendPhoto(prepared, replyId);
      replyId = null;
    }
  }

  function sendExistingPhoto(photo: PhotoRow) {
    setPhotoPickerOpen(false);
    const replyId = takeReply();
    setPhotos((prev) => ({ ...prev, [photo.id]: photo }));
    deliver({
      draft: { photo_id: photo.id, reply_to: replyId },
      notifyText: "📷 a envoyé une photo",
      run: () => insertMessage({ photo_id: photo.id }, replyId),
    });
  }

  function sendRef(ref: RefRow) {
    setRefPickerOpen(false);
    const replyId = takeReply();
    setRefs((prev) => ({ ...prev, [ref.id]: ref }));
    deliver({
      draft: { ref_id: ref.id, reply_to: replyId },
      notifyText: `🔖 a partagé une réf : ${ref.title}`,
      run: () => insertMessage({ ref_id: ref.id }, replyId),
    });
  }

  function sendVoice(blob: Blob, mimeType: string) {
    const replyId = takeReply();
    deliver({
      draft: { reply_to: replyId },
      kind: "voice",
      notifyText: "🎤 a envoyé un message vocal",
      run: async () => {
        const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from(VOICES_BUCKET).upload(path, blob, { contentType: mimeType, cacheControl: "604800" });
        if (uploadError) throw uploadError;
        return insertMessage({ audio_path: path }, replyId);
      },
    });
  }

  // ---------------------------------------------------------------- voix

  async function startRecording() {
    if (typeof MediaRecorder === "undefined") {
      showNotice("Les messages vocaux ne sont pas pris en charge par ce navigateur.");
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
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      showNotice("Impossible d'accéder au micro : vérifie les autorisations du navigateur.");
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

  // ---------------------------------------------------------------- actions sur un message

  async function toggleSaved(message: MessageRow) {
    setActiveMessage(null);
    const { data, error } = await supabase.from("messages").update({ saved: !message.saved }).eq("id", message.id).select().single();
    if (error) {
      showNotice("Non enregistré : " + error.message);
      return;
    }
    if (data) setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)));
    showNotice(message.saved ? "Retiré des canards" : "Ajouté aux canards");
  }

  async function sendToTodo(message: MessageRow) {
    setActiveMessage(null);
    if (!message.content) return;
    const { error } = await supabase.from("todos").insert({ content: message.content, created_by: name, category: null });
    if (error) {
      showNotice("Tâche non ajoutée : " + error.message);
      return;
    }
    showNotice("Ajouté à À faire");
    sendNotification({ senderName: name, title: "✅ Nouvelle tâche", body: message.content, url: "/todo" });
  }

  async function copyText(message: MessageRow) {
    setActiveMessage(null);
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      showNotice("Texte copié");
    } catch {
      showNotice("Impossible de copier le texte.");
    }
  }

  function saveToArmoire(message: MessageRow) {
    setActiveMessage(null);
    const url = extractUrls(message.content)[0];
    if (url) {
      setSaveSource({ kind: "link", url, sender: message.sender_name === name ? "vous" : message.sender_name });
      return;
    }
    const photo = message.photo_id ? photos[message.photo_id] : undefined;
    if (photo) {
      getCachedSignedUrl(PHOTOS_BUCKET, photo.storage_path, LONG_TTL_SECONDS).then((signed) => setSaveSource({ kind: "photo", photo, url: signed, sender: message.sender_name === name ? "vous" : message.sender_name }));
    }
  }

  function startReply(message: MessageRow) {
    setActiveMessage(null);
    setReply(message);
    // Une fois la feuille refermée, on place le curseur dans le champ (au mieux : iOS peut demander un nouvel appui).
    requestAnimationFrame(() => requestAnimationFrame(() => inputRef.current?.focus()));
  }

  // ---------------------------------------------------------------- rendu

  const displayed = view === "canards" ? messages.filter((m) => m.saved) : messages;
  const refStateOf = (m: MessageRow): RefState | undefined => (!m.ref_id ? undefined : refs[m.ref_id] ? "ready" : missingRefs.has(m.ref_id) ? "deleted" : "loading");

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 px-5 pb-2 pt-1">
        <div role="tablist" aria-label="Affichage de la conversation" className="flex flex-1 rounded-full bg-tint/70 p-1">
          {(["chat", "canards"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn("flex-1 rounded-full py-2 font-display text-[15px] font-semibold transition", view === v ? "bg-surface text-ink shadow-card" : "text-muted")}
            >
              {v === "chat" ? "Conversation" : "Canards"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={refreshMessages}
          disabled={refreshing}
          aria-label="Actualiser la conversation"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-muted shadow-card ring-1 ring-line transition active:scale-90 disabled:opacity-60"
        >
          <Icon name="refresh" size={19} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-1"
      >
        <div ref={innerRef}>
          {!loaded ? (
            <div className="space-y-3 pt-2" aria-hidden="true">
              <Skeleton className="h-12 w-3/5 rounded-3xl" />
              <Skeleton className="ml-auto h-16 w-2/3 rounded-3xl" />
              <Skeleton className="h-12 w-1/2 rounded-3xl" />
            </div>
          ) : displayed.length === 0 ? (
            view === "chat" ? (
              <EmptyState icon="chat" title="Dites bonjour">
                Le premier message de la conversation, c&apos;est ici.
              </EmptyState>
            ) : (
              <EmptyState icon="bookmark" title="Aucun canard pour l'instant">
                Touche un message, puis « Ajouter aux canards » pour le garder sous la main.
              </EmptyState>
            )
          ) : (
            <div className="flex flex-col gap-0.5">
              {displayed.map((m, i) => {
                const prev = displayed[i - 1];
                const next = displayed[i + 1];
                const newDay = !prev || !isSameDay(new Date(prev.created_at), new Date(m.created_at));
                const grouped = view === "chat";
                const startsGroup = newDay || !grouped || !sameGroup(prev, m);
                const endsGroup = !grouped || !next || !sameGroup(m, next);
                const mine = m.sender_name === name;
                return (
                  <Fragment key={m.id}>
                    {newDay && (
                      <div className="my-3 flex justify-center">
                        <span className="rounded-full bg-tint/70 px-3 py-1 text-xs font-bold text-tint-ink">{dayLabel(new Date(m.created_at))}</span>
                      </div>
                    )}
                    <div className={cn(startsGroup && !newDay && i > 0 && "pt-2.5")}>
                      <MessageBubble
                        message={m}
                        photo={m.photo_id ? photos[m.photo_id] : undefined}
                        refItem={m.ref_id ? refs[m.ref_id] : undefined}
                        refState={refStateOf(m)}
                        isMine={mine}
                        tone={myTone}
                        seen={view === "chat" && otherReadAt !== null && new Date(m.created_at).getTime() <= otherReadAt}
                        status={pendingStatus[m.id]}
                        pendingKind={pendingKinds[m.id]}
                        pendingPreview={pendingPreviews[m.id]}
                        quote={quoteOf(m)}
                        showName={startsGroup}
                        showMeta={endsGroup}
                        highlighted={highlightId === m.id}
                        onOpenActions={() => setActiveMessage(m)}
                        onOpenRef={openRef}
                        onOpenEphemeral={openEphemeral}
                        onOpenPhoto={(photo, url) => setViewingPhoto({ photo, url })}
                        onOpenQuote={openQuote}
                        onRetry={() => retryFns.current[m.id]?.()}
                      />
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {notice && (
        <div role="status" className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center px-6">
          <span className="animate-pop-in rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg shadow-float">{notice}</span>
        </div>
      )}

      {view === "chat" && (
        <div className="shrink-0 px-3 pb-1 pt-1">
          {replyTo && !recording && (
            <div className="mb-2 flex animate-rise items-center gap-3 rounded-2xl bg-surface py-2 pl-3 pr-2 shadow-card ring-1 ring-line">
              <span className="h-9 w-[3px] shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-primary-ink">Répondre à {replyTo.sender_name === name ? "toi" : replyTo.sender_name}</p>
                <p className="truncate text-sm text-muted">{previewOf(replyTo, replyTo.ref_id ? refs[replyTo.ref_id] : undefined)}</p>
              </div>
              <button type="button" onClick={() => setReply(null)} aria-label="Annuler la réponse" className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-tint active:scale-90">
                <Icon name="x" size={18} />
              </button>
            </div>
          )}

          {recording ? (
            <div className="flex items-center gap-2">
              <button type="button" onClick={cancelRecording} aria-label="Annuler l'enregistrement" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-tint text-tint-ink transition active:scale-90">
                <Icon name="x" size={20} />
              </button>
              <div className="flex h-11 flex-1 items-center gap-2.5 rounded-full bg-surface px-4 shadow-card ring-1 ring-line">
                <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-danger" aria-hidden="true" />
                <span className="text-sm font-semibold tabular-nums">
                  {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, "0")}
                </span>
                <span className="text-sm text-muted">Enregistrement…</span>
              </div>
              <button type="button" onClick={stopAndSendRecording} aria-label="Envoyer le message vocal" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-on shadow-press transition active:scale-90">
                <Icon name="sendUp" size={21} />
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendText();
                inputRef.current?.focus();
              }}
              className="flex items-end gap-2"
            >
              <button type="button" onClick={() => setAttachOpen(true)} aria-label="Ajouter une photo ou une réf" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-tint text-tint-ink transition active:scale-90">
                <Icon name="plus" size={22} />
              </button>
              <textarea
                ref={inputRef}
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  // Entrée passe à la ligne. Sur ordinateur, Ctrl ou Cmd + Entrée envoie.
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    sendText();
                  }
                }}
                enterKeyHint="enter"
                placeholder="Écris un message…"
                aria-label="Message"
                className="max-h-[132px] min-h-11 flex-1 resize-none rounded-3xl bg-surface px-4 py-[11px] text-base leading-snug shadow-card outline-none ring-1 ring-line transition placeholder:text-subtle focus:ring-2 focus:ring-primary"
              />
              {text.trim() ? (
                <button type="submit" onMouseDown={(e) => e.preventDefault()} aria-label="Envoyer" className="flex size-11 shrink-0 animate-pop-in items-center justify-center rounded-full bg-primary text-primary-on shadow-press transition active:scale-90">
                  <Icon name="sendUp" size={21} />
                </button>
              ) : (
                <button type="button" onClick={startRecording} aria-label="Enregistrer un message vocal" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-on shadow-press transition active:scale-90">
                  <Icon name="mic" size={21} />
                </button>
              )}
            </form>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length) handlePhoneFiles(files);
          e.target.value = "";
        }}
      />

      <AttachSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        onCamera={() => {
          setAttachOpen(false);
          setCameraOpen(true);
        }}
        onPhone={() => {
          setAttachOpen(false);
          fileInputRef.current?.click();
        }}
        onGallery={() => {
          setAttachOpen(false);
          setPhotoPickerOpen(true);
        }}
        onRef={() => {
          setAttachOpen(false);
          setRefPickerOpen(true);
        }}
      />

      <PhotoPicker open={photoPickerOpen} onClose={() => setPhotoPickerOpen(false)} onSelect={sendExistingPhoto} />
      <RefPicker open={refPickerOpen} onClose={() => setRefPickerOpen(false)} onSelect={sendRef} />

      <MessageActions
        message={activeMessage}
        preview={activeMessage ? previewOf(activeMessage, activeMessage.ref_id ? refs[activeMessage.ref_id] : undefined) : ""}
        onClose={() => setActiveMessage(null)}
        onReply={() => activeMessage && startReply(activeMessage)}
        onCopy={() => activeMessage && copyText(activeMessage)}
        onToggleSaved={() => activeMessage && toggleSaved(activeMessage)}
        onSendToTodo={() => activeMessage && sendToTodo(activeMessage)}
        canSaveToArmoire={!!activeMessage && (extractUrls(activeMessage.content).length > 0 || (!!activeMessage.photo_id && !!photos[activeMessage.photo_id]))}
        onSaveToArmoire={() => activeMessage && saveToArmoire(activeMessage)}
      />

      <SaveToArmoireSheet source={saveSource} createdBy={name} onClose={() => setSaveSource(null)} onSaved={showNotice} />

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

      {viewingPhoto && (
        <Lightbox photo={viewingPhoto.photo} url={viewingPhoto.url} index={0} total={1} hasPrev={false} hasNext={false} onPrev={noop} onNext={noop} onClose={() => setViewingPhoto(null)} />
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

      {viewingEphemeral && <EphemeralViewer url={viewingEphemeral.url} kind={viewingEphemeral.kind} mirrored={viewingEphemeral.mirrored} onClose={closeEphemeral} />}
    </div>
  );
}
