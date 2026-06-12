"use client";

import { useActionState } from "react";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { submitReservation, type ReservationState } from "./actions";

export default function ReservationForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<ReservationState, FormData>(
    submitReservation,
    { error: null, success: false }
  );

  if (state.success) {
    return (
      <div className="animate-fade-in border-l-[3px] border-sauge py-2 pl-4">
        <h2 className="font-display text-xl font-bold">Demande envoyée</h2>
        <p className="mt-2 leading-relaxed text-ardoise-mid">
          Le restaurant vous confirmera par téléphone. Pensez à prévenir en cas
          d&apos;empêchement.
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-5">
      <h2 className="font-display text-xl font-bold">Réserver une table</h2>
      <input type="hidden" name="slug" value={slug} />

      <div>
        <Label htmlFor="name">Nom</Label>
        <Input id="name" name="name" maxLength={80} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" type="tel" required />
        </div>
        <div>
          <Label htmlFor="party_size">Personnes</Label>
          <Select id="party_size" name="party_size" defaultValue="2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" min={today} required />
        </div>
        <div>
          <Label htmlFor="time">Heure</Label>
          <Input id="time" name="time" type="time" required />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email (optionnel)</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div>
        <Label htmlFor="note">Précisions (optionnel)</Label>
        <Textarea
          id="note"
          name="note"
          rows={2}
          maxLength={300}
          placeholder="Poussette, terrasse, anniversaire…"
        />
      </div>

      {state.error && (
        <p className="rounded-[4px] bg-[#a33b2e]/10 px-3 py-2 text-sm font-medium text-[#a33b2e]">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Envoi…" : "Demander la réservation"}
      </Button>
    </form>
  );
}
