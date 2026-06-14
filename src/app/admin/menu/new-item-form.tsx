"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadMenuImage } from "@/lib/image-client";
import { createItem } from "./actions";
import { Button, Input, Label, Textarea } from "@/components/ui";

export default function NewItemForm({
  restaurantId,
  categoryId,
}: {
  restaurantId: string;
  categoryId: string;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pick(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!name.trim() || !price.trim()) return;
    setBusy(true);
    try {
      let imageUrl = "";
      if (file) imageUrl = await uploadMenuImage(restaurantId, file);
      const fd = new FormData();
      fd.set("category_id", categoryId);
      fd.set("name", name);
      fd.set("price", price);
      fd.set("description", desc);
      fd.set("image_url", imageUrl);
      await createItem(fd);
      setName("");
      setPrice("");
      setDesc("");
      setFile(null);
      setPreview(null);
    } catch {
      alert("Échec de l'ajout. Réessayez (photo JPEG/PNG, 5 Mo max).");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-4 rounded-[8px] border border-ardoise-deep/12 bg-craie p-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <Label>Nom du plat</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </div>
        <div>
          <Label>Prix (€)</Label>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="14,50"
          />
        </div>
      </div>
      <div>
        <Label>Description (optionnelle)</Label>
        <Textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
          maxLength={400}
        />
      </div>
      <div className="flex items-center gap-3">
        {preview && (
          <Image
            src={preview}
            alt=""
            width={44}
            height={44}
            unoptimized
            className="size-11 rounded-[4px] object-cover"
          />
        )}
        <label className="cursor-pointer text-sm font-medium text-terracotta underline underline-offset-[3px]">
          {preview ? "Changer la photo" : "Ajouter une photo (optionnel)"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pick(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <Button type="button" variant="secondary" disabled={busy} onClick={submit}>
        {busy ? "Ajout…" : "Ajouter le plat"}
      </Button>
    </div>
  );
}
