"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { setItemImage } from "./actions";

/** Redimensionne et compresse l'image côté navigateur avant upload. */
function downscale(file: File, maxDim: number, quality: number): Promise<Blob> {
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

export default function ImageUpload({
  restaurantId,
  itemId,
  currentUrl,
}: {
  restaurantId: string;
  itemId: string;
  currentUrl: string | null;
}) {
  const [url, setUrl] = useState(currentUrl);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const path = `${restaurantId}/${itemId}.jpg`;

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const blob = await downscale(file, 1200, 0.8);
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("menu")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("menu").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
      const fd = new FormData();
      fd.set("id", itemId);
      fd.set("image_url", publicUrl);
      await setItemImage(fd);
      setUrl(publicUrl);
    } catch {
      alert("Échec de l'envoi de la photo. Réessayez (JPEG/PNG, 5 Mo max).");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.storage.from("menu").remove([path]);
      const fd = new FormData();
      fd.set("id", itemId);
      fd.set("image_url", "");
      await setItemImage(fd);
      setUrl(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {url && (
        <Image
          src={url}
          alt=""
          width={44}
          height={44}
          unoptimized
          className="size-11 rounded-[4px] object-cover"
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="text-sm text-ardoise-mid underline underline-offset-[3px] hover:text-encre disabled:opacity-50"
      >
        {busy ? "Envoi…" : url ? "Changer la photo" : "Ajouter une photo"}
      </button>
      {url && !busy && (
        <button
          type="button"
          onClick={handleRemove}
          className="text-sm text-[#a33b2e]/70 underline underline-offset-[3px] hover:text-[#a33b2e]"
        >
          Retirer
        </button>
      )}
    </div>
  );
}
