"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { getCachedSignedUrls, LONG_TTL_SECONDS } from "@/lib/signedUrlCache";
import { PHOTOS_BUCKET, supabase } from "@/lib/supabase";
import type { PhotoRow } from "@/lib/types";

const LIMIT = 90;

function PhotoGrid({ onSelect }: { onSelect: (photo: PhotoRow) => void }) {
  const [items, setItems] = useState<PhotoRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(LIMIT)
      .then(async ({ data }) => {
        if (!active) return;
        setItems(data ?? []);
        setLoading(false);
        if (data?.length) {
          const map = await getCachedSignedUrls(
            PHOTOS_BUCKET,
            data.map((p) => p.storage_path),
            LONG_TTL_SECONDS,
          );
          if (active) setUrls(map);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="py-10 text-center text-sm text-muted">Chargement…</p>;
  if (items.length === 0) return <p className="py-10 text-center text-sm text-muted">Aucune photo dans l&apos;album pour l&apos;instant.</p>;

  return (
    <div className="grid grid-cols-3 gap-1.5 px-2 pb-2">
      {items.map((photo) => (
        <button key={photo.id} type="button" onClick={() => onSelect(photo)} className="aspect-square overflow-hidden rounded-2xl bg-tint transition active:scale-95" aria-label={`Photo de ${photo.sender_name}`}>
          {urls[photo.storage_path] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urls[photo.storage_path]} alt="" className="h-full w-full object-cover" />
          )}
        </button>
      ))}
    </div>
  );
}

export default function PhotoPicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (photo: PhotoRow) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Photos de Nous">
      {open && <PhotoGrid onSelect={onSelect} />}
    </Sheet>
  );
}
