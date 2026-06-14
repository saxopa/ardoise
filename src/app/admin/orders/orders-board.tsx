"use client";

import { useState } from "react";
import { useOrders, type OrderWithItems } from "@/lib/use-orders";
import { formatPrice, formatTime } from "@/lib/format";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/types";
import { Badge, Card } from "@/components/ui";
import { OfflineBanner } from "@/components/offline-banner";

const FILTERS: { value: OrderStatus | "all" | "active"; label: string }[] = [
  { value: "active", label: "En cours" },
  { value: "all", label: "Toutes" },
  { value: "served", label: "Servies" },
  { value: "cancelled", label: "Annulées" },
];

function statusTone(status: OrderStatus): "warm" | "neutral" | "success" | "danger" {
  if (status === "pending") return "warm";
  if (status === "ready" || status === "served") return "success";
  if (status === "cancelled") return "danger";
  return "neutral";
}

export default function OrdersBoard({
  restaurantId,
  currency,
  initialOrders,
}: {
  restaurantId: string;
  currency: string;
  initialOrders: OrderWithItems[];
}) {
  const { orders, updateStatus, connected } = useOrders(
    restaurantId,
    initialOrders
  );
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("active");

  const visible = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "active")
      return ["pending", "confirmed", "preparing", "ready"].includes(o.status);
    return o.status === filter;
  });

  return (
    <div className="mt-6">
      <OfflineBanner connected={connected} />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`press h-9 rounded-[4px] px-4 text-sm font-semibold transition-colors duration-150 ${
              filter === f.value
                ? "bg-ardoise-deep text-creme"
                : "border border-ardoise-deep/15 text-ardoise-mid hover:text-encre"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {visible.length === 0 && (
          <p className="text-ardoise-mid">Aucune commande dans cette vue.</p>
        )}
        {visible.map((order) => {
          const nextIdx = ORDER_STATUS_FLOW.indexOf(order.status) + 1;
          const next =
            nextIdx > 0 && nextIdx < ORDER_STATUS_FLOW.length
              ? ORDER_STATUS_FLOW[nextIdx]
              : null;
          return (
            <Card key={order.id} className="animate-fade-in">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-lg font-medium">
                    #{order.order_number}
                  </span>
                  <span className="ml-3 text-ardoise-mid">
                    Table {order.table_label} · {formatTime(order.created_at)}
                    {order.customer_name ? ` · ${order.customer_name}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg">
                    {formatPrice(order.total_cents, currency)}
                  </span>
                  <Badge tone={statusTone(order.status)}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </div>
              </div>

              <ul className="mt-3 space-y-1 border-t border-ardoise-deep/10 pt-3 text-[15px]">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.quantity} × {item.item_name}
                    </span>
                    <span className="font-mono text-ardoise-mid">
                      {formatPrice(item.unit_price_cents * item.quantity, currency)}
                    </span>
                  </li>
                ))}
              </ul>
              {order.note && (
                <p className="mt-2 rounded-[4px] bg-creme-dark px-3 py-2 text-sm">
                  Note client : {order.note}
                </p>
              )}

              {!["served", "cancelled"].includes(order.status) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {next && (
                    <button
                      type="button"
                      onClick={() => updateStatus(order.id, next)}
                      className="press inline-flex h-10 items-center rounded-[4px] bg-terracotta px-4 text-sm font-semibold text-craie transition-colors duration-150 hover:bg-terracotta-dark"
                    >
                      → {ORDER_STATUS_LABELS[next]}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => updateStatus(order.id, "cancelled")}
                    className="press inline-flex h-10 items-center rounded-[4px] border-[1.5px] border-[#a33b2e] px-4 text-sm font-semibold text-[#a33b2e] hover:bg-[#a33b2e]/5"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
