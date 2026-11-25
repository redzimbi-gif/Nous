"use client";

import { useEffect, useState, type ReactNode } from "react";
import VoiceMessage from "@/components/VoiceMessage";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { timeLabel } from "@/lib/chat";
import { getCachedSignedUrl, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { PHOTOS_BUCKET, REFS_BUCKET } from "@/lib/supabase";
import type { Tone } from "@/lib/tone";
import type { MessageRow, PhotoRow, RefRow } from "@/lib/types";

export type Quote = { id: string; sender: string; preview: string };
export type RefState = "loading" | "ready" | "deleted";

function Ticks({ seen }: { seen: boolean }) {
  return (
    <span role="img" aria-label={seen ? "Vu" : "Envoyé"} className={cn("inline-flex items-center", seen ? "text-primary" : "text-subtle")}>
      <Icon name="check" size={13} strokeWidth={2.4} />
      {seen && <Icon name="check" size={13} strokeWidth={2.4} className="-ml-2" />}
    </span>
  );
}

/** Ligne de pièce jointe (réf, photo ou vidéo éphémère) : une pastille d'icône, un titre, une précision. */
function AttachmentRow({ icon, title, hint, onClick, muted }: { icon: IconName; title: string; hint: string; onClick?: () => void; muted?: boolean }) {
  const body: ReactNode = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink/[0.07]">
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-bold">{title}</span>
        <span className="block text-xs opacity-70">{hint}</span>
      </span>
    </>
  );
  const cls = cn("flex w-full min-w-[200px] items-center gap-3 rounded-2xl bg-ink/[0.05] p-2", muted && "opacity-70");
  return onClick ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(cls, "transition active:scale-[0.98]")}
    >
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default function MessageBubble({
  message,
  photo,
  refItem,
  refState,
  isMine,
  tone,
  seen,
  status,
  pendingKind,
  pendingPreview,
  quote,
  showName,
  showMeta,
  highlighted,
  onOpenActions,
  onOpenRef,
  onOpenEphemeral,
  onOpenPhoto,
  onOpenQuote,
  onRetry,
}: {
  message: MessageRow;
  photo?: PhotoRow;
  refItem?: RefRow;
  refState?: RefState;
  isMine: boolean;
  tone: Tone;
  seen?: boolean;
  status?: "sending" | "failed";
  pendingKind?: "photo" | "voice" | "video";
  pendingPreview?: string;
  quote?: Quote | null;
  /** Premier message d'une série de l'autre personne : on affiche son prénom. */
  showName?: boolean;
  /** Dernier message d'une série : on affiche l'heure et l'accusé de lecture. */
  showMeta?: boolean;
  highlighted?: boolean;
  onOpenActions: () => void;
  onOpenRef: (ref: RefRow) => void;
  onOpenEphemeral: (message: MessageRow) => void;
  onOpenPhoto: (photo: PhotoRow, url: string) => void;
  onOpenQuote: (id: string) => void;
  onRetry?: () => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [refMediaUrl, setRefMediaUrl] = useState<string | null>(null);
  const ephemeralSeen = message.ephemeral_type ? !!message.ephemeral_viewed_at : seen;

  useEffect(() => {
    if (!photo) return;
    let active = true;
    getCachedSignedUrl(PHOTOS_BUCKET, photo.storage_path, LONG_TTL_SECONDS).then((url) => {
      if (active) setImgUrl(url);
    });
    return () => {
      active = false;
    };
  }, [photo]);

  useEffect(() => {
    if (!refItem?.media_path) return;
    let active = true;
    getCachedSignedUrl(REFS_BUCKET, refItem.media_path, LONG_TTL_SECONDS).then((url) => {
      if (active) setRefMediaUrl(url);
    });
    return () => {
      active = false;
    };
  }, [refItem]);

  const refIsMedia = !!(refItem?.media_path && !refItem.link);
  const wide = !!(photo || message.photo_id || pendingKind === "photo" || refIsMedia);
  const interactive = !status;

  return (
    <div
      data-message-id={message.id}
      className={cn("flex flex-col rounded-2xl", isMine ? "items-end" : "items-start", highlighted && "animate-flash")}
    >
      {showName && !isMine && <span className="mb-1 ml-3 mt-1 text-xs font-bold text-muted">{message.sender_name}</span>}

      <div
        tabIndex={interactive ? 0 : -1}
        onClick={interactive ? onOpenActions : undefined}
        onKeyDown={(e) => {
          if (interactive && e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onOpenActions();
          }
        }}
        className={cn(
          "relative max-w-[84%] rounded-[22px] px-3.5 py-2.5 text-[15.5px] leading-snug transition-[opacity,transform]",
          wide && "w-[min(84%,300px)]",
          interactive && "cursor-pointer active:scale-[0.99]",
          isMine ? `tone-${tone} bg-tone-bg text-tone-ink` : "bg-surface text-ink shadow-card ring-1 ring-line",
          showMeta && (isMine ? "rounded-br-[8px]" : "rounded-bl-[8px]"),
          status === "sending" && "opacity-60",
          status === "failed" && "ring-2 ring-danger",
          message.saved && "mb-2",
        )}
      >
        {quote && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenQuote(quote.id);
            }}
            className="mb-2 block w-full rounded-xl border-l-[3px] border-primary bg-ink/[0.07] px-2.5 py-1.5 text-left transition active:scale-[0.98]"
            aria-label={`Réponse à ${quote.sender} : ${quote.preview}. Aller au message.`}
          >
            <span className="block truncate text-xs font-bold text-primary-ink">{quote.sender}</span>
            <span className="line-clamp-2 block text-[13px] leading-snug opacity-80">{quote.preview}</span>
          </button>
        )}

        {pendingKind === "photo" &&
          (pendingPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pendingPreview} alt="" className="mb-1.5 h-56 w-full rounded-2xl object-cover" />
          ) : (
            <div className="mb-1.5 flex h-56 w-full items-center justify-center rounded-2xl bg-ink/10">
              <Icon name="camera" size={28} />
            </div>
          ))}
        {pendingKind === "voice" && <AttachmentRow icon="mic" title="Message vocal" hint="Envoi en cours" muted />}
        {pendingKind === "video" && <AttachmentRow icon="video" title="Vidéo éphémère" hint="Envoi en cours" muted />}

        {message.ephemeral_type &&
          (message.ephemeral_viewed_at ? (
            <AttachmentRow icon={message.ephemeral_type === "video" ? "video" : "flame"} title={`${message.ephemeral_type === "video" ? "Vidéo" : "Photo"} éphémère`} hint="Vue" muted />
          ) : isMine ? (
            !pendingKind && <AttachmentRow icon={message.ephemeral_type === "video" ? "video" : "flame"} title={`${message.ephemeral_type === "video" ? "Vidéo" : "Photo"} éphémère`} hint="En attente d'ouverture" />
          ) : (
            message.ephemeral_path && (
              <AttachmentRow
                icon={message.ephemeral_type === "video" ? "video" : "flame"}
                title={`${message.ephemeral_type === "video" ? "Vidéo" : "Photo"} éphémère`}
                hint="Appuyer pour voir"
                onClick={() => onOpenEphemeral(message)}
              />
            )
          ))}

        {message.photo_id && !photo && <div className="mb-1.5 h-56 w-full animate-pulse rounded-2xl bg-ink/10" />}
        {photo &&
          (imgUrl ? (
            <button type="button" onClick={(e) => { e.stopPropagation(); onOpenPhoto(photo, imgUrl); }} className="mb-1.5 block w-full overflow-hidden rounded-2xl" aria-label="Agrandir la photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgUrl} alt="" className="h-56 w-full object-cover" />
            </button>
          ) : (
            <div className="mb-1.5 h-56 w-full animate-pulse rounded-2xl bg-ink/10" />
          ))}

        {message.ref_id &&
          (refItem ? (
            refIsMedia ? (
              refMediaUrl ? (
                refItem.media_type === "video" ? (
                  <video src={refMediaUrl} controls playsInline onClick={(e) => e.stopPropagation()} className="mb-1.5 h-56 w-full rounded-2xl object-cover" />
                ) : (
                  <button type="button" onClick={(e) => { e.stopPropagation(); onOpenRef(refItem); }} className="mb-1.5 block w-full overflow-hidden rounded-2xl" aria-label={`Ouvrir la réf ${refItem.title}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={refMediaUrl} alt="" className="h-56 w-full object-cover" />
                  </button>
                )
              ) : (
                <div className="mb-1.5 h-56 w-full animate-pulse rounded-2xl bg-ink/10" />
              )
            ) : (
              <AttachmentRow icon="link" title={refItem.title} hint="Ouvrir la réf" onClick={() => onOpenRef(refItem)} />
            )
          ) : refState === "deleted" ? (
            <AttachmentRow icon="bookmark" title="Réf supprimée" hint="Elle n'est plus dans l'armoire" muted />
          ) : (
            <div className="h-14 w-full min-w-[200px] animate-pulse rounded-2xl bg-ink/10" />
          ))}

        {message.audio_path && <VoiceMessage path={message.audio_path} />}

        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}

        {message.saved && (
          <span aria-label="Dans les canards" role="img" className={cn("absolute -bottom-2.5 rounded-full bg-surface px-1.5 py-0.5 text-xs leading-none shadow-card ring-1 ring-line", isMine ? "right-3" : "left-3")}>
            🦆
          </span>
        )}
      </div>

      {(status || showMeta) && (
        <div className={cn("mt-1 flex items-center gap-1.5 px-2 text-[11px] text-subtle", message.saved && "mt-1.5")}>
          {status === "sending" && <span>Envoi…</span>}
          {status === "failed" && (
            <button type="button" onClick={onRetry} className="font-semibold text-danger transition active:scale-95">
              Non envoyé · Réessayer
            </button>
          )}
          {!status && (
            <>
              <time dateTime={message.created_at}>{timeLabel(message.created_at)}</time>
              {isMine && <Ticks seen={!!ephemeralSeen} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}
