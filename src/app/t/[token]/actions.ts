"use server";

import { redirect } from "next/navigation";
import { createAnonClient } from "@/lib/supabase/server";

export type OrderResult = { error: string | null };

const ERROR_MESSAGES: Record<string, string> = {
  SESSION_INVALID:
    "La session de cette table a expiré. Adressez-vous au personnel.",
  RATE_LIMITED: "Trop de commandes rapprochées. Patientez quelques minutes.",
  ITEMS_INVALID: "Panier invalide. Rechargez la page et réessayez.",
  ITEM_UNAVAILABLE:
    "Un plat de votre panier vient de passer en rupture. Rechargez la carte.",
};

export async function placeOrder(
  token: string,
  items: { id: string; qty: number }[],
  customerName: string,
  note: string
): Promise<OrderResult> {
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
    return { error: ERROR_MESSAGES.ITEMS_INVALID };
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_token: token,
    p_items: items.map((i) => ({ id: i.id, qty: i.qty })),
    p_customer_name: customerName || null,
    p_note: note || null,
  });

  if (error) {
    const known = ERROR_MESSAGES[error.message];
    return { error: known ?? ERROR_MESSAGES.ITEMS_INVALID };
  }
  if (data?.error) {
    return { error: ERROR_MESSAGES[data.error] ?? ERROR_MESSAGES.ITEMS_INVALID };
  }

  redirect(`/t/${token}/o/${data.order_id}`);
}
