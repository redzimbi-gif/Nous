"use client";

import { useEffect, useState } from "react";
import { supabase, REFS_BUCKET } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { RefRow } from "@/lib/types";
import RefModal, { type RefFormValues } from "@/components/RefModal";
import RefDetail from "@/components/RefDetail";

export default function RefPage() {
  const { name } = useIdentity();
  const [items, setItems] = useState<RefRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RefRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<RefRow | null>(null);

  async function load() {
    const { data } = await supabase
      .from("refs")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) return;
    setItems(data);
    const paths = data.map((r) => r.media_path).filter(Boolean) as string[];
    if (paths.length) {
      const { data: signed } = await supabase.storage
        .from(REFS_BUCKET)
        .createSignedUrls(paths, 3600);
      if (signed) {
        const map: Record<string, string> = {};
        signed.forEach((s, i) => {
          if (s.signedUrl) map[paths[i]] = s.signedUrl;
        });
        setUrls(map);
      }
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
        .upload(path, values.file);
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

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3">
        <h1 className="text-lg font-extrabold text-blush-700">🖼️ Armoire à ref</h1>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="rounded-full bg-blush-500 px-4 py-1.5 text-sm font-bold text-white transition active:scale-95"
        >
          + Ajouter
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <p className="mt-20 text-center text-sm text-blush-300">
            Aucune ref pour l&apos;instant — ajoute la première 👆
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="overflow-hidden rounded-2xl bg-white text-left shadow-sm transition active:scale-[0.97]"
              >
                <div className="flex aspect-square items-center justify-center bg-blush-50">
                  {item.media_path && item.media_type === "image" && urls[item.media_path] && (
                    <img
                      src={urls[item.media_path]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                  {item.media_path && item.media_type === "video" && (
                    <span className="text-4xl">🎬</span>
                  )}
                  {!item.media_path && <span className="text-4xl">🔗</span>}
                </div>
                <div className="p-2">
                  <p className="truncate text-sm font-semibold text-blush-800">{item.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

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
