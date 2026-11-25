"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { fetchLinkPreview } from "@/lib/linkPreview";
import { REF_CATEGORIES, normalizeUrl, refCategory, suggestCategory } from "@/lib/refs";
import type { LinkPreview, RefCategory, RefRow } from "@/lib/types";
import type { RefFormValues } from "@/lib/useRefs";

export type { RefFormValues };

export default function RefModal({
  initial,
  defaultCategory,
  existingMediaUrl,
  onClose,
  onSave,
  saving,
  error,
}: {
  initial?: RefRow;
  defaultCategory?: RefCategory;
  existingMediaUrl?: string;
  onClose: () => void;
  onSave: (values: RefFormValues) => void;
  saving: boolean;
  error?: string | null;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [category, setCategory] = useState<RefCategory>(initial ? refCategory(initial) : defaultCategory ?? "references");
  const [categoryTouched, setCategoryTouched] = useState(!!initial || !!defaultCategory);
  const [file, setFile] = useState<File | null>(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(initial?.preview ?? null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const titleRef = useRef(title);
  titleRef.current = title;

  const hasExistingMedia = !!initial?.media_path && !removeMedia && !file;
  const normalized = normalizeUrl(link);

  // Dès qu'un lien valide est saisi, on lit sa page : titre proposé, aperçu, catégorie suggérée.
  useEffect(() => {
    if (!normalized) {
      setPreview(null);
      return;
    }
    if (preview?.url === normalized) return;
    let active = true;
    setLoadingPreview(true);
    const timer = setTimeout(async () => {
      const result = await fetchLinkPreview(normalized);
      if (!active) return;
      setLoadingPreview(false);
      setPreview(result);
      if (!titleRef.current.trim() && result.title) setTitle(result.title);
    }, 700);
    return () => {
      active = false;
      clearTimeout(timer);
      setLoadingPreview(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized]);

  useEffect(() => {
    if (categoryTouched) return;
    setCategory(suggestCategory({ link: normalized, mediaType: file ? (file.type.startsWith("video/") ? "video" : "image") : initial?.media_type ?? null }));
  }, [normalized, file, categoryTouched, initial?.media_type]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalTitle = title.trim() || preview?.title || (normalized ? new URL(normalized).hostname.replace(/^www\./, "") : "");
    if (!finalTitle) return;
    onSave({ title: finalTitle, link: normalized ?? link.trim(), note, category, file, removeMedia, preview: preview?.url === normalized ? preview : null });
  }

  return (
    <Sheet open onClose={onClose} title={initial ? "Modifier la réf" : "Nouvelle réf"} tall>
      <form onSubmit={handleSubmit} className="space-y-4 px-3 pb-1">
        <Field label="Lien (facultatif)">
          <input value={link} onChange={(e) => setLink(e.target.value)} type="url" inputMode="url" className={inputClass} placeholder="https://…" autoFocus={!initial} />
        </Field>

        {(loadingPreview || (preview && normalized && preview.url === normalized)) && (
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-2 ring-1 ring-line" aria-live="polite">
            {loadingPreview ? (
              <span className="px-3 py-3 text-sm text-muted">Lecture du lien…</span>
            ) : (
              <>
                {preview?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.image} alt="" referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-tint text-tint-ink">
                    <Icon name="link" size={22} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{preview?.title ?? preview?.host}</span>
                  <span className="block truncate text-xs text-muted">{preview?.ok ? preview.site ?? preview.host : "Aperçu indisponible pour ce site"}</span>
                </span>
              </>
            )}
          </div>
        )}

        <Field label="Titre">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Nom de la réf" required={!normalized} />
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-muted">Catégorie</legend>
          {!categoryTouched && (normalized || file) && <p className="mb-2 text-[13px] text-muted">Choisie pour vous, changez-la si besoin.</p>}
          <div role="radiogroup" aria-label="Catégorie" className="flex flex-wrap gap-2">
            {REF_CATEGORIES.map((c) => {
              const active = category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setCategory(c.value);
                    setCategoryTouched(true);
                  }}
                  className={cn("inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition active:scale-95", active ? "bg-primary text-primary-on shadow-press" : "bg-tint/70 text-tint-ink")}
                >
                  <Icon name={active ? "check" : c.icon} size={15} strokeWidth={active ? 2.6 : 1.75} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field label="Note (adresse, détail à retenir)">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={cn(inputClass, "h-auto resize-none py-3")} placeholder="Lyon 2e, bouchon lyonnais…" />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-muted">Photo ou vidéo (facultatif)</span>

          {hasExistingMedia && (
            <div className="mb-2 flex items-center gap-3 rounded-2xl bg-surface-2 p-2 ring-1 ring-line">
              {initial?.media_type === "image" && existingMediaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={existingMediaUrl} alt="" className="size-14 rounded-xl object-cover" />
              ) : (
                <span className="flex size-14 items-center justify-center rounded-xl bg-tint text-tint-ink">
                  <Icon name="video" size={24} />
                </span>
              )}
              <span className="flex-1 text-sm text-muted">Média actuel</span>
              <button type="button" onClick={() => setRemoveMedia(true)} className="flex size-11 shrink-0 items-center justify-center rounded-full text-subtle transition hover:text-danger active:scale-90" aria-label="Retirer le média">
                <Icon name="x" size={20} />
              </button>
            </div>
          )}

          <label className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl bg-surface-2 px-4 ring-1 ring-line transition active:scale-[0.99]">
            <Icon name="upload" size={20} className="shrink-0 text-primary-ink" />
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-primary-ink">{file ? file.name : hasExistingMedia ? "Remplacer le média" : "Choisir un fichier"}</span>
            <input
              type="file"
              accept="image/*,video/*"
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setRemoveMedia(false);
              }}
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="soft" size="lg" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" size="lg" disabled={saving || (!title.trim() && !normalized)}>
            {saving ? "Envoi…" : initial ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
