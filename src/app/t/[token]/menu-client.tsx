"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { SessionMenu } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { placeOrder } from "./actions";

/* Menu client mobile : sticky headers de section sur fond ardoise,
   plats en lignes bordées terracotta — pas de cards arrondies. */

type CartLine = { id: string; name: string; price_cents: number; qty: number };

export default function MenuClient({
  token,
  menu,
}: {
  token: string;
  menu: SessionMenu;
}) {
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [checkout, setCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const storageKey = `ardoise-cart-${token}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      // Restauration localStorage : browser-only, pattern volontaire.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setCart(JSON.parse(saved));
    } catch {
      /* panier corrompu : on repart à vide */
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, storageKey]);

  const lines = useMemo(() => Object.values(cart).filter((l) => l.qty > 0), [cart]);
  const total = lines.reduce((sum, l) => sum + l.price_cents * l.qty, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const currency = menu.restaurant.currency;

  function add(item: { id: string; name: string; price_cents: number }, delta: number) {
    setCart((prev) => {
      const existing = prev[item.id] ?? { ...item, qty: 0 };
      const qty = Math.min(Math.max(existing.qty + delta, 0), 20);
      return { ...prev, [item.id]: { ...existing, qty } };
    });
  }

  /** Retire complètement une ligne du panier. */
  function remove(id: string) {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      // Plus rien dans le panier : on referme le récapitulatif.
      if (Object.values(next).every((l) => l.qty <= 0)) setCheckout(false);
      return next;
    });
  }

  /** Ajuste une ligne depuis le récapitulatif, referme si le panier se vide. */
  function adjustInCart(line: CartLine, delta: number) {
    setCart((prev) => {
      const existing = prev[line.id];
      if (!existing) return prev;
      const qty = Math.min(Math.max(existing.qty + delta, 0), 20);
      const next = { ...prev, [line.id]: { ...existing, qty } };
      if (Object.values(next).every((l) => l.qty <= 0)) setCheckout(false);
      return next;
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await placeOrder(
        token,
        lines.map((l) => ({ id: l.id, qty: l.qty })),
        customerName.trim(),
        note.trim()
      );
      // En cas de succès, placeOrder redirige — on n'arrive ici que sur erreur.
      if (result?.error) setError(result.error);
      else localStorage.removeItem(storageKey);
    });
  }

  return (
    <main className="flex-1 pb-32">
      {/* En-tête table */}
      <header className="bg-ardoise-deep px-5 py-6 text-creme">
        <h1 className="font-display text-[28px] font-bold leading-tight">
          {menu.restaurant.name}
        </h1>
        <p className="mt-1 font-mono text-sm text-terracotta-pale">
          Table {menu.table_label}
        </p>
      </header>

      {!menu.restaurant.ordering_enabled && (
        <p className="mx-5 mt-5 rounded-[4px] bg-creme-dark px-4 py-3 text-[15px]">
          La commande en ligne est momentanément désactivée. Consultez la carte
          et commandez auprès du personnel.
        </p>
      )}

      {/* Carte */}
      {menu.categories.map((cat) => (
        <section key={cat.id}>
          <h2 className="sticky top-0 z-10 bg-ardoise-deep px-5 py-3 font-display text-lg font-semibold text-terracotta-pale">
            {cat.name}
          </h2>
          <ul className="px-5">
            {cat.items.map((item) => {
              const inCart = cart[item.id]?.qty ?? 0;
              return (
                <li
                  key={item.id}
                  className="border-l-[3px] border-terracotta py-4 pl-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug">{item.name}</p>
                      {item.description && (
                        <p className="mt-0.5 text-sm leading-relaxed text-ardoise-mid">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-mono">
                      {formatPrice(item.price_cents, currency)}
                    </span>
                  </div>

                  {menu.restaurant.ordering_enabled && (
                    <div className="mt-2 flex items-center gap-3">
                      {inCart > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => add(item, -1)}
                            className="press flex size-9 items-center justify-center rounded-[4px] border-[1.5px] border-terracotta text-lg font-bold text-terracotta"
                            aria-label="Retirer"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-mono font-medium">
                            {inCart}
                          </span>
                          <button
                            type="button"
                            onClick={() => add(item, 1)}
                            className="press flex size-9 items-center justify-center rounded-[4px] bg-terracotta text-lg font-bold text-craie"
                            aria-label="Ajouter"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => add(item, 1)}
                          className="press h-9 rounded-[4px] border-[1.5px] border-terracotta px-4 text-sm font-semibold text-terracotta transition-colors duration-150 hover:bg-terracotta/5"
                        >
                          Ajouter
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* Barre panier fixe */}
      {count > 0 && menu.restaurant.ordering_enabled && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ardoise-deep/15 bg-craie p-4 shadow-[0_-2px_8px_rgba(26,31,31,0.08)]">
          {!checkout ? (
            <button
              type="button"
              onClick={() => setCheckout(true)}
              className="press flex h-13 w-full items-center justify-between rounded-[4px] bg-terracotta px-5 py-3.5 font-semibold text-craie transition-colors duration-150 hover:bg-terracotta-dark"
            >
              <span>
                Voir ma commande ({count} article{count > 1 ? "s" : ""})
              </span>
              <span className="font-mono">{formatPrice(total, currency)}</span>
            </button>
          ) : (
            <div className="animate-fade-in space-y-3">
              <ul className="max-h-52 space-y-2 overflow-y-auto text-[15px]">
                {lines.map((l) => (
                  <li key={l.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => remove(l.id)}
                      className="press flex size-7 shrink-0 items-center justify-center rounded-[4px] text-ardoise-mid hover:bg-[#a33b2e]/10 hover:text-[#a33b2e]"
                      aria-label={`Retirer ${l.name}`}
                    >
                      ✕
                    </button>
                    <span className="min-w-0 flex-1 truncate">{l.name}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustInCart(l, -1)}
                        className="press flex size-7 items-center justify-center rounded-[4px] border-[1.5px] border-terracotta text-base font-bold leading-none text-terracotta"
                        aria-label="Retirer un"
                      >
                        −
                      </button>
                      <span className="w-5 text-center font-mono">{l.qty}</span>
                      <button
                        type="button"
                        onClick={() => adjustInCart(l, 1)}
                        className="press flex size-7 items-center justify-center rounded-[4px] bg-terracotta text-base font-bold leading-none text-craie"
                        aria-label="Ajouter un"
                      >
                        +
                      </button>
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono">
                      {formatPrice(l.price_cents * l.qty, currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Votre prénom (optionnel)"
                maxLength={60}
                className="h-11 w-full rounded-[4px] border border-ardoise-deep/15 bg-craie px-3 text-[15px] outline-none focus:border-terracotta"
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Allergie, cuisson… (optionnel)"
                maxLength={300}
                className="h-11 w-full rounded-[4px] border border-ardoise-deep/15 bg-craie px-3 text-[15px] outline-none focus:border-terracotta"
              />
              {error && (
                <p className="rounded-[4px] bg-[#a33b2e]/10 px-3 py-2 text-sm font-medium text-[#a33b2e]">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCheckout(false)}
                  className="press h-12 shrink-0 rounded-[4px] border-[1.5px] border-ardoise-mid px-4 font-semibold text-ardoise-mid"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending}
                  className="press h-12 flex-1 rounded-[4px] bg-terracotta font-semibold text-craie transition-colors duration-150 hover:bg-terracotta-dark disabled:opacity-50"
                >
                  {pending
                    ? "Envoi…"
                    : `Commander — ${formatPrice(total, currency)}`}
                </button>
              </div>
              <p className="text-center text-xs text-ardoise-mid">
                Paiement au comptoir ou auprès du personnel.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
