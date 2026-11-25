"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Lightbox from "@/components/Lightbox";
import AddToAlbumSheet from "@/components/photos/AddToAlbumSheet";
import PhotosTabs from "@/components/photos/PhotosTabs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { NoticeToast, useNotice } from "@/components/ui/Notice";
import { PageHeading } from "@/components/ui/PageHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { dayLabel } from "@/lib/chat";
import { useIdentity } from "@/lib/identity";
import { uploadPhotos } from "@/lib/photoUpload";
import { getCachedSignedUrls, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { PHOTOS_BUCKET, supabase } from "@/lib/supabase";
import type { PhotoRow } from "@/lib/types";

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
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [albumTarget, setAlbumTarget] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notice, show } = useNotice();

  async function load() {
    const { data } = await supabase.from("photos").select("*").order("created_at", { ascending: false });
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
        result.push({ key, label: dayLabel(d), items: [{ photo, index }] });
      }
    });
    return result;
  }, [photos]);

  async function handleFiles(files: FileList) {
    setUploading(true);
    const { errors } = await uploadPhotos(Array.from(files), name);
    setUploading(false);
    if (errors.length) show(errors[0]);
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

  function toggle(photo: PhotoRow) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(photo.id)) next.add(photo.id);
      return next;
    });
  }

  function stopSelecting() {
    setSelecting(false);
    setPicked(new Set());
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

      <div className="mb-4 flex items-center gap-3">
        <PhotosTabs active="photos" />
        {photos.length > 0 && (
          <button
            type="button"
            onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
            aria-pressed={selecting}
            className={cn("h-10 shrink-0 rounded-full px-4 text-sm font-bold transition active:scale-95", selecting ? "bg-primary text-primary-on shadow-press" : "bg-surface text-primary-ink shadow-card ring-1 ring-line")}
          >
            {selecting ? "Terminer" : "Sélectionner"}
          </button>
        )}
      </div>

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
              {group.items.map(({ photo: p, index: i }) => {
                const isPicked = picked.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => (selecting ? toggle(p) : setSelectedIndex(i))}
                    aria-pressed={selecting ? isPicked : undefined}
                    className="relative aspect-square overflow-hidden rounded-2xl bg-tint transition active:scale-95"
                    aria-label={`Photo de ${p.sender_name}`}
                  >
                    {urls[p.storage_path] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urls[p.storage_path]} alt="" className={cn("h-full w-full object-cover transition", selecting && isPicked && "scale-95 rounded-xl")} />
                    )}
                    {selecting && (
                      <span className={cn("absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full ring-2 ring-white transition", isPicked ? "bg-primary text-primary-on" : "bg-black/25 text-transparent")}>
                        <Icon name="check" size={14} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}

      {selecting && (
        <div className="sticky bottom-3 z-10 mt-2 flex items-center gap-2 rounded-full bg-surface p-2 pl-5 shadow-float ring-1 ring-line">
          <span className="flex-1 text-sm font-semibold">{picked.size === 0 ? "Touchez des photos" : `${picked.size} sélectionnée${picked.size > 1 ? "s" : ""}`}</span>
          <Button size="sm" disabled={picked.size === 0} onClick={() => setAlbumTarget([...picked])}>
            <Icon name="album" size={17} />
            Album
          </Button>
        </div>
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
          onAddToAlbum={() => setAlbumTarget([selected.id])}
          onDelete={handleDelete}
        />
      )}

      <AddToAlbumSheet
        open={!!albumTarget}
        photoIds={albumTarget ?? []}
        onClose={() => setAlbumTarget(null)}
        onDone={(message) => {
          stopSelecting();
          show(message);
        }}
      />
      <NoticeToast text={notice} />
    </div>
  );
}
