"use client";

import { useEffect, useState } from "react";
import { supabase, REFS_BUCKET } from "@/lib/supabase";
import type { RefRow } from "@/lib/types";

export default function RefPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (ref: RefRow) => void;
}) {
  const [items, setItems] = useState<RefRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("refs")
      .select("*")
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        if (!data) {
          setLoading(false);
          return;
        }
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
        setLoading(false);
      });
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-blush-900/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-4 sm:rounded-3xl"
      >
        <h2 className="mb-3 text-lg font-extrabold text-blush-700">
          🔖 Choisis une ref à envoyer
        </h2>

        {loading && <p className="py-6 text-center text-sm text-blush-300">Chargement…</p>}

        {!loading && items.length === 0 && (
          <p className="py-6 text-center text-sm text-blush-300">
            Aucune ref pour l&apos;instant.
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="overflow-hidden rounded-2xl bg-blush-50 text-left transition active:scale-95"
            >
              <div className="flex aspect-square items-center justify-center bg-blush-100">
                {item.media_path && item.media_type === "image" && urls[item.media_path] && (
                  <img
                    src={urls[item.media_path]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                {item.media_path && item.media_type === "video" && (
                  <span className="text-2xl">🎬</span>
                )}
                {!item.media_path && <span className="text-2xl">🔗</span>}
              </div>
              <p className="truncate p-1.5 text-xs font-semibold text-blush-800">
                {item.title}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-blush-50 py-3 font-bold text-blush-500 transition active:scale-[0.98]"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
