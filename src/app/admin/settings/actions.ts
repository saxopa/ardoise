"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRestaurant } from "@/lib/restaurant";

export type SettingsState = { error: string | null; saved: boolean };

/** Régénère un code d'accès équipe (invalide l'ancien lien). */
export async function regenerateStaffCode(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const role = String(formData.get("role") ?? "");
  const column =
    role === "kitchen"
      ? "kitchen_code"
      : role === "server"
        ? "server_code"
        : null;
  if (!column) return;

  const supabase = await createClient();
  await supabase
    .from("restaurants")
    .update({ [column]: randomBytes(8).toString("hex") })
    .eq("id", restaurant.id);
  revalidatePath("/admin/settings");
}

export async function updateSettings(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { restaurant } = await requireRestaurant();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const orderingEnabled = formData.get("ordering_enabled") === "on";
  const reservationsEnabled = formData.get("reservations_enabled") === "on";

  if (!name || name.length > 80) {
    return { error: "Nom requis (80 caractères max).", saved: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      name,
      phone,
      address,
      ordering_enabled: orderingEnabled,
      reservations_enabled: reservationsEnabled,
    })
    .eq("id", restaurant.id);

  if (error) return { error: error.message, saved: false };
  revalidatePath("/admin", "layout");
  return { error: null, saved: true };
}
