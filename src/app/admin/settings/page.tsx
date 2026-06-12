import { requireRestaurant } from "@/lib/restaurant";
import SettingsForm from "./settings-form";

export const metadata = { title: "Réglages — Ardoise" };

export default async function SettingsPage() {
  const { restaurant } = await requireRestaurant();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-[28px] font-bold md:text-[42px]">
        Réglages
      </h1>
      <p className="mt-2 text-ardoise-mid">
        Adresse de réservation publique :{" "}
        <span className="font-mono">/r/{restaurant.slug}</span> (non modifiable
        pour ne pas casser vos liens déjà partagés).
      </p>
      <SettingsForm restaurant={restaurant} />
    </div>
  );
}
