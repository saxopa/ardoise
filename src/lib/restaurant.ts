import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/types";
import { redirect } from "next/navigation";

/** Récupère l'utilisateur connecté et son restaurant (le proxy garantit l'auth). */
export async function getUserRestaurant(): Promise<{
  userId: string;
  restaurant: Restaurant | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  return { userId: user.id, restaurant: restaurant as Restaurant | null };
}

/** Comme getUserRestaurant mais exige un restaurant — sinon onboarding. */
export async function requireRestaurant(): Promise<{
  userId: string;
  restaurant: Restaurant;
}> {
  const { userId, restaurant } = await getUserRestaurant();
  if (!restaurant) redirect("/admin/onboarding");
  return { userId, restaurant };
}
