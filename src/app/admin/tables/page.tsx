import { requireRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";
import type { DiningTable, TableSession } from "@/lib/types";
import { Button, Card, Input, Label } from "@/components/ui";
import { closeSession, createTable, deleteTable, openSession } from "./actions";
import QrCard from "./qr-card";

export const metadata = { title: "Tables & QR — Ardoise" };

export default async function TablesPage() {
  const { restaurant } = await requireRestaurant();
  const supabase = await createClient();

  const [{ data: tables }, { data: sessions }] = await Promise.all([
    supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("label"),
    supabase
      .from("table_sessions")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString()),
  ]);

  const allTables = (tables ?? []) as DiningTable[];
  const activeSessions = (sessions ?? []) as TableSession[];
  const sessionByTable = new Map(activeSessions.map((s) => [s.table_id, s]));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-[28px] font-bold md:text-[42px]">
        Tables &amp; QR codes
      </h1>
      <p className="mt-2 max-w-2xl text-ardoise-mid">
        Chaque session génère un lien unique et temporaire. Une table libérée
        («&nbsp;Clore&nbsp;») ne peut plus recevoir de commande — même si le
        client a gardé l&apos;adresse. Réimprimez le QR à chaque nouvelle
        session.
      </p>

      <Card className="mt-8">
        <form action={createTable} className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="label">Nouvelle table</Label>
            <Input
              id="label"
              name="label"
              placeholder="12, T3, Terrasse 1…"
              maxLength={20}
              required
              className="w-44"
            />
          </div>
          <div>
            <Label htmlFor="seats">Couverts</Label>
            <Input
              id="seats"
              name="seats"
              type="number"
              min={1}
              max={50}
              defaultValue={2}
              className="w-24"
            />
          </div>
          <Button type="submit" variant="secondary">
            Ajouter
          </Button>
        </form>
      </Card>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {allTables.map((table) => {
          const session = sessionByTable.get(table.id);
          return (
            <Card key={table.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold">
                    Table {table.label}
                  </h2>
                  <p className="text-sm text-ardoise-mid">
                    {table.seats} couverts
                  </p>
                </div>
                <form action={deleteTable}>
                  <input type="hidden" name="id" value={table.id} />
                  <button
                    type="submit"
                    className="text-sm text-[#a33b2e]/70 underline underline-offset-[3px] hover:text-[#a33b2e]"
                  >
                    Supprimer
                  </button>
                </form>
              </div>

              {session ? (
                <div className="mt-4">
                  <QrCard
                    token={session.token}
                    tableLabel={table.label}
                    restaurantName={restaurant.name}
                    expiresAt={session.expires_at}
                  />
                  <form action={closeSession} className="mt-3">
                    <input type="hidden" name="session_id" value={session.id} />
                    <Button type="submit" variant="danger" className="w-full">
                      Clore la session (table libérée)
                    </Button>
                  </form>
                </div>
              ) : (
                <form action={openSession} className="mt-4 space-y-3">
                  <input type="hidden" name="table_id" value={table.id} />
                  <div>
                    <Label>Durée de la session (heures)</Label>
                    <Input
                      name="hours"
                      type="number"
                      min={1}
                      max={24}
                      defaultValue={4}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Ouvrir une session + générer le QR
                  </Button>
                </form>
              )}
            </Card>
          );
        })}
      </div>

      {allTables.length === 0 && (
        <p className="mt-8 text-ardoise-mid">
          Créez votre première table ci-dessus.
        </p>
      )}
    </div>
  );
}
