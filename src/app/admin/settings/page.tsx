import { requireRestaurant } from "@/lib/restaurant";
import { Card } from "@/components/ui";
import SettingsForm from "./settings-form";
import { regenerateStaffCode } from "./actions";

export const metadata = { title: "Réglages — Ardoise" };

export default async function SettingsPage() {
  const { restaurant } = await requireRestaurant();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const accesses = [
    {
      role: "kitchen",
      title: "Écran cuisine",
      desc: "À ouvrir sur la tablette en cuisine. Affiche les commandes en temps réel, sans accès aux réglages ni au chiffre.",
      url: `${appUrl}/k/${restaurant.kitchen_code}`,
    },
    {
      role: "server",
      title: "Mode serveur",
      desc: "Sur le mobile des serveurs. Ouvrir une table, prendre une commande, voir les plats prêts. Rien d'autre.",
      url: `${appUrl}/s/${restaurant.server_code}`,
    },
  ];

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

      {/* Accès équipe par lien — pas de mot de passe patron à partager */}
      <h2 className="mt-12 font-display text-xl font-bold">Accès équipe</h2>
      <p className="mt-1 text-[15px] text-ardoise-mid">
        Ces liens donnent un accès limité, sans votre mot de passe. Gardez-les
        internes ; régénérez si un lien fuite.
      </p>
      <div className="mt-4 space-y-4">
        {accesses.map((a) => (
          <Card key={a.role}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-semibold">{a.title}</h3>
                <p className="mt-0.5 text-sm text-ardoise-mid">{a.desc}</p>
                <a
                  href={a.url}
                  target="_blank"
                  className="mt-2 block truncate font-mono text-sm text-terracotta underline underline-offset-[3px]"
                >
                  {a.url}
                </a>
              </div>
              <form action={regenerateStaffCode}>
                <input type="hidden" name="role" value={a.role} />
                <button
                  type="submit"
                  className="whitespace-nowrap text-sm text-ardoise-mid underline underline-offset-[3px] hover:text-encre"
                >
                  Régénérer
                </button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
