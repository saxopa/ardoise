"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRestaurant } from "@/lib/restaurant";
import { parseMenuJson } from "@/lib/parse-menu";

export type ImportState = {
  error: string | null;
  imported: number;
  categories: number;
};

export async function importMenu(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const { restaurant } = await requireRestaurant();
  const raw = String(formData.get("raw") ?? "");

  // On reparse côté serveur : ne jamais faire confiance au client.
  const parsed = parseMenuJson(raw);
  if (parsed.error || parsed.categories.length === 0) {
    return {
      error: parsed.error ?? "Aucun plat à importer.",
      imported: 0,
      categories: 0,
    };
  }

  const supabase = await createClient();

  // On ajoute à la suite des catégories existantes.
  const { count } = await supabase
    .from("menu_categories")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id);
  let sortOrder = count ?? 0;

  let importedItems = 0;
  let importedCats = 0;

  for (const cat of parsed.categories) {
    const { data: category, error: catErr } = await supabase
      .from("menu_categories")
      .insert({
        restaurant_id: restaurant.id,
        name: cat.name,
        sort_order: sortOrder++,
      })
      .select("id")
      .single();
    if (catErr || !category) continue;
    importedCats++;

    const rows = cat.items.map((it, i) => ({
      restaurant_id: restaurant.id,
      category_id: category.id,
      name: it.name,
      description: it.description || null,
      price_cents: it.price_cents,
      sort_order: i,
    }));
    const { error: itemsErr } = await supabase.from("menu_items").insert(rows);
    if (!itemsErr) importedItems += rows.length;
  }

  if (importedItems === 0) {
    return { error: "L'import a échoué. Réessayez.", imported: 0, categories: 0 };
  }

  revalidatePath("/admin/menu");
  return { error: null, imported: importedItems, categories: importedCats };
}
