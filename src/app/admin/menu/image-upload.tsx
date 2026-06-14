"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadMenuImage } from "@/lib/image-client";
import { setItemImage } from "./actions";

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

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const publicUrl = await uploadMenuImage(restaurantId, file);
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
