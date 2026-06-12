"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRestaurant } from "@/lib/restaurant";
import type { ReservationStatus } from "@/lib/types";

const VALID_STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "seated",
  "cancelled",
  "no_show",
];

export async function updateReservationStatus(formData: FormData) {
  const { restaurant } = await requireRestaurant();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ReservationStatus;
  if (!VALID_STATUSES.includes(status)) return;

  const supabase = await createClient();
  await supabase
    .from("reservations")
    .update({ status })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);
  revalidatePath("/admin/reservations");
}
