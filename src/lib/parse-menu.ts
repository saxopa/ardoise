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
  /** null = plat sans prix unitaire (menu à formule). */
  price_cents: number | null;
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
      // Le prix est OPTIONNEL : un plat sans prix (menu à formule) reste valide.
      const cents = toCents(
        item.price ?? item.prix ?? item.tarif ?? item.amount ?? item.montant
      );
      if (!iName) {
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
export const MENU_IMPORT_PROMPT = `Tu aides un restaurateur à importer sa carte dans l'application "Ardoise". Voici comment Ardoise fonctionne — respecte-le scrupuleusement.

COMMENT ARDOISE FONCTIONNE :
1. Une carte = des catégories (Entrées, Plats, Desserts, Boissons, Formules…), chacune contenant des plats.
2. Chaque plat a : un nom, une description (facultative) et un prix en euros (facultatif).
3. Le prix est FACULTATIF. Si un plat n'a pas de prix affiché sur la carte (menu du jour, ardoise à formule…), mets "price": null. N'invente JAMAIS un prix.
4. Les menus et formules (ex : "Menu du jour Entrée+Plat+Dessert à 24€") sont des plats à part entière, à placer dans une catégorie "Formules" AVEC leur prix.
5. Important : Ardoise ne relie pas automatiquement un plat choisi à sa formule. Donc pour un menu à formule, on crée la formule avec son prix d'un côté, et on liste les plats sans prix de l'autre. À la commande, c'est le serveur qui associe le tout.

AVANT DE RÉPONDRE :
- Si la carte est simple (chaque plat a son propre prix), donne directement le JSON, sans rien autour.
- Si la carte est particulière (menu à formule, prix groupés, plats sans prix individuel, ambiguïté), commence par 2-3 phrases SIMPLES et SANS JARGON pour expliquer au restaurateur comment tu vas l'organiser dans Ardoise et pourquoi — puis donne le JSON juste après.

FORMAT EXACT (JSON valide) :
{
  "categories": [
    {
      "name": "Entrées",
      "items": [
        { "name": "Salade César", "description": "Poulet, parmesan, croûtons", "price": 9.5 }
      ]
    },
    {
      "name": "Formules",
      "items": [
        { "name": "Menu du jour E+P+D", "description": "Entrée + Plat + Dessert", "price": 24 }
      ]
    }
  ]
}

RÈGLES DE SORTIE :
- "price" : nombre en euros sans le symbole € (ex : 12.5), ou null si absent.
- "description" : "" si aucune.
- Recopie fidèlement la carte, n'invente rien.
- Le JSON doit être pur : pas de Markdown ni de caractères spéciaux à l'intérieur.`;
