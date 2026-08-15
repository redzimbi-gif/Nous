"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, PHOTOS_BUCKET } from "@/lib/supabase";
import { useIdentity } from "@/lib/identity";
import type { PhotoRow } from "@/lib/types";
import Lightbox from "@/components/Lightbox";

export default function PhotosPage() {
  const { name } = useIdentity();
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) return;
    setPhotos(data);
    const paths = data.map((p) => p.storage_path);
    if (paths.length) {
      const { data: signed } = await supabase.storage
        .from(PHOTOS_BUCKET)
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

  async function handleFiles(files: FileList) {
    setUploading(true);
    for (const file of Array.from(files)) {
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(path, file);
      if (uploadError) {
        alert("Photo non envoyée : " + uploadError.message);
        continue;
      }
      const { error: insertError } = await supabase
        .from("photos")
        .insert({ storage_path: path, sender_name: name });
      if (insertError) {
        alert("Photo non enregistrée : " + insertError.message);
      }
    }
    setUploading(false);
    load();
  }

  async function handleDelete() {
    if (selectedIndex === null) return;
    const photo = photos[selectedIndex];
    if (!photo) return;
    setSelectedIndex(null);
    await supabase.storage.from(PHOTOS_BUCKET).remove([photo.storage_path]);
    await supabase.from("photos").delete().eq("id", photo.id);
    load();
  }

  const selected = selectedIndex !== null ? photos[selectedIndex] ?? null : null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3">
        <h1 className="text-lg font-extrabold text-blush-700">📷 Photos</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-full bg-blush-500 px-4 py-1.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
        >
          {uploading ? "Envoi…" : "+ Ajouter"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </header>

      <div className="flex-1 overflow-y-auto p-2">
        {photos.length === 0 ? (
          <p className="mt-20 text-center text-sm text-blush-300">
            Aucune photo pour l&apos;instant 🤍
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelectedIndex(i)}
                className="aspect-square overflow-hidden rounded-lg bg-blush-100 transition active:scale-95"
              >
                {urls[p.storage_path] && (
                  <img
                    src={urls[p.storage_path]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && selectedIndex !== null && (
        <Lightbox
          photo={selected}
          url={urls[selected.storage_path]}
          index={selectedIndex}
          total={photos.length}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < photos.length - 1}
          onPrev={() => setSelectedIndex((i) => (i !== null ? Math.max(i - 1, 0) : i))}
          onNext={() =>
            setSelectedIndex((i) => (i !== null ? Math.min(i + 1, photos.length - 1) : i))
          }
          onClose={() => setSelectedIndex(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
