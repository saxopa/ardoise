"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/types";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { updateItem } from "./actions";

export default function ItemEditor({
  item,
}: {
  item: MenuItem;
  currency: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-ardoise-mid underline underline-offset-[3px] hover:text-encre"
      >
        Modifier
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-encre/40 p-4">
      <div className="w-full max-w-md animate-fade-in rounded-[8px] border border-ardoise-deep/12 bg-craie p-6 shadow-[0_4px_12px_rgba(26,31,31,0.1)]">
        <h3 className="font-display text-xl font-bold">Modifier le plat</h3>
        <form
          action={async (formData) => {
            await updateItem(formData);
            setOpen(false);
          }}
          className="mt-4 space-y-4"
        >
          <input type="hidden" name="id" value={item.id} />
          <div>
            <Label>Nom</Label>
            <Input name="name" defaultValue={item.name} maxLength={100} required />
          </div>
          <div>
            <Label>Prix (€)</Label>
            <Input
              name="price"
              inputMode="decimal"
              placeholder="vide si formule"
              defaultValue={
                item.price_cents === null
                  ? ""
                  : (item.price_cents / 100).toFixed(2).replace(".", ",")
              }
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              name="description"
              rows={2}
              maxLength={400}
              defaultValue={item.description ?? ""}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
