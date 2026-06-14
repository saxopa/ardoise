/**
 * Parseur tolérant pour l'import de carte via IA.
 * Le client colle la réponse brute d'une IA (ChatGPT/Gemini/Claude) — souvent
 * polluée par du texte, des ```fences```, des virgules en trop, des clés en
 * français… On récupère quand même une carte propre. Utilisé côté client
 * (aperçu) ET côté serveur (revalidation avant insertion).
 */

export type ParsedItem = {
  name: string;
  description: string;
  price_cents: number;
};
export type ParsedCategory = { name: string; items: ParsedItem[] };
export type ParseResult = {
  categories: ParsedCategory[];
  ignored: number;
  error: string | null;
};

const MAX_CATEGORIES = 40;
const MAX_ITEMS_PER_CATEGORY = 80;

function toCents(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value >= 0 && value <= 100000 ? Math.round(value * 100) : null;
  }
  if (typeof value !== "string") return null;
  // "12,50 €" / "12.5€" / "€12" → 12.5
  const cleaned = value.replace(/[^0-9.,]/g, "").replace(",", ".");
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0 || n > 100000) return null;
  return Math.round(n * 100);
}

function firstString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function parseMenuJson(raw: string): ParseResult {
  if (!raw || !raw.trim()) {
    return { categories: [], ignored: 0, error: "Collez d'abord la réponse de l'IA." };
  }

  let txt = raw.trim();
  // Retirer les blocs markdown ```json … ```
  txt = txt.replace(/```[a-zA-Z]*/g, "").trim();
  // Garder du premier { (ou [) au dernier } (ou ])
  const start = Math.min(
    ...[txt.indexOf("{"), txt.indexOf("[")].filter((i) => i >= 0)
  );
  const end = Math.max(txt.lastIndexOf("}"), txt.lastIndexOf("]"));
  if (Number.isFinite(start) && end > start) txt = txt.slice(start, end + 1);
  // Virgules en trop avant } ou ]
  txt = txt.replace(/,(\s*[}\]])/g, "$1");

  let data: unknown;
  try {
    data = JSON.parse(txt);
  } catch {
    return {
      categories: [],
      ignored: 0,
      error:
        "Le texte collé n'est pas lisible. Recopiez bien TOUTE la réponse de l'IA, puis réessayez.",
    };
  }

  const obj = data as Record<string, unknown>;
  const rawCats = Array.isArray(data)
    ? data
    : (obj.categories ??
        obj["catégories"] ??
        obj.menu ??
        obj.carte ??
        obj.categorie);
  if (!Array.isArray(rawCats)) {
    return {
      categories: [],
      ignored: 0,
      error:
        "Format non reconnu. Vérifiez que l'IA a bien répondu uniquement avec le menu.",
    };
  }

  let ignored = 0;
  const categories: ParsedCategory[] = [];

  for (const c of rawCats.slice(0, MAX_CATEGORIES)) {
    const cat = c as Record<string, unknown>;
    const name = firstString(
      cat.name,
      cat.nom,
      cat.titre,
      cat.categorie,
      cat["catégorie"]
    ).slice(0, 60);
    const rawItems =
      cat.items ?? cat.plats ?? cat.dishes ?? cat.produits ?? cat.articles;
    if (!name || !Array.isArray(rawItems)) {
      ignored++;
      continue;
    }

    const items: ParsedItem[] = [];
    for (const it of rawItems.slice(0, MAX_ITEMS_PER_CATEGORY)) {
      const item = it as Record<string, unknown>;
      const iName = firstString(item.name, item.nom, item.titre, item.plat).slice(
        0,
        100
      );
      const cents = toCents(
        item.price ?? item.prix ?? item.tarif ?? item.amount ?? item.montant
      );
      if (!iName || cents === null) {
        ignored++;
        continue;
      }
      const description = firstString(
        item.description,
        item.desc,
        item["détail"],
        item.detail
      ).slice(0, 400);
      items.push({ name: iName, description, price_cents: cents });
    }

    if (items.length > 0) categories.push({ name, items });
    else ignored++;
  }

  if (categories.length === 0) {
    return {
      categories: [],
      ignored,
      error:
        "Aucun plat n'a pu être détecté. Vérifiez que l'IA a bien listé la carte.",
    };
  }
  return { categories, ignored, error: null };
}

/** Prompt prêt à copier que le client donnera à l'IA avec la photo de sa carte. */
export const MENU_IMPORT_PROMPT = `Voici la carte de mon restaurant (en photo ci-jointe, ou en texte ci-dessous).

Liste TOUS les plats et boissons que tu y vois. Réponds UNIQUEMENT avec un JSON valide, sans aucun texte avant ni après, en respectant EXACTEMENT ce format :

{
  "categories": [
    {
      "name": "Entrées",
      "items": [
        { "name": "Salade César", "description": "Poulet, parmesan, croûtons", "price": 9.5 }
      ]
    }
  ]
}

Règles importantes :
- "price" est un nombre en euros, sans le symbole € (exemple : 12.5).
- Si un plat n'a pas de description, mets "description": "".
- Regroupe les plats par catégorie selon la carte (Entrées, Plats, Desserts, Boissons, etc.).
- N'invente rien : recopie fidèlement ce qui est sur la carte.`;
