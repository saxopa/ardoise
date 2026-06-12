"use client";

import { useActionState, useState } from "react";
import { createRestaurant, type OnboardingState } from "./actions";
import { Button, Card, Input, Label } from "@/components/ui";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);
}

export default function OnboardingForm() {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createRestaurant,
    { error: null }
  );
  const [slug, setSlug] = useState("");

  return (
    <Card className="mt-8 animate-fade-in">
      <form action={formAction} className="space-y-5">
        <div>
          <Label htmlFor="name">Nom du restaurant</Label>
          <Input
            id="name"
            name="name"
            placeholder="Le Comptoir de Marie"
            maxLength={80}
            required
            onChange={(e) => setSlug(slugify(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="slug">Adresse de réservation publique</Label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-ardoise-mid">/r/</span>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="le-comptoir-de-marie"
              pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]"
              required
            />
          </div>
        </div>
        <label className="flex items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            name="seed_demo"
            defaultChecked
            className="size-4 accent-terracotta"
          />
          Créer une carte d&apos;exemple et 4 tables pour démarrer
        </label>

        {state.error && (
          <p className="rounded-[4px] bg-[#a33b2e]/10 px-3 py-2 text-sm font-medium text-[#a33b2e]">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer mon restaurant"}
        </Button>
      </form>
    </Card>
  );
}
