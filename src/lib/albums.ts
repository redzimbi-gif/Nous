"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AlbumPhotoRow, AlbumRow } from "@/lib/types";

/** Albums et photos qu'ils contiennent ; se met à jour quand l'autre personne les modifie. */
export function useAlbums() {
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [links, setLinks] = useState<AlbumPhotoRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [a, l] = await Promise.all([
      supabase.from("albums").select("*").order("created_at", { ascending: false }),
      supabase.from("album_photos").select("*").order("added_at", { ascending: false }),
    ]);
    if (a.data) setAlbums(a.data as AlbumRow[]);
    if (l.data) setLinks(l.data as AlbumPhotoRow[]);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`albums-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "albums" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "album_photos" }, () => load())
      .subscribe();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  /** Identifiants des photos de chaque album, la plus récemment ajoutée en premier. */
  const photoIdsByAlbum = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const link of links) (map[link.album_id] ??= []).push(link.photo_id);
    return map;
  }, [links]);

  return { albums, links, photoIdsByAlbum, loaded, reload: load };
}

export type Outcome = { ok: true } | { ok: false; message: string };

const fail = (message: string): Outcome => ({ ok: false, message });

export async function createAlbum(name: string, createdBy: string, photoIds: string[]): Promise<{ album: AlbumRow | null; message?: string }> {
  const { data, error } = await supabase.from("albums").insert({ name: name.trim(), created_by: createdBy }).select().single();
  if (error || !data) return { album: null, message: error?.message ?? "Album non créé" };
  const album = data as AlbumRow;
  if (photoIds.length) {
    const result = await addPhotosToAlbum(album.id, photoIds, createdBy);
    if (!result.ok) return { album, message: result.message };
  }
  return { album };
}

export async function addPhotosToAlbum(albumId: string, photoIds: string[], addedBy: string): Promise<Outcome> {
  if (photoIds.length === 0) return { ok: true };
  const rows = photoIds.map((photo_id) => ({ album_id: albumId, photo_id, added_by: addedBy }));
  const { error } = await supabase.from("album_photos").upsert(rows, { onConflict: "album_id,photo_id", ignoreDuplicates: true });
  return error ? fail(error.message) : { ok: true };
}

export async function removePhotoFromAlbum(albumId: string, photoId: string): Promise<Outcome> {
  const { error } = await supabase.from("album_photos").delete().eq("album_id", albumId).eq("photo_id", photoId);
  return error ? fail(error.message) : { ok: true };
}

export async function renameAlbum(albumId: string, name: string): Promise<Outcome> {
  const { error } = await supabase.from("albums").update({ name: name.trim() }).eq("id", albumId);
  return error ? fail(error.message) : { ok: true };
}

export async function deleteAlbum(albumId: string): Promise<Outcome> {
  const { error } = await supabase.from("albums").delete().eq("id", albumId);
  return error ? fail(error.message) : { ok: true };
}
