"use client";

import { useActionState } from "react";
import type { Restaurant } from "@/lib/types";
import { Button, Card, Input, Label } from "@/components/ui";
import { updateSettings, type SettingsState } from "./actions";

export default function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    updateSettings,
    { error: null, saved: false }
  );

  return (
    <Card className="mt-8">
      <form action={formAction} className="space-y-5">
        <div>
          <Label htmlFor="name">Nom du restaurant</Label>
          <Input
            id="name"
            name="name"
            defaultValue={restaurant.name}
            maxLength={80}
            required
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={restaurant.phone ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              name="address"
              defaultValue={restaurant.address ?? ""}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-ardoise-deep/10 pt-5">
          <label className="flex items-center gap-3 text-[15px]">
            <input
              type="checkbox"
              name="ordering_enabled"
              defaultChecked={restaurant.ordering_enabled}
              className="size-4 accent-terracotta"
            />
            Commande à table activée (QR codes)
          </label>
          <label className="flex items-center gap-3 text-[15px]">
            <input
              type="checkbox"
              name="reservations_enabled"
              defaultChecked={restaurant.reservations_enabled}
              className="size-4 accent-terracotta"
            />
            Réservations en ligne activées
          </label>
        </div>

        {state.error && (
          <p className="rounded-[4px] bg-[#a33b2e]/10 px-3 py-2 text-sm font-medium text-[#a33b2e]">
            {state.error}
          </p>
        )}
        {state.saved && !state.error && (
          <p className="rounded-[4px] bg-sauge/15 px-3 py-2 text-sm font-medium text-[#4a6b4a]">
            Réglages enregistrés.
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </Card>
  );
}
