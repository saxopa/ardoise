"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";

type PublicOrder = {
  id: string;
  order_number: number;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  items: { name: string; qty: number; unit_price_cents: number }[];
};

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Reçue" },
  { status: "confirmed", label: "Confirmée" },
  { status: "preparing", label: "En préparation" },
  { status: "ready", label: "Prête" },
  { status: "served", label: "Servie" },
];

export default function OrderTracker({
  token,
  orderId,
}: {
  token: string;
  orderId: string;
}) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchOrder = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_order_public", {
      p_token: token,
      p_order_id: orderId,
    });
    if (data) setOrder(data as PublicOrder);
    else setNotFound(true);
  }, [token, orderId]);

  useEffect(() => {
    // fetch async : le setState n'est pas synchrone (post-await).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOrder();
    // Polling sobre : la page n'est ouverte que quelques minutes.
    const interval = setInterval(() => void fetchOrder(), 8000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (notFound) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-display text-[28px] font-bold">
          Commande introuvable
        </h1>
        <p className="mt-3 text-ardoise-mid">
          Cette commande n&apos;existe pas ou la session a expiré.
        </p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex flex-1 items-center justify-center py-24">
        <p className="font-mono text-ardoise-mid">Chargement…</p>
      </main>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.status === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-10">
      <p className="font-mono text-sm text-ardoise-mid">
        Commande #{order.order_number}
      </p>
      <h1 className="font-display mt-1 text-[28px] font-bold">
        {cancelled ? "Commande annulée" : ORDER_STATUS_LABELS[order.status]}
      </h1>

      {!cancelled && (
        <ol className="mt-8 space-y-0">
          {STEPS.map((step, i) => {
            const done = i <= currentIdx;
            return (
              <li key={step.status} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-medium ${
                      done
                        ? "bg-terracotta text-craie"
                        : "border border-ardoise-mid/40 text-ardoise-mid"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      className={`h-8 w-px ${done && i < currentIdx ? "bg-terracotta" : "bg-ardoise-mid/30"}`}
                    />
                  )}
                </div>
                <span
                  className={`pt-1 text-[15px] ${done ? "font-semibold" : "text-ardoise-mid"}`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-8 border-t border-ardoise-deep/12 pt-6">
        <ul className="space-y-2 text-[15px]">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between">
              <span>
                {item.qty} × {item.name}
              </span>
              <span className="font-mono text-ardoise-mid">
                {formatPrice(item.unit_price_cents * item.qty)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between border-t border-ardoise-deep/12 pt-4 font-semibold">
          <span>Total</span>
          <span className="font-mono">{formatPrice(order.total_cents)}</span>
        </p>
        <p className="mt-2 text-sm text-ardoise-mid">
          Paiement au comptoir ou auprès du personnel.
        </p>
      </div>

      <Link
        href={`/t/${token}`}
        className="press mt-8 inline-flex h-11 items-center rounded-[4px] border-[1.5px] border-terracotta px-5 font-semibold text-terracotta hover:bg-terracotta/5"
      >
        ← Revenir à la carte
      </Link>
    </main>
  );
}
