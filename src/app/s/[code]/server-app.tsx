"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import type { SessionMenu } from "@/lib/types";

/* Mode serveur (mobile du personnel, accès par code-URL).
   - Liste : plats prêts à servir, commandes gardées à lancer, grille des tables.
   - Commande : prise de commande pour une table, avec choix "envoyer" ou
     "garder pour plus tard" (coursing : entrées d'abord, plats à la suite).
   - Addition : total de la table + partage en parts égales. */

export type ServerTable = {
  id: string;
  label: string;
  seats: number;
  session_token: string | null;
};
type OrderLite = {
  id?: string;
  order_number: number;
  table_label: string;
  items: { name: string; qty: number }[];
};
export type ServerBoard = {
  restaurant_name: string;
  tables: ServerTable[];
  ready: OrderLite[];
  held: OrderLite[];
};
type Bill = {
  table_label: string;
  total_cents: number;
  lines: { name: string; qty: number; unit_price_cents: number }[];
};

type CartLine = { id: string; name: string; price_cents: number; qty: number };
type View =
  | { kind: "list" }
  | { kind: "order"; table: ServerTable; token: string; menu: SessionMenu }
  | { kind: "bill"; table: ServerTable; bill: Bill };

export default function ServerApp({
  code,
  initial,
}: {
  code: string;
  initial: ServerBoard;
}) {
  const [board, setBoard] = useState<ServerBoard>(initial);
  const [view, setView] = useState<View>({ kind: "list" });
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [split, setSplit] = useState(2);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc("server_board", { p_code: code });
    if (data) setBoard(data as ServerBoard);
  }, [code]);

  useEffect(() => {
    if (view.kind !== "list") return; // pas de polling hors de la liste
    const interval = setInterval(() => void refresh(), 5000);
    return () => clearInterval(interval);
  }, [refresh, view.kind]);

  async function openOrder(table: ServerTable) {
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
      setCart({});
      setView({ kind: "order", table, token, menu: menu as SessionMenu });
    } catch {
      setMsg("Impossible d'ouvrir cette table. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function openBill(table: ServerTable) {
    setBusy(true);
    setMsg(null);
    try {
      const supabase = createClient();
      const { data } = await supabase.rpc("table_bill", {
        p_code: code,
        p_table_id: table.id,
      });
      if (!data) throw new Error("no bill");
      setSplit(Math.max(table.seats, 2));
      setView({ kind: "bill", table, bill: data as Bill });
    } catch {
      setMsg("Addition indisponible.");
    } finally {
      setBusy(false);
    }
  }

  async function releaseHeld(orderId: string) {
    const supabase = createClient();
    setBoard((prev) => ({
      ...prev,
      held: prev.held.filter((o) => o.id !== orderId),
    }));
    await supabase.rpc("server_release_order", {
      p_code: code,
      p_order_id: orderId,
    });
    void refresh();
  }

  function adjust(
    item: { id: string; name: string; price_cents: number | null },
    delta: number
  ) {
    setCart((prev) => {
      const existing =
        prev[item.id] ??
        {
          id: item.id,
          name: item.name,
          price_cents: item.price_cents ?? 0, // formule = 0 dans le total indicatif
          qty: 0,
        };
      const qty = Math.min(Math.max(existing.qty + delta, 0), 20);
      const next = { ...prev, [item.id]: { ...existing, qty } };
      if (qty === 0) delete next[item.id];
      return next;
    });
  }

  const lines = Object.values(cart);
  const total = lines.reduce((s, l) => s + l.price_cents * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  function send(hold: boolean) {
    if (view.kind !== "order" || count === 0) return;
    // Garde-fou : 0 € = plats de menu pris sans la formule. On bloque l'envoi.
    if (total === 0) {
      setMsg(
        "Total à 0 € : ajoutez la formule (Menu…) avant d'envoyer, sinon rien ne sera facturé."
      );
      return;
    }
    const token = view.token;
    setBusy(true);
    setMsg(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("place_order", {
        p_token: token,
        p_items: lines.map((l) => ({ id: l.id, qty: l.qty })),
        p_customer_name: "Service",
        p_note: null,
        p_hold: hold,
      });
      setBusy(false);
      const res = data as { error?: string; order_number?: number } | null;
      if (res?.error || !res) {
        setMsg("Échec de l'envoi. Vérifiez la connexion et réessayez.");
        return;
      }
      setMsg(
        hold
          ? `Commande #${res.order_number} gardée (à lancer plus tard).`
          : `Commande #${res.order_number} envoyée en cuisine.`
      );
      setCart({});
      setView({ kind: "list" });
      void refresh();
    });
  }

  // ---- Vue addition ----
  if (view.kind === "bill") {
    const perHead = split > 0 ? Math.ceil(view.bill.total_cents / split) : 0;
    return (
      <main className="flex-1">
        <header className="flex items-center justify-between bg-ardoise-deep px-5 py-4 text-creme">
          <p className="font-display text-xl font-bold">
            Addition — Table {view.bill.table_label}
          </p>
          <button
            type="button"
            onClick={() => setView({ kind: "list" })}
            className="text-sm text-creme/70 underline underline-offset-[3px]"
          >
            Fermer
          </button>
        </header>
        <div className="mx-auto max-w-md px-5 py-6">
          <ul className="space-y-1 text-[15px]">
            {view.bill.lines.map((l, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {l.qty} × {l.name}
                </span>
                <span className="font-mono text-ardoise-mid">
                  {formatPrice(l.unit_price_cents * l.qty)}
                </span>
              </li>
            ))}
            {view.bill.lines.length === 0 && (
              <li className="text-ardoise-mid">Aucune commande sur cette table.</li>
            )}
          </ul>
          <p className="mt-4 flex justify-between border-t border-ardoise-deep/12 pt-4 text-lg font-semibold">
            <span>Total</span>
            <span className="font-mono">
              {formatPrice(view.bill.total_cents)}
            </span>
          </p>

          <div className="mt-8 rounded-[8px] border border-ardoise-deep/12 bg-craie p-4">
            <p className="font-semibold">Partager en parts égales</p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSplit((n) => Math.max(1, n - 1))}
                className="press flex size-10 items-center justify-center rounded-[4px] border-[1.5px] border-terracotta text-lg font-bold text-terracotta"
              >
                −
              </button>
              <span className="w-10 text-center font-mono text-lg">{split}</span>
              <button
                type="button"
                onClick={() => setSplit((n) => Math.min(50, n + 1))}
                className="press flex size-10 items-center justify-center rounded-[4px] bg-terracotta text-lg font-bold text-craie"
              >
                +
              </button>
              <span className="ml-auto text-right">
                <span className="block text-xs text-ardoise-mid">par personne</span>
                <span className="font-display text-2xl font-bold">
                  {formatPrice(perHead)}
                </span>
              </span>
            </div>
            <p className="mt-2 text-xs text-ardoise-mid">
              Encaissement au comptoir. Arrondi à la part supérieure.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ---- Vue prise de commande ----
  if (view.kind === "order") {
    const currency = view.menu.restaurant.currency;
    return (
      <main className="flex-1 pb-44">
        <header className="flex items-center justify-between bg-ardoise-deep px-5 py-4 text-creme">
          <div>
            <p className="font-display text-xl font-bold">
              Table {view.table.label}
            </p>
            <p className="font-mono text-xs text-terracotta-pale">
              Prise de commande
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView({ kind: "list" })}
            className="text-sm text-creme/70 underline underline-offset-[3px]"
          >
            Fermer
          </button>
        </header>

        {view.menu.categories.map((cat) => (
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
                        {item.price_cents === null
                          ? "formule"
                          : formatPrice(item.price_cents, currency)}
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
          <div className="fixed inset-x-0 bottom-0 z-20 space-y-2 border-t border-ardoise-deep/15 bg-craie p-4">
            {msg && (
              <p className="rounded-[4px] bg-[#a33b2e]/10 px-3 py-2 text-sm font-medium text-[#a33b2e]">
                {msg}
              </p>
            )}
            <div className="flex justify-between font-mono text-sm text-ardoise-mid">
              <span>{count} article{count > 1 ? "s" : ""}</span>
              <span>{formatPrice(total, currency)}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => send(true)}
                disabled={busy}
                className="press h-12 flex-1 rounded-[4px] border-[1.5px] border-terracotta font-semibold text-terracotta disabled:opacity-50"
              >
                Garder
              </button>
              <button
                type="button"
                onClick={() => send(false)}
                disabled={busy}
                className="press h-12 flex-[2] rounded-[4px] bg-terracotta font-semibold text-craie disabled:opacity-50"
              >
                Envoyer en cuisine
              </button>
            </div>
            <p className="text-center text-xs text-ardoise-mid">
              «&nbsp;Garder&nbsp;» = à lancer plus tard (les plats après les entrées).
            </p>
          </div>
        )}
      </main>
    );
  }

  // ---- Vue liste ----
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

        {board.held.length > 0 && (
          <section className="mb-8">
            <h2 className="font-display text-xl font-bold">À envoyer (gardés)</h2>
            <ul className="mt-3 space-y-2">
              {board.held.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-[8px] border border-terracotta/40 bg-terracotta/5 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      Table {o.table_label}{" "}
                      <span className="font-mono text-sm text-ardoise-mid">
                        #{o.order_number}
                      </span>
                    </p>
                    <p className="truncate text-sm text-ardoise-mid">
                      {o.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => o.id && releaseHeld(o.id)}
                    className="press h-10 shrink-0 rounded-[4px] bg-terracotta px-4 text-sm font-semibold text-craie"
                  >
                    Lancer
                  </button>
                </li>
              ))}
            </ul>
          </section>
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
            <div
              key={t.id}
              className={`rounded-[8px] border p-4 ${
                t.session_token
                  ? "border-terracotta bg-terracotta/5"
                  : "border-ardoise-deep/15 bg-craie"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg font-bold">{t.label}</span>
                <span className="text-xs text-ardoise-mid">
                  {t.session_token ? "ouverte" : "fermée"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openOrder(t)}
                  className="press h-9 flex-1 rounded-[4px] bg-terracotta text-sm font-semibold text-craie disabled:opacity-50"
                >
                  Commander
                </button>
                {t.session_token && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openBill(t)}
                    className="press h-9 rounded-[4px] border-[1.5px] border-terracotta px-3 text-sm font-semibold text-terracotta disabled:opacity-50"
                  >
                    Addition
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {board.tables.length === 0 && (
          <p className="mt-4 text-ardoise-mid">Aucune table configurée.</p>
        )}
      </div>
    </main>
  );
}
