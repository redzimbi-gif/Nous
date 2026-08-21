"use client";

import { useEffect, useRef, useState } from "react";
import { VOICES_BUCKET } from "@/lib/supabase";
import { getCachedSignedUrl } from "@/lib/signedUrlCache";

let activeAudio: HTMLAudioElement | null = null;

export default function VoiceMessage({
  path,
  tone,
}: {
  path: string;
  tone: "mine" | "theirs";
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    getCachedSignedUrl(VOICES_BUCKET, path, 3600).then((signedUrl) => {
      if (active) setUrl(signedUrl);
    });
    return () => {
      active = false;
    };
  }, [path]);

  useEffect(() => {
    return () => {
      if (activeAudio === audioRef.current) activeAudio = null;
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      if (activeAudio && activeAudio !== audio) activeAudio.pause();
      activeAudio = audio;
      audio.play();
    }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  }

  function formatTime(seconds: number) {
    const total = Math.floor(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isMine = tone === "mine";

  return (
    <div className="flex min-w-[190px] items-center gap-2 py-0.5">
      {url && (
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}
      <button
        onClick={toggle}
        disabled={!url}
        aria-label={playing ? "Mettre en pause" : "Écouter"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition active:scale-90 disabled:opacity-50 ${
          isMine ? "bg-white/20" : "bg-blush-50"
        }`}
      >
        {playing ? "⏸" : "▶️"}
      </button>
      <div
        className={`relative h-1.5 flex-1 overflow-hidden rounded-full ${
          isMine ? "bg-white/30" : "bg-blush-100"
        }`}
      >
        <div
          className={`h-full rounded-full ${isMine ? "bg-white" : "bg-blush-500"}`}
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={seek}
          disabled={!url || !duration}
          aria-label="Position de lecture"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
        />
      </div>
      <span className="shrink-0 text-[11px] tabular-nums opacity-80">
        {formatTime(currentTime || duration)}
      </span>
    </div>
  );
}
