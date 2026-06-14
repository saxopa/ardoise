"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { minutesSince } from "@/lib/format";
import { printKitchenTicket } from "@/lib/print-ticket";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";

/* Écran cuisine accessible par code-URL (tablette posée en cuisine).
   Pas de login patron, pas de Realtime (accès anon) : polling toutes les 4s.
   Visuellement identique à l'écran cuisine du patron. */

export type KitchenOrder = {
  id: string;
  order_number: number;
  table_label: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
  items: { name: string; qty: number }[];
};
export type KitchenData = {
  restaurant_name: string;
  orders: KitchenOrder[];
};

const NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> =
  {
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

export default function KitchenCodeBoard({
  code,
  initial,
}: {
  code: string;
  initial: KitchenData;
}) {
  const [data, setData] = useState<KitchenData>(initial);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data: fresh } = await supabase.rpc("kitchen_board", { p_code: code });
    if (fresh) setData(fresh as KitchenData);
  }, [code]);

  useEffect(() => {
    const interval = setInterval(() => void refresh(), 4000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function advance(orderId: string, status: OrderStatus) {
    // Optimiste : on retire/avance localement, le polling confirmera.
    setData((prev) => ({
      ...prev,
      orders: prev.orders
        .map((o) => (o.id === orderId ? { ...o, status } : o))
        .filter((o) => o.status !== "served"),
    }));
    const supabase = createClient();
    await supabase.rpc("kitchen_advance", {
      p_code: code,
      p_order_id: orderId,
      p_status: status,
    });
    void refresh();
  }

  const active = [...data.orders].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="min-h-screen flex-1 bg-ardoise-night p-6 text-creme">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">
          Cuisine — {data.restaurant_name}
        </h1>
        <span className="font-mono text-sm text-creme/60">
          {active.length} ticket{active.length > 1 ? "s" : ""}
        </span>
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
                {order.items.map((item, i) => (
                  <li key={i} className="text-xl font-semibold leading-snug">
                    <span className="font-mono text-terracotta-pale">
                      {item.qty}×
                    </span>{" "}
                    {item.name}
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
                  onClick={() => advance(order.id, action.to)}
                  className="press mt-5 h-14 w-full rounded-[4px] bg-terracotta text-xl font-bold text-craie transition-colors duration-150 hover:bg-terracotta-dark"
                >
                  {action.label}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  printKitchenTicket({
                    orderNumber: order.order_number,
                    tableLabel: order.table_label,
                    createdAt: order.created_at,
                    note: order.note,
                    items: order.items,
                  })
                }
                className="mt-3 text-sm text-creme/60 underline underline-offset-[3px] hover:text-creme"
              >
                Imprimer
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
