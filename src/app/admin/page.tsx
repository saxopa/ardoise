import { requireRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatTime } from "@/lib/format";
import { ORDER_STATUS_LABELS, type Order, type Reservation } from "@/lib/types";
import { Badge, Card } from "@/components/ui";
import Link from "next/link";

export const metadata = { title: "Tableau de bord — Ardoise" };

export default async function DashboardPage() {
  const { restaurant } = await requireRestaurant();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: orders }, { data: reservations }] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .gte("starts_at", todayStart.toISOString())
      .lte("starts_at", new Date(todayStart.getTime() + 86400000).toISOString())
      .order("starts_at"),
  ]);

  const todayOrders = (orders ?? []) as Order[];
  const todayReservations = (reservations ?? []) as Reservation[];
  const validOrders = todayOrders.filter((o) => o.status !== "cancelled");
  const revenue = validOrders.reduce((sum, o) => sum + o.total_cents, 0);
  const activeOrders = todayOrders.filter((o) =>
    ["pending", "confirmed", "preparing"].includes(o.status)
  );
  const covers = todayReservations
    .filter((r) => ["pending", "confirmed", "seated"].includes(r.status))
    .reduce((sum, r) => sum + r.party_size, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[28px] font-bold md:text-[42px]">
        Aujourd&apos;hui
      </h1>

      {/* Métriques en typographie large — pas de graphiques décoratifs */}
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {[
          { label: "Chiffre du jour", value: formatPrice(revenue, restaurant.currency) },
          { label: "Commandes", value: String(validOrders.length) },
          { label: "Couverts réservés", value: String(covers) },
        ].map((m) => (
          <Card key={m.label}>
            <p className="text-sm font-medium text-ardoise-mid">{m.label}</p>
            <p className="font-display mt-2 text-[42px] font-bold leading-none">
              {m.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold">
              Commandes en cours ({activeOrders.length})
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm text-ardoise-mid underline underline-offset-[3px] hover:text-encre"
            >
              Tout voir
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {activeOrders.length === 0 && (
              <p className="text-[15px] text-ardoise-mid">
                Aucune commande en cours.
              </p>
            )}
            {activeOrders.slice(0, 6).map((o) => (
              <Card key={o.id} className="flex items-center justify-between !p-4">
                <div>
                  <span className="font-mono font-medium">#{o.order_number}</span>
                  <span className="ml-3 text-ardoise-mid">
                    Table {o.table_label} · {formatTime(o.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono">
                    {formatPrice(o.total_cents, restaurant.currency)}
                  </span>
                  <Badge tone={o.status === "pending" ? "warm" : "neutral"}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold">
              Réservations du jour ({todayReservations.length})
            </h2>
            <Link
              href="/admin/reservations"
              className="text-sm text-ardoise-mid underline underline-offset-[3px] hover:text-encre"
            >
              Tout voir
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {todayReservations.length === 0 && (
              <p className="text-[15px] text-ardoise-mid">
                Aucune réservation aujourd&apos;hui.
              </p>
            )}
            {todayReservations.slice(0, 6).map((r) => (
              <Card key={r.id} className="flex items-center justify-between !p-4">
                <div>
                  <span className="font-medium">{r.customer_name}</span>
                  <span className="ml-3 text-ardoise-mid">
                    {formatTime(r.starts_at)} · {r.party_size} pers.
                  </span>
                </div>
                <Badge
                  tone={
                    r.status === "confirmed" || r.status === "seated"
                      ? "success"
                      : r.status === "pending"
                        ? "warm"
                        : "neutral"
                  }
                >
                  {r.status === "pending" ? "À confirmer" : r.status}
                </Badge>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
