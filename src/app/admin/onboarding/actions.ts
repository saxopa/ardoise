"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error: string | null };

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export async function createRestaurant(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const seedDemo = formData.get("seed_demo") === "on";

  if (!name || name.length > 80) {
    return { error: "Nom du restaurant requis (80 caractères max)." };
  }
  if (!SLUG_RE.test(slug)) {
    return {
      error:
        "Adresse invalide : minuscules, chiffres et tirets uniquement (3 à 40 caractères).",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .insert({ owner_id: user.id, name, slug })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Cette adresse est déjà prise, choisissez-en une autre." };
    }
    return { error: "Création impossible : " + error.message };
  }

  if (seedDemo) {
    // Carte de démarrage : 3 catégories, 6 plats, 4 tables.
    const { data: cats } = await supabase
      .from("menu_categories")
      .insert([
        { restaurant_id: restaurant.id, name: "Entrées", sort_order: 0 },
        { restaurant_id: restaurant.id, name: "Plats", sort_order: 1 },
        { restaurant_id: restaurant.id, name: "Desserts", sort_order: 2 },
      ])
      .select();

    if (cats && cats.length === 3) {
      await supabase.from("menu_items").insert([
        { restaurant_id: restaurant.id, category_id: cats[0].id, name: "Salade du marché", description: "Légumes de saison, vinaigrette maison", price_cents: 950, sort_order: 0 },
        { restaurant_id: restaurant.id, category_id: cats[0].id, name: "Velouté du jour", description: "Servi avec pain grillé", price_cents: 850, sort_order: 1 },
        { restaurant_id: restaurant.id, category_id: cats[1].id, name: "Plat du jour", description: "Selon l'arrivage — demandez en salle", price_cents: 1650, sort_order: 0 },
        { restaurant_id: restaurant.id, category_id: cats[1].id, name: "Burger maison", description: "Pain artisanal, frites fraîches", price_cents: 1550, sort_order: 1 },
        { restaurant_id: restaurant.id, category_id: cats[2].id, name: "Crème brûlée", description: "À la vanille bourbon", price_cents: 750, sort_order: 0 },
        { restaurant_id: restaurant.id, category_id: cats[2].id, name: "Moelleux au chocolat", description: "Cœur coulant, glace vanille", price_cents: 800, sort_order: 1 },
      ]);
    }

    await supabase.from("tables").insert(
      [1, 2, 3, 4].map((n) => ({
        restaurant_id: restaurant.id,
        label: String(n),
        seats: 2 + (n % 2) * 2,
      }))
    );
  }

  redirect("/admin");
}
