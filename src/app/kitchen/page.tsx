import { requireRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";
import KitchenBoard from "./kitchen-board";
import type { OrderWithItems } from "@/lib/use-orders";

export const metadata = { title: "Cuisine — Ardoise" };

export default async function KitchenPage() {
  const { restaurant } = await requireRestaurant();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", todayStart.toISOString())
    .in("status", ["pending", "confirmed", "preparing", "ready"])
    .order("created_at", { ascending: true });

  return (
    <KitchenBoard
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      initialOrders={(data ?? []) as OrderWithItems[]}
    />
  );
}
