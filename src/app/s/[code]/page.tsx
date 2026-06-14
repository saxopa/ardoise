import { createAnonClient } from "@/lib/supabase/server";
import ServerApp, { type ServerBoard } from "./server-app";

export const metadata = { title: "Service — Ardoise" };
export const dynamic = "force-dynamic";

export default async function ServerPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const supabase = createAnonClient();
  const { data } = await supabase.rpc("server_board", { p_code: code });
  const board = data as ServerBoard | null;

  if (!board) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-display text-[28px] font-bold">Accès serveur invalide</h1>
        <p className="mt-3 text-ardoise-mid">
          Ce lien serveur n&apos;est plus valide. Demandez le lien à jour au
          responsable.
        </p>
      </main>
    );
  }

  return <ServerApp code={code} initial={board} />;
}
