import { createAnonClient } from "@/lib/supabase/server";
import type { SessionMenu } from "@/lib/types";
import MenuClient from "./menu-client";

export const metadata = { title: "La carte — Ardoise" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TablePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let menu: SessionMenu | null = null;
  if (UUID_RE.test(token)) {
    const supabase = createAnonClient();
    const { data } = await supabase.rpc("get_session_menu", { p_token: token });
    menu = data as SessionMenu | null;
  }

  if (!menu) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-display text-[28px] font-bold">
          Cette table n&apos;est plus active
        </h1>
        <p className="mt-3 max-w-sm text-ardoise-mid">
          La session de commande a expiré ou a été clôturée par
          l&apos;établissement. Adressez-vous au personnel en salle.
        </p>
      </main>
    );
  }

  return <MenuClient token={token} menu={menu} />;
}
