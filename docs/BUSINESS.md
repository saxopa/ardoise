# Business — Ardoise

Synthèse du brainstorming fondateur (2026-06-11/12).

## Positionnement

Commande à table + réservations pour **restaurateurs indépendants**, sans
commission, sans matériel imposé. Anti-TheFork (pas de marketplace qui
capte la relation client), anti-Lightspeed (pas d'usine à gaz à 200 €/mois).

## Marchés cibles (dans l'ordre)

1. **Guyane** — réseau Ponti'Com existant, concurrence quasi nulle
   (Zenchef/TheFork absents), coût d'acquisition bas. Attention : ne pas
   démarcher les clients de Johan / Priv Studio.
2. **Bordeaux** — 2ᵉ densité de restaurants de France (1/103 hab.),
   indépendants majoritaires, taille humaine.
3. **Toulouse** — plan B (Alexis sur place, 1/147 hab.).
4. **Paris : non** — saturé, coût d'acquisition létal.

## Modèle

Abonnement mensuel (MRR), pas de vente one-shot :

| Offre | Prix indicatif | Contenu |
|---|---|---|
| Essentiel | 49 €/mois | QR + commande + écran cuisine |
| Complet | 89 €/mois | + réservations + page publique |
| Premium | 129 €/mois | + paiement en ligne Stripe + support prioritaire |

Argument de vente n°1 : **zéro commission** (TheFork prend ~2 €/couvert),
l'outil est rentabilisé dès ~30 couverts/mois économisés.

## Inspirations produit (open source étudié)

- [TastyIgniter](https://github.com/tastyigniter/TastyIgniter) (3.3k ⭐, Laravel) —
  référence fonctionnelle (ordering + reservation + statuts), pas forké
  (PHP, architecture datée) mais data model inspirant.

## Prochaines étapes commerciales

- [ ] Déployer sur un domaine (ardoise.app / ardoise.restaurant ?)
- [ ] Démo vidéo 90 s (parcours QR → cuisine)
- [ ] Pilote gratuit 1 mois chez 2-3 restaurateurs guyanais du réseau
- [ ] Grille tarifaire définitive après retours pilotes
