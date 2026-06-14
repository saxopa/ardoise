import { createClient } from "@/lib/supabase/client";

/** Redimensionne et compresse une image côté navigateur (canvas). */
export function downscale(
  file: File,
  maxDim: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("blob"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compresse puis envoie une photo de plat dans le bucket Storage.
 * Chemin {restaurant_id}/{uuid}.jpg (la RLS exige que le 1er segment
 * soit un restaurant possédé par l'utilisateur). Retourne l'URL publique.
 */
export async function uploadMenuImage(
  restaurantId: string,
  file: File
): Promise<string> {
  const blob = await downscale(file, 1200, 0.8);
  const supabase = createClient();
  const path = `${restaurantId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from("menu")
    .upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  const { data } = supabase.storage.from("menu").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
