import { PHOTOS_BUCKET, supabase } from "@/lib/supabase";
import type { PhotoRow } from "@/lib/types";

/** Envoie des photos du téléphone dans l'album commun, en pleine résolution. Renvoie les lignes créées et les erreurs. */
export async function uploadPhotos(files: File[], senderName: string): Promise<{ photos: PhotoRow[]; errors: string[] }> {
  const photos: PhotoRow[] = [];
  const errors: string[] = [];
  for (const file of files) {
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file, { cacheControl: "604800" });
    if (uploadError) {
      errors.push(`Photo non envoyée : ${uploadError.message}`);
      continue;
    }
    const { data, error } = await supabase.from("photos").insert({ storage_path: path, sender_name: senderName }).select().single();
    if (error || !data) errors.push(`Photo non enregistrée : ${error?.message ?? "erreur inconnue"}`);
    else photos.push(data as PhotoRow);
  }
  return { photos, errors };
}
