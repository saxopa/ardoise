import { createAnonClient } from "@/lib/supabase/server";
import KitchenCodeBoard, { type KitchenData } from "./kitchen-code-board";

export const metadata = { title: "Cuisine — Ardoise" };
export const dynamic = "force-dynamic";

export default async function KitchenCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const supabase = createAnonClient();
  const { data } = await supabase.rpc("kitchen_board", { p_code: code });
  const board = data as KitchenData | null;

  if (!board) {
    return (
      <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-ardoise-night px-6 text-center text-creme">
        <h1 className="font-display text-[28px] font-bold">Accès cuisine invalide</h1>
        <p className="mt-3 text-creme/60">
          Ce lien cuisine n&apos;est plus valide. Demandez le lien à jour au
          responsable.
        </p>
      </main>
    );
  }

  return <KitchenCodeBoard code={code} initial={board} />;
}
