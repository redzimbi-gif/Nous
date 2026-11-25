"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { getCachedSignedUrl, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { VOICES_BUCKET } from "@/lib/supabase";

let activeAudio: HTMLAudioElement | null = null;

function formatTime(seconds: number) {
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function VoiceMessage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    getCachedSignedUrl(VOICES_BUCKET, path, LONG_TTL_SECONDS).then((signedUrl) => {
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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex min-w-[210px] items-center gap-3 py-0.5" onClick={(e) => e.stopPropagation()}>
      {url && (
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
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
        type="button"
        onClick={toggle}
        disabled={!url}
        aria-label={playing ? "Mettre en pause" : "Écouter"}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-on shadow-press transition active:scale-90 disabled:opacity-50"
      >
        <Icon name={playing ? "pause" : "play"} size={17} />
      </button>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink/15">
        <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
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
      <span className="w-9 shrink-0 text-right text-[12px] font-semibold tabular-nums opacity-80">{formatTime(currentTime || duration)}</span>
    </div>
  );
}
