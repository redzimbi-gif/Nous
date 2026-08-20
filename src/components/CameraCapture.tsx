"use client";

import { useEffect, useRef, useState } from "react";

export type CapturedMedia = {
  blob: Blob;
  kind: "image" | "video";
  mimeType: string;
  ephemeral: boolean;
  mirrored: boolean;
};

const MAX_VIDEO_SECONDS = 15;

export default function CameraCapture({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (media: CapturedMedia) => void;
}) {
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [captured, setCaptured] = useState<{
    url: string;
    blob: Blob;
    kind: "image" | "video";
    mimeType: string;
  } | null>(null);
  const [ephemeral, setEphemeral] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startStream(mode: "user" | "environment") {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setError(null);
    } catch {
      setError("Impossible d'accéder à la caméra — vérifie les autorisations.");
    }
  }

  useEffect(() => {
    startStream(facingMode);
    return () => {
      stopStream();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flipCamera() {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startStream(next);
  }

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCaptured({ url: URL.createObjectURL(blob), blob, kind: "image", mimeType: "image/jpeg" });
        setEphemeral(false);
      },
      "image/jpeg",
      0.9
    );
  }

  function pickVideoMimeType() {
    if (typeof MediaRecorder === "undefined") return "";
    const candidates = [
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === "undefined") {
      setError("L'enregistrement vidéo n'est pas pris en charge par ce navigateur.");
      return;
    }
    const preferredType = pickVideoMimeType();
    try {
      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const mimeType = (recorder.mimeType || preferredType || "video/webm").split(";")[0];
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        setCaptured({ url: URL.createObjectURL(blob), blob, kind: "video", mimeType });
        setEphemeral(true);
      };
      recorderRef.current = recorder;
      recorder.start(1000);
      isRecordingRef.current = true;
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
      autoStopRef.current = setTimeout(() => stopRecording(), MAX_VIDEO_SECONDS * 1000);
    } catch {
      setError("Impossible de démarrer l'enregistrement vidéo sur cet appareil.");
    }
  }

  function stopRecording() {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    isRecordingRef.current = false;
    setRecording(false);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function handlePressStart() {
    if (captured || error) return;
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      startRecording();
    }, 250);
  }

  function handlePressEnd() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      takePhoto();
      return;
    }
    if (isRecordingRef.current) stopRecording();
  }

  function retake() {
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    setEphemeral(false);
  }

  function handleClose() {
    if (captured) URL.revokeObjectURL(captured.url);
    stopStream();
    onClose();
  }

  function handleSend() {
    if (!captured) return;
    onSend({
      blob: captured.blob,
      kind: captured.kind,
      mimeType: captured.mimeType,
      ephemeral: captured.kind === "video" ? true : ephemeral,
      mirrored: captured.kind === "video" && facingMode === "user",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <canvas ref={canvasRef} className="hidden" />
      {!captured ? (
        <>
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${
                facingMode === "user" ? "-scale-x-100" : ""
              }`}
            />
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-8 text-center text-sm text-white">
                {error}
              </div>
            )}
            <button
              onClick={handleClose}
              aria-label="Fermer"
              className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-xl text-white transition active:scale-90"
            >
              ✕
            </button>
            <button
              onClick={flipCamera}
              aria-label="Changer de caméra"
              className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-xl text-white transition active:scale-90"
            >
              🔄
            </button>
            {recording && (
              <div className="absolute left-1/2 top-[calc(1rem+env(safe-area-inset-top))] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-sm font-semibold text-white">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")}
              </div>
            )}
            {!recording && (
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70">
                Appuyer : photo · Maintenir : vidéo
              </p>
            )}
          </div>
          <div className="flex items-center justify-center py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <button
              onPointerDown={handlePressStart}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              aria-label="Prendre une photo, maintenir pour filmer"
              className={`flex h-20 w-20 items-center justify-center rounded-full border-4 border-white transition active:scale-95 ${
                recording ? "bg-red-500" : "bg-white/30"
              }`}
            >
              <span
                className={`bg-white transition-all ${
                  recording ? "h-8 w-8 rounded-lg" : "h-16 w-16 rounded-full"
                }`}
              />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="relative flex-1 overflow-hidden bg-black">
            {captured.kind === "image" ? (
              <img src={captured.url} alt="" className="h-full w-full object-contain" />
            ) : (
              <video
                src={captured.url}
                autoPlay
                loop
                controls
                playsInline
                preload="auto"
                className={`h-full w-full object-contain ${
                  facingMode === "user" ? "-scale-x-100" : ""
                }`}
              />
            )}
            <button
              onClick={retake}
              aria-label="Reprendre"
              className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-xl text-white transition active:scale-90"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-3 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {captured.kind === "image" ? (
              <div className="flex items-center justify-center gap-1 rounded-full bg-white/10 p-1">
                <button
                  onClick={() => setEphemeral(false)}
                  className={`flex-1 rounded-full py-2.5 text-sm font-bold transition active:scale-95 ${
                    !ephemeral ? "bg-white text-blush-700" : "text-white"
                  }`}
                >
                  🖼️ Permanente
                </button>
                <button
                  onClick={() => setEphemeral(true)}
                  className={`flex-1 rounded-full py-2.5 text-sm font-bold transition active:scale-95 ${
                    ephemeral ? "bg-white text-blush-700" : "text-white"
                  }`}
                >
                  🔥 Éphémère
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-white/70">
                🔥 Les vidéos sont toujours éphémères — elles disparaissent après visionnage
              </p>
            )}
            <button
              onClick={handleSend}
              className="rounded-full bg-blush-500 py-3.5 text-center font-bold text-white transition active:scale-[0.98]"
            >
              Envoyer{ephemeral || captured.kind === "video" ? " 🔥" : ""}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
