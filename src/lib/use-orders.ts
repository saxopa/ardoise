"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

export type OrderWithItems = Order & { order_items: OrderItem[] };

/**
 * Commandes en temps réel (Supabase Realtime, postgres_changes).
 * La RLS limite le flux au propriétaire du restaurant.
 */
export function useOrders(restaurantId: string, initial: OrderWithItems[]) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initial);
  const supabaseRef = useRef(createClient());

  const refetchOne = useCallback(async (orderId: string) => {
    const { data } = await supabaseRef.current
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();
    if (!data) return;
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== orderId);
      return [data as OrderWithItems, ...next].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const row = payload.new as Order | undefined;
          if (row?.id) void refetchOne(row.id);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [restaurantId, refetchOne]);

  const updateStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      // Optimiste : MAJ locale immédiate, Realtime confirmera.
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      await supabaseRef.current
        .from("orders")
        .update({ status })
        .eq("id", orderId);
    },
    []
  );

  return { orders, updateStatus };
}
