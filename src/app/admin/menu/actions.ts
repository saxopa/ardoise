"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRestaurant } from "@/lib/restaurant";

/* La RLS garantit déjà l'isolation par propriétaire ; on revérifie le
   restaurant côté serveur pour des messages d'erreur propres. */

function parsePrice(input: unknown): number | null {
  const raw = String(input ?? "").replace(",", ".").trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value < 0 || value > 10000) return null;
  return Math.round(value * 100);
}

export async function createCategory(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 60) return;

  const supabase = await createClient();
  const { count } = await supabase
    .from("menu_categories")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id);

  await supabase.from("menu_categories").insert({
    restaurant_id: restaurant.id,
    name,
    sort_order: count ?? 0,
  });
  revalidatePath("/admin/menu");
}

export async function deleteCategory(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase
    .from("menu_categories")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);
  revalidatePath("/admin/menu");
}

export async function createItem(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceCents = parsePrice(formData.get("price"));
  if (!name || name.length > 100 || priceCents === null || !categoryId) return;

  const supabase = await createClient();
  await supabase.from("menu_items").insert({
    restaurant_id: restaurant.id,
    category_id: categoryId,
    name,
    description,
    price_cents: priceCents,
  });
  revalidatePath("/admin/menu");
}

export async function updateItem(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceCents = parsePrice(formData.get("price"));
  if (!id || !name || priceCents === null) return;

  const supabase = await createClient();
  await supabase
    .from("menu_items")
    .update({ name, description, price_cents: priceCents })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);
  revalidatePath("/admin/menu");
}

export async function toggleItemAvailability(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const id = String(formData.get("id") ?? "");
  const available = formData.get("available") === "true";

  const supabase = await createClient();
  await supabase
    .from("menu_items")
    .update({ is_available: available })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);
  revalidatePath("/admin/menu");
}

export async function setItemImage(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const id = String(formData.get("id") ?? "");
  const url = String(formData.get("image_url") ?? "").trim() || null;
  // Sécurité : n'accepter qu'une URL du bucket Storage de ce projet.
  if (
    url &&
    !url.startsWith(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu/`
    )
  ) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("menu_items")
    .update({ image_url: url })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);
  revalidatePath("/admin/menu");
}

export async function deleteItem(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase
    .from("menu_items")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);
  revalidatePath("/admin/menu");
}
