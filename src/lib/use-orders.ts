"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  RealtimeChannel,
  REALTIME_SUBSCRIBE_STATES,
} from "@supabase/supabase-js";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

export type OrderWithItems = Order & { order_items: OrderItem[] };

/**
 * Commandes en temps réel (Supabase Realtime, postgres_changes).
 * La RLS limite le flux au propriétaire du restaurant.
 *
 * Robustesse : on surveille le statut du canal. En cas de coupure
 * (CHANNEL_ERROR / TIMED_OUT / CLOSED), on tente une reconnexion auto
 * avec un léger backoff. À chaque retour à SUBSCRIBED — ou au retour
 * en ligne du navigateur — on resynchronise toutes les commandes du jour.
 */
export function useOrders(restaurantId: string, initial: OrderWithItems[]) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initial);
  const [connected, setConnected] = useState(false);
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

  // Resynchronisation complète des commandes du jour (même logique que les pages).
  const refetchAll = useCallback(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data } = await supabaseRef.current
      .from("orders")
      .select("*, order_items(*)")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false });
    if (data) setOrders(data as OrderWithItems[]);
  }, [restaurantId]);

  useEffect(() => {
    const supabase = supabaseRef.current;
    let channel: RealtimeChannel | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let backoff = 2000; // 2s, plafonné ~10s
    let cancelled = false;

    const subscribe = () => {
      channel = supabase
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
        .subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            setConnected(true);
            backoff = 2000; // reset après une connexion saine
            // Resync au (re)passage en ligne pour rattraper les events manqués.
            void refetchAll();
            return;
          }
          // CHANNEL_ERROR | TIMED_OUT | CLOSED : on tombe hors-ligne puis on retente.
          setConnected(false);
          scheduleReconnect();
        });
    };

    const scheduleReconnect = () => {
      if (cancelled || retryTimer) return;
      const delay = backoff;
      backoff = Math.min(backoff * 2, 10000);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (cancelled) return;
        if (channel) void supabase.removeChannel(channel);
        channel = null;
        subscribe();
      }, delay);
    };

    subscribe();

    // online/offline : forcer une resync au retour, signaler la coupure au départ.
    const handleOnline = () => {
      setConnected(false);
      if (channel) void supabase.removeChannel(channel);
      channel = null;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      backoff = 2000;
      subscribe();
    };
    const handleOffline = () => setConnected(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [restaurantId, refetchOne, refetchAll]);

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

  return { orders, updateStatus, connected };
}
