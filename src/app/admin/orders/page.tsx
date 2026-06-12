import { requireRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";
import OrdersBoard from "./orders-board";
import type { OrderWithItems } from "@/lib/use-orders";

export const metadata = { title: "Commandes — Ardoise" };

export default async function OrdersPage() {
  const { restaurant } = await requireRestaurant();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[28px] font-bold md:text-[42px]">
        Commandes du jour
      </h1>
      <p className="mt-2 text-ardoise-mid">
        Mise à jour en temps réel — aucun rechargement nécessaire.
      </p>
      <OrdersBoard
        restaurantId={restaurant.id}
        currency={restaurant.currency}
        initialOrders={(data ?? []) as OrderWithItems[]}
      />
    </div>
  );
}
