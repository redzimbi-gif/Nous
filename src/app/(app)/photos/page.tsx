"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, PHOTOS_BUCKET } from "@/lib/supabase";
import { getCachedSignedUrls, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { useIdentity } from "@/lib/identity";
import type { PhotoRow } from "@/lib/types";
import Lightbox from "@/components/Lightbox";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PageHeading } from "@/components/ui/PageHeading";
import { Skeleton } from "@/components/ui/Skeleton";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateGroupLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return "Aujourd'hui";
  if (isSameDay(date, yesterday)) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type PhotoGroup = {
  key: string;
  label: string;
  items: { photo: PhotoRow; index: number }[];
};

export default function PhotosPage() {
  const { name } = useIdentity();
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) return;
    setPhotos(data);
    setLoaded(true);
    const paths = data.map((p) => p.storage_path);
    if (paths.length) {
      const map = await getCachedSignedUrls(PHOTOS_BUCKET, paths, LONG_TTL_SECONDS);
      setUrls((prev) => ({ ...prev, ...map }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo<PhotoGroup[]>(() => {
    const result: PhotoGroup[] = [];
    photos.forEach((photo, index) => {
      const d = new Date(photo.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const last = result[result.length - 1];
      if (last && last.key === key) {
        last.items.push({ photo, index });
      } else {
        result.push({ key, label: dateGroupLabel(d), items: [{ photo, index }] });
      }
    });
    return result;
  }, [photos]);

  async function handleFiles(files: FileList) {
    setUploading(true);
    for (const file of Array.from(files)) {
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(path, file, { cacheControl: "604800" });
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
    <div className="h-full overflow-y-auto px-5 pb-6">
      <PageHeading
        title="Photos"
        subtitle={loaded ? (photos.length === 0 ? "Votre album commun" : `${photos.length} souvenir${photos.length > 1 ? "s" : ""}`) : undefined}
        action={
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="shrink-0">
            <Icon name="plus" size={18} strokeWidth={2.2} />
            {uploading ? "Envoi…" : "Ajouter"}
          </Button>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {!loaded ? (
        <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState icon="photo" title="Pas encore de photo" action={<Button onClick={() => fileInputRef.current?.click()}>Ajouter une photo</Button>}>
          Les photos que vous envoyez dans le chat atterrissent aussi ici.
        </EmptyState>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="mb-5" aria-label={group.label}>
            <h2 className="mb-2 font-display text-[15px] font-semibold text-muted">{group.label}</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {group.items.map(({ photo: p, index: i }) => (
                <button key={p.id} type="button" onClick={() => setSelectedIndex(i)} className="aspect-square overflow-hidden rounded-2xl bg-tint transition active:scale-95" aria-label={`Photo de ${p.sender_name}`}>
                  {urls[p.storage_path] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urls[p.storage_path]} alt="" className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          </section>
        ))
      )}

      {selected && selectedIndex !== null && (
        <Lightbox
          photo={selected}
          url={urls[selected.storage_path]}
          index={selectedIndex}
          total={photos.length}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < photos.length - 1}
          onPrev={() => setSelectedIndex((i) => (i !== null ? Math.max(i - 1, 0) : i))}
          onNext={() => setSelectedIndex((i) => (i !== null ? Math.min(i + 1, photos.length - 1) : i))}
          onClose={() => setSelectedIndex(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
