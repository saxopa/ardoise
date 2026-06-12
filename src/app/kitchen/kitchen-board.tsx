"use client";

import Link from "next/link";
import { useOrders, type OrderWithItems } from "@/lib/use-orders";
import { minutesSince } from "@/lib/format";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";

/* Écran cuisine : fond ardoise-night, lisible à 2 mètres,
   zéro icône, zéro ombre. Bordure gauche = statut. */

const NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: "preparing", label: "Lancer" },
  confirmed: { to: "preparing", label: "Lancer" },
  preparing: { to: "ready", label: "Prêt" },
  ready: { to: "served", label: "Servi" },
};

function borderFor(status: OrderStatus): string {
  if (status === "pending" || status === "confirmed") return "border-terracotta";
  if (status === "preparing") return "border-sauge";
  return "border-ardoise-mid";
}

export default function KitchenBoard({
  restaurantId,
  restaurantName,
  initialOrders,
}: {
  restaurantId: string;
  restaurantName: string;
  initialOrders: OrderWithItems[];
}) {
  const { orders, updateStatus } = useOrders(restaurantId, initialOrders);

  const active = orders
    .filter((o) =>
      ["pending", "confirmed", "preparing", "ready"].includes(o.status)
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  return (
    <div className="min-h-screen flex-1 bg-ardoise-night p-6 text-creme">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">
          Cuisine — {restaurantName}
        </h1>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-creme/60">
            {active.length} ticket{active.length > 1 ? "s" : ""}
          </span>
          <Link
            href="/admin"
            className="text-sm text-creme/60 underline underline-offset-[3px] hover:text-creme"
          >
            ← Tableau de bord
          </Link>
        </div>
      </header>

      {active.length === 0 && (
        <p className="mt-24 text-center font-display text-2xl text-creme/40">
          Aucun ticket en attente.
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {active.map((order) => {
          const age = minutesSince(order.created_at);
          const action = NEXT_ACTION[order.status];
          return (
            <article
              key={order.id}
              className={`animate-fade-in border-l-4 ${borderFor(order.status)} bg-[#161d1d] p-5`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-medium">
                  #{order.order_number}
                </span>
                <span
                  className={`font-mono text-lg ${age >= 15 ? "text-terracotta-pale" : "text-creme/60"}`}
                >
                  {age} min
                </span>
              </div>
              <p className="mt-1 text-lg font-semibold">
                Table {order.table_label}
                <span className="ml-3 text-sm font-normal text-creme/50">
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </p>

              <ul className="mt-4 space-y-2">
                {order.order_items.map((item) => (
                  <li key={item.id} className="text-xl font-semibold leading-snug">
                    <span className="font-mono text-terracotta-pale">
                      {item.quantity}×
                    </span>{" "}
                    {item.item_name}
                  </li>
                ))}
              </ul>
              {order.note && (
                <p className="mt-3 border-t border-creme/15 pt-3 text-base text-creme/80">
                  ⚠ {order.note}
                </p>
              )}

              {action && (
                <button
                  type="button"
                  onClick={() => updateStatus(order.id, action.to)}
                  className="press mt-5 h-14 w-full rounded-[4px] bg-terracotta text-xl font-bold text-craie transition-colors duration-150 hover:bg-terracotta-dark"
                >
                  {action.label}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
