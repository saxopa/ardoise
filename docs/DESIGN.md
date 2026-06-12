# Design — Ardoise

Brief issu d'une recherche dédiée « anti AI-slop » (juin 2026). Objectif :
**bistrot moderne chaleureux**, jamais corporate-tech, jamais disco.

## Patterns bannis (AI slop)

- Gradient violet/indigo, glow coloré, glassmorphism systématique
- Héro centré avec badge flottant au-dessus du H1
- Grilles de 3 cards identiques icône+titre+texte
- Inter / Space Grotesk par défaut, emojis dans les headings
- Section fausses stats (« +2000 restaurants »)
- Blanc pur `#FFF`, noir pur `#000`

## Palette (tokens Tailwind v4, `globals.css`)

| Token | Hex | Usage |
|---|---|---|
| `ardoise-deep` | `#2D3A3A` | Sidebar admin, headers sombres, base froide |
| `ardoise-mid` | `#4A5E5E` | Texte secondaire, bordures |
| `ardoise-night` | `#0F1515` | Fond écran cuisine |
| `terracotta` | `#C4623A` | CTA, accents, bordures gauche des plats |
| `terracotta-dark` | `#B0542E` | Hover des CTA |
| `terracotta-pale` | `#E8A98A` | Accents sur fond sombre |
| `creme` | `#F5EDE0` | Fond principal (chaleur papier) |
| `creme-dark` | `#EAD9C5` | Fonds secondaires, notes |
| `encre` | `#1A1F1F` | Texte principal |
| `craie` | `#FAFAF7` | Cards, sections claires |
| `sauge` | `#6B8E6B` | Statuts positifs |

## Typographie

- **Fraunces** (variable, axes SOFT/WONK/opsz) — display, titres, chiffres clés. Clin d'œil à l'ardoise de bistrot.
- **DM Sans** — UI et corps de texte.
- **DM Mono** — prix, numéros de commande, tokens, horaires.
- Échelle : 12 / 14 / 16 / 20 / 28 / 42 / 64 px.

## Règles

- Border-radius : `4px` inputs/boutons/badges, `8px` cards, `0` sur les blocs pleine largeur.
- Une seule ombre : `0 2px 8px rgba(26,31,31,0.08)`. Jamais d'ombre colorée.
- Bordures : ardoise à 12 % d'opacité.
- Boutons : terracotta plein (primaire), bordure terracotta (secondaire), underline (ghost). **Jamais de gradient.**
- Micro-interactions : `scale(0.98)` au clic (`.press`), fade-in 200 ms, transitions 150 ms. Pas de spinners colorés, pas de ripple.

## Décisions de layout

- **Landing** : héro asymétrique 55/45, « ardoise du soir » en CSS pur (clip-path diagonal) à droite — zéro image stock.
- **Menu client** : sticky headers de catégorie sur fond ardoise, plats en lignes avec bordure gauche terracotta 3 px — pas de cards arrondies, pas de tabs horizontaux.
- **Admin** : sidebar fixe 240 px fond ardoise, métriques en Fraunces 42 px — pas de camemberts décoratifs.
- **Cuisine** : fond `#0F1515`, tickets bordure gauche colorée par statut (terracotta = à lancer, sauge = en cours), DM Mono pour les numéros, lisible à 2 m, zéro icône.
