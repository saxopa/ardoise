/**
 * Moteur de tarification PAR COUVERT (par personne) avec formules.
 *
 * Problème résolu : un menu à formule (ex. E+P+D = 29 €) ne doit s'appliquer
 * qu'à UNE personne. Si la mère prend un dessert et la fille entrée+plat, ça
 * ne doit PAS donner un menu complet (29 €) mais 8 € + 25 € = 33 €. La clé :
 * on calcule le prix de chaque couvert séparément, jamais sur le panier global.
 *
 * Pour un couvert, on applique la formule la PLUS avantageuse pour le client
 * parmi celles réellement applicables (le couvert contient au moins un plat de
 * chaque cours requis), et le reste des plats est facturé à la carte. On retire
 * les plats les plus chers couverts par la formule (meilleur prix client).
 */

export type Course = string; // ex. "entree" | "plat" | "dessert" | "autre"

export type PricedItem = {
  name: string;
  course: Course;
  /** Prix à la carte du plat (cents). 0 si non défini. */
  price_cents: number;
};

export type Formula = {
  label: string;
  /** Cours requis (un plat de chacun), ex. ["entree","plat","dessert"]. */
  courses: Course[];
  price_cents: number;
};

export type CoverPricing = {
  total_cents: number;
  /** Libellé de la formule appliquée, ou null si tout est à la carte. */
  applied_formula: string | null;
};

function sumCarte(items: PricedItem[]): number {
  return items.reduce((s, i) => s + i.price_cents, 0);
}

/** Le couvert contient-il au moins un plat de chaque cours requis par la formule ? */
function covers(items: PricedItem[], courses: Course[]): boolean {
  const available = [...items];
  for (const c of courses) {
    const idx = available.findIndex((i) => i.course === c);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

/** Retire un plat (le plus cher) de chaque cours requis ; renvoie le reste. */
function removeCovered(items: PricedItem[], courses: Course[]): PricedItem[] {
  const remaining = [...items];
  for (const c of courses) {
    let bestIdx = -1;
    let bestPrice = -1;
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].course === c && remaining[i].price_cents > bestPrice) {
        bestPrice = remaining[i].price_cents;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) remaining.splice(bestIdx, 1);
  }
  return remaining;
}

/** Prix d'UN couvert : meilleure formule applicable + reste à la carte. */
export function priceCover(
  items: PricedItem[],
  formulas: Formula[]
): CoverPricing {
  if (items.length === 0) return { total_cents: 0, applied_formula: null };

  // Option de base : tout à la carte.
  let best = sumCarte(items);
  let applied: string | null = null;

  for (const f of formulas) {
    if (!covers(items, f.courses)) continue;
    const remaining = removeCovered(items, f.courses);
    const candidate = f.price_cents + sumCarte(remaining);
    if (candidate < best) {
      best = candidate;
      applied = f.label;
    }
  }

  return { total_cents: best, applied_formula: applied };
}

/** Prix d'une table = somme des couverts (chaque couvert tarifé indépendamment). */
export function priceTable(
  covers: PricedItem[][],
  formulas: Formula[]
): { total_cents: number; per_cover: CoverPricing[] } {
  const per_cover = covers.map((c) => priceCover(c, formulas));
  return {
    total_cents: per_cover.reduce((s, c) => s + c.total_cents, 0),
    per_cover,
  };
}
