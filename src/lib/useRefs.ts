"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureRefPreview, needsPreview } from "@/lib/linkPreview";
import { getCachedSignedUrls, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { REFS_BUCKET, supabase } from "@/lib/supabase";
import type { LinkPreview, RefCategory, RefRow } from "@/lib/types";

export type RefFormValues = {
  title: string;
  link: string;
  note: string;
  category: RefCategory;
  file: File | null;
  removeMedia: boolean;
  preview: LinkPreview | null;
};

/** Les réfs de l'armoire, leurs médias, et les opérations pour les créer, modifier, supprimer. */
export function useRefs(createdBy: string) {
  const [items, setItems] = useState<RefRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const previewing = useRef(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("refs").select("*").order("created_at", { ascending: false });
    if (!data) return;
    setItems(data as RefRow[]);
    setLoaded(true);
    const paths = data.map((r) => r.media_path).filter(Boolean) as string[];
    if (paths.length) {
      const map = await getCachedSignedUrls(REFS_BUCKET, paths, LONG_TTL_SECONDS);
      setUrls((prev) => ({ ...prev, ...map }));
    }
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  // Les anciennes réfs avec un lien n'ont pas encore d'aperçu : on les lit en arrière-plan, une à une.
  useEffect(() => {
    if (!loaded || previewing.current) return;
    const todo = items.filter(needsPreview);
    if (todo.length === 0) return;
    previewing.current = true;
    (async () => {
      for (const ref of todo.slice(0, 12)) {
        const updated = await ensureRefPreview(ref);
        if (updated) setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      }
      previewing.current = false;
    })();
  }, [loaded, items]);

  /** Renvoie un message d'erreur, ou null si tout s'est bien passé. */
  const save = useCallback(
    async (editing: RefRow | null, values: RefFormValues): Promise<string | null> => {
      setSaving(true);
      try {
        let media_path: string | null = editing?.media_path ?? null;
        let media_type: "image" | "video" | null = editing?.media_type ?? null;

        if ((values.removeMedia || values.file) && editing?.media_path) {
          await supabase.storage.from(REFS_BUCKET).remove([editing.media_path]);
          media_path = null;
          media_type = null;
        }

        if (values.file) {
          media_type = values.file.type.startsWith("video/") ? "video" : "image";
          const path = `${crypto.randomUUID()}-${values.file.name}`;
          const { error: uploadError } = await supabase.storage.from(REFS_BUCKET).upload(path, values.file, { cacheControl: "604800" });
          if (uploadError) return "Fichier non envoyé : " + uploadError.message;
          media_path = path;
        }

        const link = values.link.trim() || null;
        const fields = {
          title: values.title,
          link,
          note: values.note.trim() || null,
          category: values.category,
          media_path,
          media_type,
          // L'aperçu n'a de sens que pour le lien qu'il décrit.
          preview: link && values.preview && values.preview.url === link ? values.preview : null,
        };

        const { error } = editing ? await supabase.from("refs").update(fields).eq("id", editing.id) : await supabase.from("refs").insert({ ...fields, created_by: createdBy });
        if (error) return (editing ? "Réf non modifiée : " : "Réf non ajoutée : ") + error.message;
        await load();
        return null;
      } finally {
        setSaving(false);
      }
    },
    [createdBy, load],
  );

  const remove = useCallback(
    async (ref: RefRow) => {
      if (ref.media_path) await supabase.storage.from(REFS_BUCKET).remove([ref.media_path]);
      await supabase.from("refs").delete().eq("id", ref.id);
      await load();
    },
    [load],
  );

  return { items, urls, loaded, saving, reload: load, save, remove };
}
