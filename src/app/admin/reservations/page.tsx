import { requireRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import {
  RESERVATION_STATUS_LABELS,
  type Reservation,
  type ReservationStatus,
} from "@/lib/types";
import { Badge, Card } from "@/components/ui";
import { updateReservationStatus } from "./actions";

export const metadata = { title: "Réservations — Ardoise" };

const ACTIONS: { status: ReservationStatus; label: string }[] = [
  { status: "confirmed", label: "Confirmer" },
  { status: "seated", label: "Installer" },
  { status: "no_show", label: "Non venue" },
  { status: "cancelled", label: "Annuler" },
];

/** Réservations depuis hier — hors du composant pour le React Compiler. */
function sinceYesterdayIso(): string {
  return new Date(Date.now() - 86400000).toISOString();
}

function tone(status: ReservationStatus): "warm" | "success" | "danger" | "neutral" {
  if (status === "pending") return "warm";
  if (status === "confirmed" || status === "seated") return "success";
  if (status === "cancelled" || status === "no_show") return "danger";
  return "neutral";
}

export default async function ReservationsPage() {
  const { restaurant } = await requireRestaurant();
  const supabase = await createClient();

  const { data } = await supabase
    .from("reservations")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .gte("starts_at", sinceYesterdayIso())
    .order("starts_at");

  const reservations = (data ?? []) as Reservation[];
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/r/${restaurant.slug}`;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-[28px] font-bold md:text-[42px]">
        Réservations
      </h1>
      <p className="mt-2 text-ardoise-mid">
        Page publique de réservation :{" "}
        <a
          href={`/r/${restaurant.slug}`}
          target="_blank"
          className="font-mono text-terracotta underline underline-offset-[3px]"
        >
          {publicUrl}
        </a>
      </p>

      <div className="mt-8 space-y-4">
        {reservations.length === 0 && (
          <p className="text-ardoise-mid">
            Aucune réservation à venir. Partagez votre page publique pour en
            recevoir.
          </p>
        )}
        {reservations.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">
                  {r.customer_name}
                  <span className="ml-3 font-normal text-ardoise-mid">
                    {r.party_size} pers.
                  </span>
                </p>
                <p className="mt-0.5 text-[15px] text-ardoise-mid">
                  {formatDateTime(r.starts_at)} · {r.phone}
                  {r.email ? ` · ${r.email}` : ""}
                </p>
                {r.note && (
                  <p className="mt-2 rounded-[4px] bg-creme-dark px-3 py-2 text-sm">
                    {r.note}
                  </p>
                )}
              </div>
              <Badge tone={tone(r.status)}>
                {RESERVATION_STATUS_LABELS[r.status]}
              </Badge>
            </div>

            {!["cancelled", "no_show"].includes(r.status) && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-ardoise-deep/10 pt-4">
                {ACTIONS.filter((a) => a.status !== r.status).map((a) => (
                  <form key={a.status} action={updateReservationStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value={a.status} />
                    <button
                      type="submit"
                      className={`press h-9 rounded-[4px] px-4 text-sm font-semibold transition-colors duration-150 ${
                        a.status === "cancelled" || a.status === "no_show"
                          ? "border-[1.5px] border-[#a33b2e] text-[#a33b2e] hover:bg-[#a33b2e]/5"
                          : "border-[1.5px] border-terracotta text-terracotta hover:bg-terracotta/5"
                      }`}
                    >
                      {a.label}
                    </button>
                  </form>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
