import { createAnonClient } from "@/lib/supabase/server";
import ReservationForm from "./reservation-form";

type PublicRestaurant = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  reservations_enabled: boolean;
};

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let restaurant: PublicRestaurant | null = null;
  if (/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) {
    const supabase = createAnonClient();
    const { data } = await supabase.rpc("get_restaurant_public", {
      p_slug: slug,
    });
    restaurant = data as PublicRestaurant | null;
  }

  if (!restaurant) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-display text-[28px] font-bold">
          Établissement introuvable
        </h1>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <header className="bg-ardoise-deep px-5 py-10 text-creme">
        <div className="mx-auto max-w-md">
          <h1 className="font-display text-[28px] font-bold leading-tight md:text-[42px]">
            {restaurant.name}
          </h1>
          {restaurant.address && (
            <p className="mt-2 text-creme/70">{restaurant.address}</p>
          )}
          {restaurant.phone && (
            <p className="mt-1 font-mono text-sm text-terracotta-pale">
              {restaurant.phone}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-md px-5 py-8">
        {restaurant.reservations_enabled ? (
          <ReservationForm slug={slug} />
        ) : (
          <p className="text-ardoise-mid">
            Les réservations en ligne sont momentanément fermées.
            {restaurant.phone
              ? ` Appelez-nous au ${restaurant.phone}.`
              : " Contactez directement l'établissement."}
          </p>
        )}
      </div>
    </main>
  );
}
