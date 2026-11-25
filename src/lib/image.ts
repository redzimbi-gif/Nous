export type PreparedImage = { blob: Blob; mimeType: string; ext: string };

const MAX_SIDE = 1600;
const KEEP_AS_IS_BYTES = 700_000;

function extOf(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type.split("/")[1] || "jpg";
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // on retente avec un élément <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode"));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Réduit une photo du téléphone avant l'envoi (quelques centaines de Ko au lieu de plusieurs Mo).
 * Si le navigateur ne sait pas la décoder, ou pour un GIF, on envoie le fichier tel quel.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const original: PreparedImage = { blob: file, mimeType: file.type || "image/jpeg", ext: extOf(file) };
  if (file.type === "image/gif") return original;
  try {
    const { source, width, height, close } = await decode(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    if (scale === 1 && file.type === "image/jpeg" && file.size < KEEP_AS_IS_BYTES) {
      close();
      return original;
    }
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      close();
      return original;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, w, h);
    close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return original;
    return { blob, mimeType: "image/jpeg", ext: "jpg" };
  } catch {
    return original;
  }
}
