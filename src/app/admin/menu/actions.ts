"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRestaurant } from "@/lib/restaurant";

/* La RLS garantit déjà l'isolation par propriétaire ; on revérifie le
   restaurant côté serveur pour des messages d'erreur propres. */

/** Prix optionnel : chaîne vide ou illisible → null (plat sans prix, menu à formule). */
function parsePrice(input: unknown): number | null {
  const raw = String(input ?? "").replace(",", ".").trim();
  if (!raw) return null;
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value < 0 || value > 10000) return null;
  return Math.round(value * 100);
}

/** N'accepte qu'une URL du bucket Storage `menu` de ce projet (anti-injection). */
function safeImageUrl(input: unknown): string | null {
  const url = String(input ?? "").trim();
  if (!url) return null;
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu/`;
  return url.startsWith(prefix) ? url : null;
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

const COURSE_TYPES = ["entree", "plat", "dessert", "autre"] as const;

/** Définit le type de cours d'une catégorie (entrée/plat/dessert) — base du moteur de formules. */
export async function setCategoryCourse(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("course_type") ?? "");
  const course = (COURSE_TYPES as readonly string[]).includes(raw) ? raw : null;

  const supabase = await createClient();
  await supabase
    .from("menu_categories")
    .update({ course_type: course })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);
  revalidatePath("/admin/menu");
}

/** Crée une formule (ex. Entrée+Plat+Dessert = 29€). */
export async function createFormula(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const label = String(formData.get("label") ?? "").trim();
  const courses = formData
    .getAll("courses")
    .map(String)
    .filter((c) => (COURSE_TYPES as readonly string[]).includes(c));
  const priceCents = parsePrice(formData.get("price"));
  if (!label || label.length > 60 || courses.length < 2 || priceCents === null) {
    return; // une formule = au moins 2 cours + un prix
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("formulas")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id);

  await supabase.from("formulas").insert({
    restaurant_id: restaurant.id,
    label,
    course_types: courses,
    price_cents: priceCents,
    sort_order: count ?? 0,
  });
  revalidatePath("/admin/menu");
}

export async function deleteFormula(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase
    .from("formulas")
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
  const priceCents = parsePrice(formData.get("price")); // null = sans prix (formule)
  const imageUrl = safeImageUrl(formData.get("image_url"));
  if (!name || name.length > 100 || !categoryId) return;

  const supabase = await createClient();
  await supabase.from("menu_items").insert({
    restaurant_id: restaurant.id,
    category_id: categoryId,
    name,
    description,
    price_cents: priceCents,
    image_url: imageUrl,
  });
  revalidatePath("/admin/menu");
}

export async function updateItem(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceCents = parsePrice(formData.get("price")); // null = sans prix (formule)
  if (!id || !name) return;

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
  const url = safeImageUrl(formData.get("image_url"));

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
