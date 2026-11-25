"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { inputClass, Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { fetchLinkPreview } from "@/lib/linkPreview";
import { REF_CATEGORIES, categoryInfo, hostOf, suggestCategory } from "@/lib/refs";
import { REFS_BUCKET, supabase } from "@/lib/supabase";
import type { LinkPreview, PhotoRow, RefCategory } from "@/lib/types";

export type SaveSource = { kind: "link"; url: string; sender: string } | { kind: "photo"; photo: PhotoRow; url: string | null; sender: string };

function Body({ source, createdBy, onClose, onSaved }: { source: SaveSource; createdBy: string; onClose: () => void; onSaved: (message: string) => void }) {
  const link = source.kind === "link" ? source.url : null;
  const [title, setTitle] = useState(source.kind === "link" ? hostOf(source.url) : `Photo de ${source.sender}`);
  const [titleEdited, setTitleEdited] = useState(false);
  const [category, setCategory] = useState<RefCategory>(source.kind === "link" ? suggestCategory({ link }) : "references");
  const [touched, setTouched] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!link) return;
    let active = true;
    fetchLinkPreview(link).then((result) => {
      if (!active) return;
      setPreview(result);
      if (result.title) setTitle((current) => (titleEdited ? current : result.title ?? current));
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      let media_path: string | null = null;
      let media_type: "image" | null = null;
      if (source.kind === "photo") {
        if (!source.url) throw new Error("La photo n'est pas encore chargée.");
        const blob = await (await fetch(source.url)).blob();
        const path = `${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage.from(REFS_BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "604800" });
        if (uploadError) throw uploadError;
        media_path = path;
        media_type = "image";
      }
      const { error: insertError } = await supabase.from("refs").insert({
        title: title.trim(),
        link,
        category,
        media_path,
        media_type,
        preview: link && preview ? preview : null,
        created_by: createdBy,
      });
      if (insertError) throw insertError;
      onClose();
      onSaved(`Ajouté à l'armoire · ${categoryInfo(category).label}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réf non enregistrée.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 px-3 pb-1">
      <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-2 ring-1 ring-line">
        {source.kind === "photo" && source.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={source.url} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
        ) : preview?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.image} alt="" referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-tint text-tint-ink">
            <Icon name={source.kind === "photo" ? "photo" : "link"} size={22} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs text-muted">
            {source.kind === "link" ? hostOf(source.url) : "Photo"} · envoyé par {source.sender}
          </span>
          <span className="block truncate text-sm font-bold">{preview?.title ?? (source.kind === "link" ? source.url : `Photo de ${source.sender}`)}</span>
        </span>
      </div>

      <Field label="Titre">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleEdited(true);
          }}
          className={inputClass}
          required
        />
      </Field>

      <fieldset>
        <legend className="text-sm font-semibold text-muted">Catégorie</legend>
        {!touched && <p className="mb-2 text-[13px] text-muted">Choisie pour vous, changez-la si besoin.</p>}
        <div role="radiogroup" aria-label="Catégorie" className={cn("flex flex-wrap gap-2", touched && "mt-1.5")}>
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
                  setTouched(true);
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

      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" block disabled={busy || !title.trim()}>
        {busy ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}

/** « Enregistrer dans l'armoire » : depuis un lien ou une photo reçus dans le chat. */
export default function SaveToArmoireSheet({ source, createdBy, onClose, onSaved }: { source: SaveSource | null; createdBy: string; onClose: () => void; onSaved: (message: string) => void }) {
  return (
    <Sheet open={!!source} onClose={onClose} title="Enregistrer dans l'armoire" tall>
      {source && <Body key={source.kind === "link" ? source.url : source.photo.id} source={source} createdBy={createdBy} onClose={onClose} onSaved={onSaved} />}
    </Sheet>
  );
}
