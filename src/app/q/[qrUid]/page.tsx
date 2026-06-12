import { redirect } from "next/navigation";
import { createAnonClient } from "@/lib/supabase/server";

/* QR statique : imprimé une seule fois, collé sur la table.
   Résolution serveur à chaque scan → session active du moment, ou page
   « table fermée ». Jamais de cache : l'état change au fil du service. */

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type QrResolution = {
  restaurant_name: string;
  table_label: string;
  session_token: string | null;
};

export default async function QrEntryPage({
  params,
}: {
  params: Promise<{ qrUid: string }>;
}) {
  const { qrUid } = await params;

  let resolution: QrResolution | null = null;
  if (UUID_RE.test(qrUid)) {
    const supabase = createAnonClient();
    const { data } = await supabase.rpc("resolve_table_qr", {
      p_qr_uid: qrUid,
    });
    resolution = data as QrResolution | null;
  }

  if (resolution?.session_token) {
    redirect(`/t/${resolution.session_token}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-display text-[28px] font-bold">
        {resolution
          ? `${resolution.restaurant_name} — table ${resolution.table_label}`
          : "Table introuvable"}
      </h1>
      <p className="mt-3 max-w-sm leading-relaxed text-ardoise-mid">
        {resolution
          ? "Cette table n'est pas encore ouverte à la commande. Adressez-vous au personnel en salle, qui activera la table pour vous."
          : "Ce QR code ne correspond à aucune table active."}
      </p>
    </main>
  );
}
