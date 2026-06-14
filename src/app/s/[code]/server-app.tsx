"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import type { SessionMenu } from "@/lib/types";

/* Mode serveur (mobile du personnel, accès par code-URL).
   - Vue liste : plats prêts à servir + grille des tables.
   - Vue commande : prise de commande pour une table (le serveur commande
     à la place d'un client sans smartphone). Réutilise get_session_menu +
     place_order via le token de session. Polling 5s pour les plats prêts. */

export type ServerTable = {
  id: string;
  label: string;
  seats: number;
  session_token: string | null;
};
export type ReadyOrder = {
  order_number: number;
  table_label: string;
  items: { name: string; qty: number }[];
};
export type ServerBoard = {
  restaurant_name: string;
  tables: ServerTable[];
  ready: ReadyOrder[];
};

type CartLine = { id: string; name: string; price_cents: number; qty: number };

export default function ServerApp({
  code,
  initial,
}: {
  code: string;
  initial: ServerBoard;
}) {
  const [board, setBoard] = useState<ServerBoard>(initial);
  const [active, setActive] = useState<{
    table: ServerTable;
    token: string;
    menu: SessionMenu;
  } | null>(null);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc("server_board", { p_code: code });
    if (data) setBoard(data as ServerBoard);
  }, [code]);

  useEffect(() => {
    if (active) return; // pas de polling pendant la prise de commande
    const interval = setInterval(() => void refresh(), 5000);
    return () => clearInterval(interval);
  }, [refresh, active]);

  async function openTable(table: ServerTable) {
    setBusy(true);
    setMsg(null);
    try {
      const supabase = createClient();
      let token = table.session_token;
      if (!token) {
        const { data } = await supabase.rpc("server_open_table", {
          p_code: code,
          p_table_id: table.id,
        });
        token = (data as { token?: string } | null)?.token ?? null;
      }
      if (!token) throw new Error("no token");
      const { data: menu } = await supabase.rpc("get_session_menu", {
        p_token: token,
      });
      if (!menu) throw new Error("no menu");
      setActive({ table, token, menu: menu as SessionMenu });
      setCart({});
    } catch {
      setMsg("Impossible d'ouvrir cette table. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  function adjust(
    item: { id: string; name: string; price_cents: number },
    delta: number
  ) {
    setCart((prev) => {
      const existing = prev[item.id] ?? { ...item, qty: 0 };
      const qty = Math.min(Math.max(existing.qty + delta, 0), 20);
      const next = { ...prev, [item.id]: { ...existing, qty } };
      if (qty === 0) delete next[item.id];
      return next;
    });
  }

  const lines = Object.values(cart);
  const total = lines.reduce((s, l) => s + l.price_cents * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  function send() {
    if (!active || count === 0) return;
    setBusy(true);
    setMsg(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("place_order", {
        p_token: active.token,
        p_items: lines.map((l) => ({ id: l.id, qty: l.qty })),
        p_customer_name: "Service",
        p_note: null,
      });
      setBusy(false);
      const res = data as { error?: string; order_number?: number } | null;
      if (res?.error || !res) {
        setMsg("Échec de l'envoi. Vérifiez la connexion et réessayez.");
        return;
      }
      setMsg(`Commande #${res.order_number} envoyée en cuisine.`);
      setCart({});
      setActive(null);
      void refresh();
    });
  }

  const currency = active?.menu.restaurant.currency ?? "EUR";

  // ---- Vue prise de commande ----
  if (active) {
    return (
      <main className="flex-1 pb-40">
        <header className="flex items-center justify-between bg-ardoise-deep px-5 py-4 text-creme">
          <div>
            <p className="font-display text-xl font-bold">
              Table {active.table.label}
            </p>
            <p className="font-mono text-xs text-terracotta-pale">
              Prise de commande
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActive(null)}
            className="text-sm text-creme/70 underline underline-offset-[3px]"
          >
            Fermer
          </button>
        </header>

        {active.menu.categories.map((cat) => (
          <section key={cat.id}>
            <h2 className="sticky top-0 z-10 bg-ardoise-deep px-5 py-2 font-display text-base font-semibold text-terracotta-pale">
              {cat.name}
            </h2>
            <ul className="px-5">
              {cat.items.map((item) => {
                const qty = cart[item.id]?.qty ?? 0;
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-l-[3px] border-terracotta py-3 pl-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{item.name}</p>
                      <span className="font-mono text-sm text-ardoise-mid">
                        {formatPrice(item.price_cents, currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {qty > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => adjust(item, -1)}
                            className="press flex size-9 items-center justify-center rounded-[4px] border-[1.5px] border-terracotta text-lg font-bold text-terracotta"
                          >
                            −
                          </button>
                          <span className="w-5 text-center font-mono">{qty}</span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => adjust(item, 1)}
                        className="press flex size-9 items-center justify-center rounded-[4px] bg-terracotta text-lg font-bold text-craie"
                      >
                        +
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {count > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ardoise-deep/15 bg-craie p-4">
            <button
              type="button"
              onClick={send}
              disabled={busy}
              className="press flex h-13 w-full items-center justify-between rounded-[4px] bg-terracotta px-5 py-3.5 font-semibold text-craie disabled:opacity-50"
            >
              <span>Envoyer en cuisine ({count})</span>
              <span className="font-mono">{formatPrice(total, currency)}</span>
            </button>
          </div>
        )}
      </main>
    );
  }

  // ---- Vue liste (tables + plats prêts) ----
  return (
    <main className="flex-1">
      <header className="bg-ardoise-deep px-5 py-6 text-creme">
        <h1 className="font-display text-[28px] font-bold">
          {board.restaurant_name}
        </h1>
        <p className="font-mono text-sm text-terracotta-pale">Mode serveur</p>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-6">
        {msg && (
          <p className="mb-4 rounded-[4px] bg-sauge/15 px-3 py-2 text-sm font-medium text-[#4a6b4a]">
            {msg}
          </p>
        )}

        {board.ready.length > 0 && (
          <section className="mb-8">
            <h2 className="font-display text-xl font-bold">À servir</h2>
            <ul className="mt-3 space-y-2">
              {board.ready.map((o, i) => (
                <li
                  key={i}
                  className="rounded-[8px] border border-sauge/40 bg-sauge/10 p-3"
                >
                  <p className="font-semibold">
                    Table {o.table_label}{" "}
                    <span className="font-mono text-sm text-ardoise-mid">
                      #{o.order_number}
                    </span>
                  </p>
                  <p className="text-sm text-ardoise-mid">
                    {o.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <h2 className="font-display text-xl font-bold">Tables</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {board.tables.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={busy}
              onClick={() => openTable(t)}
              className={`press flex flex-col items-start rounded-[8px] border p-4 text-left disabled:opacity-50 ${
                t.session_token
                  ? "border-terracotta bg-terracotta/5"
                  : "border-ardoise-deep/15 bg-craie"
              }`}
            >
              <span className="font-display text-lg font-bold">{t.label}</span>
              <span className="text-xs text-ardoise-mid">
                {t.session_token ? "ouverte" : "fermée"} · {t.seats} cv
              </span>
            </button>
          ))}
        </div>
        {board.tables.length === 0 && (
          <p className="mt-4 text-ardoise-mid">Aucune table configurée.</p>
        )}
      </div>
    </main>
  );
}
