"use client";

import { useEffect, useState } from "react";
import { supabase, REFS_BUCKET } from "@/lib/supabase";
import { getCachedSignedUrls, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { useIdentity } from "@/lib/identity";
import type { RefRow } from "@/lib/types";
import RefModal, { type RefFormValues } from "@/components/RefModal";
import RefDetail from "@/components/RefDetail";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PageHeading } from "@/components/ui/PageHeading";
import { Skeleton } from "@/components/ui/Skeleton";

export default function RefPage() {
  const { name } = useIdentity();
  const [items, setItems] = useState<RefRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RefRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<RefRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("refs")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) return;
    setItems(data);
    setLoaded(true);
    const paths = data.map((r) => r.media_path).filter(Boolean) as string[];
    if (paths.length) {
      const map = await getCachedSignedUrls(REFS_BUCKET, paths, LONG_TTL_SECONDS);
      setUrls((prev) => ({ ...prev, ...map }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(values: RefFormValues) {
    setSaving(true);
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
      const { error: uploadError } = await supabase.storage
        .from(REFS_BUCKET)
        .upload(path, values.file, { cacheControl: "604800" });
      if (uploadError) {
        alert("Fichier non envoyé : " + uploadError.message);
        setSaving(false);
        return;
      }
      media_path = path;
    }

    if (editing) {
      const { error } = await supabase
        .from("refs")
        .update({
          title: values.title,
          link: values.link || null,
          media_path,
          media_type,
        })
        .eq("id", editing.id);
      setSaving(false);
      if (error) {
        alert("Ref non modifiée : " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("refs").insert({
        title: values.title,
        link: values.link || null,
        media_path,
        media_type,
        created_by: name,
      });
      setSaving(false);
      if (error) {
        alert("Ref non ajoutée : " + error.message);
        return;
      }
    }

    setModalOpen(false);
    setEditing(null);
    setSelected(null);
    load();
  }

  async function handleDelete() {
    if (!selected) return;
    if (selected.media_path) {
      await supabase.storage.from(REFS_BUCKET).remove([selected.media_path]);
    }
    await supabase.from("refs").delete().eq("id", selected.id);
    setSelected(null);
    load();
  }

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  return (
    <div className="h-full overflow-y-auto px-5 pb-6">
      <PageHeading
        title="Armoire à réfs"
        subtitle={loaded && items.length > 0 ? `${items.length} réf${items.length > 1 ? "s" : ""} à garder sous la main` : "Vos idées, liens et inspirations"}
        action={
          <Button onClick={openNew} className="shrink-0">
            <Icon name="plus" size={18} strokeWidth={2.2} />
            Ajouter
          </Button>
        }
      />

      {!loaded ? (
        <div className="grid grid-cols-2 gap-3" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="bookmark" title="L'armoire est vide" action={<Button onClick={openNew}>Ajouter la première réf</Button>}>
          Un resto, une idée de week-end, un lien à ne pas perdre : rangez-le ici, puis envoyez-le dans le chat quand vous voulez.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => setSelected(item)} className="block w-full overflow-hidden rounded-3xl bg-surface text-left shadow-card ring-1 ring-line transition active:scale-[0.97]">
                <div className="flex aspect-square items-center justify-center bg-tint text-tint-ink">
                  {item.media_path && item.media_type === "image" && urls[item.media_path] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urls[item.media_path]} alt="" className="h-full w-full object-cover" />
                  ) : item.media_path && item.media_type === "video" ? (
                    <Icon name="video" size={34} />
                  ) : (
                    <Icon name={item.media_path ? "photo" : "link"} size={34} />
                  )}
                </div>
                <p className="truncate px-3.5 py-3 font-display text-[15px] font-semibold">{item.title}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <RefModal
          initial={editing ?? undefined}
          existingMediaUrl={editing?.media_path ? urls[editing.media_path] : undefined}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {selected && !modalOpen && (
        <RefDetail
          item={selected}
          url={selected.media_path ? urls[selected.media_path] : undefined}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setEditing(selected);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
