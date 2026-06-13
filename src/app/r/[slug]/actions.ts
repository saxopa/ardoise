"use server";

import { createAnonClient } from "@/lib/supabase/server";
import { sendReservationConfirmation } from "@/lib/email";

export type ReservationState = {
  error: string | null;
  success: boolean;
};

const ERROR_MESSAGES: Record<string, string> = {
  RESTAURANT_UNAVAILABLE: "Les réservations sont fermées pour le moment.",
  DATE_INVALID: "Choisissez une date à venir (90 jours maximum).",
  RATE_LIMITED:
    "Trop de demandes avec ce numéro aujourd'hui. Contactez directement le restaurant.",
};

export async function submitReservation(
  _prev: ReservationState,
  formData: FormData
): Promise<ReservationState> {
  const slug = String(formData.get("slug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const partySize = Number(formData.get("party_size") ?? 0);
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!name || name.length > 80)
    return { error: "Nom requis.", success: false };
  if (phone.length < 6 || phone.length > 20)
    return { error: "Numéro de téléphone invalide.", success: false };
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 50)
    return { error: "Nombre de personnes invalide.", success: false };

  const startsAt = new Date(`${date}T${time}`);
  if (Number.isNaN(startsAt.getTime()))
    return { error: "Date ou heure invalide.", success: false };

  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("create_reservation", {
    p_slug: slug,
    p_customer_name: name,
    p_phone: phone,
    p_party_size: partySize,
    p_starts_at: startsAt.toISOString(),
    p_email: email || null,
    p_note: note || null,
  });

  if (error) {
    return {
      error: ERROR_MESSAGES[error.message] ?? "Réservation impossible. Réessayez.",
      success: false,
    };
  }
  if (data?.error) {
    return {
      error: ERROR_MESSAGES[data.error] ?? "Réservation impossible. Réessayez.",
      success: false,
    };
  }

  // Confirmation au client (best-effort). On récupère le nom du resto
  // (déjà public) pour personnaliser. Un échec d'email ne casse pas la résa.
  if (email) {
    const { data: resto } = await supabase.rpc("get_restaurant_public", {
      p_slug: slug,
    });
    await sendReservationConfirmation({
      to: email,
      restaurantName: resto?.name ?? "le restaurant",
      customerName: name,
      startsAt: startsAt.toISOString(),
      partySize,
    });
  }

  return { error: null, success: true };
}
