"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { MENU_IMPORT_PROMPT, parseMenuJson } from "@/lib/parse-menu";
import { importMenu, type ImportState } from "./actions";

const AI_LINKS = [
  { name: "ChatGPT", url: "https://chatgpt.com" },
  { name: "Gemini", url: "https://gemini.google.com/app" },
  { name: "Claude", url: "https://claude.ai/new" },
];

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[56px_1fr]">
      <span className="font-display text-[42px] font-bold leading-none text-terracotta">
        {n}
      </span>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

export default function ImportClient() {
  const [raw, setRaw] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importMenu,
    { error: null, imported: 0, categories: 0 }
  );

  const preview = useMemo(() => parseMenuJson(raw), [raw]);
  const itemCount = preview.categories.reduce(
    (s, c) => s + c.items.length,
    0
  );
  const ready = raw.trim().length > 0 && !preview.error && itemCount > 0;

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(MENU_IMPORT_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* le bloc reste sélectionnable manuellement */
    }
  }

  if (state.imported > 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="animate-fade-in border-l-[3px] border-sauge">
          <h1 className="font-display text-[28px] font-bold">Carte importée 🎉</h1>
          <p className="mt-2 text-ardoise-mid">
            {state.imported} plat{state.imported > 1 ? "s" : ""} ajouté
            {state.imported > 1 ? "s" : ""} dans {state.categories} catégorie
            {state.categories > 1 ? "s" : ""}. Vous pouvez maintenant les
            relire, ajouter des photos ou corriger les prix.
          </p>
          <Link href="/admin/menu" className="mt-6 inline-block">
            <Button>Voir ma carte</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-[28px] font-bold md:text-[42px]">
        Importer votre carte
      </h1>
      <p className="mt-2 text-ardoise-mid">
        Pas besoin de tout retaper. Une intelligence artificielle lit la photo
        de votre carte pour vous. Suivez les étapes — c&apos;est gratuit et ça
        prend 2 minutes.
      </p>

      <div className="mt-10 space-y-10">
        <Step n={1} title="Prenez votre carte en photo">
          <p className="text-[15px] text-ardoise-mid">
            Avec votre téléphone, photographiez votre carte (une ou plusieurs
            photos si elle est longue). Une photo nette et bien lisible.
          </p>
        </Step>

        <Step n={2} title="Ouvrez une intelligence artificielle gratuite">
          <p className="text-[15px] text-ardoise-mid">
            Cliquez sur l&apos;une de ces trois (créez un compte gratuit si on
            vous le demande) :
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {AI_LINKS.map((ai) => (
              <a
                key={ai.name}
                href={ai.url}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex h-11 items-center rounded-[4px] border-[1.5px] border-terracotta px-5 font-semibold text-terracotta hover:bg-terracotta/5"
              >
                {ai.name} ↗
              </a>
            ))}
          </div>
        </Step>

        <Step n={3} title="Copiez ce message et envoyez-le avec votre photo">
          <p className="text-[15px] text-ardoise-mid">
            Collez ce message dans l&apos;IA, ajoutez votre photo de carte, et
            envoyez.
          </p>
          <div className="mt-3 rounded-[8px] border border-ardoise-deep/12 bg-craie p-4">
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-encre">
              {MENU_IMPORT_PROMPT}
            </pre>
          </div>
          <Button
            type="button"
            variant={copied ? "secondary" : "primary"}
            onClick={copyPrompt}
            className="mt-3"
          >
            {copied ? "Message copié ✓" : "Copier le message"}
          </Button>
        </Step>

        <Step n={4} title="Collez la réponse de l'IA ici">
          <p className="text-[15px] text-ardoise-mid">
            Copiez toute la réponse de l&apos;IA et collez-la dans le cadre
            ci-dessous. Si votre carte est particulière (menu du jour, formules…),
            l&apos;IA vous donnera peut-être d&apos;abord un petit conseil&nbsp;:
            lisez-le, puis collez quand même toute sa réponse — on fait le ménage.
          </p>
          <form action={formAction} className="mt-3">
            <textarea
              name="raw"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={6}
              placeholder="Collez ici la réponse de l'IA…"
              className="w-full rounded-[4px] border border-ardoise-deep/15 bg-craie px-3 py-2.5 font-mono text-[13px] text-encre outline-none focus:border-terracotta"
            />

            {/* Aperçu en direct */}
            {raw.trim() && preview.error && (
              <p className="mt-3 rounded-[4px] bg-[#a33b2e]/10 px-3 py-2 text-sm font-medium text-[#a33b2e]">
                {preview.error}
              </p>
            )}
            {ready && (
              <div className="mt-4 animate-fade-in rounded-[8px] border border-sauge/40 bg-sauge/10 p-4">
                <p className="font-semibold text-[#4a6b4a]">
                  {itemCount} plat{itemCount > 1 ? "s" : ""} détecté
                  {itemCount > 1 ? "s" : ""} dans {preview.categories.length}{" "}
                  catégorie{preview.categories.length > 1 ? "s" : ""}
                  {preview.ignored > 0
                    ? ` · ${preview.ignored} ligne(s) incomplète(s) ignorée(s)`
                    : ""}
                </p>
                <div className="mt-3 max-h-56 space-y-3 overflow-y-auto">
                  {preview.categories.map((cat, ci) => (
                    <div key={ci}>
                      <p className="font-display font-bold">{cat.name}</p>
                      <ul className="mt-1 space-y-0.5 text-sm">
                        {cat.items.map((it, ii) => (
                          <li key={ii} className="flex justify-between gap-3">
                            <span className="truncate">{it.name}</span>
                            <span className="shrink-0 font-mono text-ardoise-mid">
                              {it.price_cents === null
                                ? "—"
                                : formatPrice(it.price_cents)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.error && (
              <p className="mt-3 rounded-[4px] bg-[#a33b2e]/10 px-3 py-2 text-sm font-medium text-[#a33b2e]">
                {state.error}
              </p>
            )}

            <div className="mt-4 flex items-center gap-4">
              <Button type="submit" disabled={!ready || pending}>
                {pending
                  ? "Import en cours…"
                  : ready
                    ? `Importer ${itemCount} plat${itemCount > 1 ? "s" : ""}`
                    : "Importer ma carte"}
              </Button>
              <Link
                href="/admin/menu"
                className="text-sm text-ardoise-mid underline underline-offset-[3px] hover:text-encre"
              >
                Retour à la carte
              </Link>
            </div>
            <p className="mt-2 text-xs text-ardoise-mid">
              Les plats sont ajoutés à votre carte actuelle (rien n&apos;est
              supprimé). Vous pourrez tout relire et corriger ensuite.
            </p>
          </form>
        </Step>
      </div>
    </div>
  );
}
