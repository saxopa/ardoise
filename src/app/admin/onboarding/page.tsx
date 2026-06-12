import { getUserRestaurant } from "@/lib/restaurant";
import { redirect } from "next/navigation";
import OnboardingForm from "./onboarding-form";

export const metadata = { title: "Bienvenue — Ardoise" };

export default async function OnboardingPage() {
  const { restaurant } = await getUserRestaurant();
  if (restaurant) redirect("/admin");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-[42px] font-bold leading-tight">
        Votre restaurant
      </h1>
      <p className="mt-2 text-ardoise-mid">
        Deux champs et c&apos;est parti. Tout reste modifiable ensuite.
      </p>
      <OnboardingForm />
    </div>
  );
}
