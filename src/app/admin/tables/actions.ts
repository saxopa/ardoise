"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRestaurant } from "@/lib/restaurant";

export async function createTable(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const label = String(formData.get("label") ?? "").trim();
  const seats = Math.min(Math.max(Number(formData.get("seats") ?? 2), 1), 50);
  if (!label || label.length > 20) return;

  const supabase = await createClient();
  await supabase
    .from("tables")
    .insert({ restaurant_id: restaurant.id, label, seats });
  revalidatePath("/admin/tables");
}

export async function deleteTable(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase
    .from("tables")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);
  revalidatePath("/admin/tables");
}

/** Ouvre une nouvelle session : clôt l'ancienne, génère un nouveau token. */
export async function openSession(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const tableId = String(formData.get("table_id") ?? "");
  const hours = Math.min(Math.max(Number(formData.get("hours") ?? 4), 1), 24);

  const supabase = await createClient();

  // Vérifie que la table appartient bien au restaurant.
  const { data: table } = await supabase
    .from("tables")
    .select("id")
    .eq("id", tableId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  if (!table) return;

  await supabase
    .from("table_sessions")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("table_id", tableId)
    .eq("status", "active");

  await supabase.from("table_sessions").insert({
    restaurant_id: restaurant.id,
    table_id: tableId,
    expires_at: new Date(Date.now() + hours * 3600000).toISOString(),
  });
  revalidatePath("/admin/tables");
}

/** Clôt la session active — la table ne peut plus recevoir de commandes. */
export async function closeSession(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const sessionId = String(formData.get("session_id") ?? "");

  const supabase = await createClient();
  await supabase
    .from("table_sessions")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("restaurant_id", restaurant.id);
  revalidatePath("/admin/tables");
}
