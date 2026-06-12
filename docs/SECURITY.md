# Sécurité — Ardoise

## Modèle de menace principal

**« Je scanne le QR au restaurant, je rentre chez moi, je spamme des commandes. »**

Contre-mesures, par couche :

| Couche | Mesure | Où |
|---|---|---|
| Session | Token UUID v4 (128 bits, non énumérable) par table | `table_sessions.token` |
| Session | Expiration automatique (défaut 4 h, max 24 h) | `expires_at`, vérifié dans chaque RPC |
| Session | Clôture manuelle par le staff → token définitivement mort | `status='closed'`, action « Clore la session » |
| Commande | Prix relus en base au moment de l'insertion — le client n'envoie que `{id, qty}` | `place_order()` |
| Commande | 10 commandes max / session / 15 min | `place_order()` |
| Commande | qty ∈ [1,20], 30 lignes max, longueurs bornées | `place_order()` + `CHECK` |
| Réservation | 3 demandes max / téléphone / restaurant / 24 h | `create_reservation()` |
| Humain | Le staff voit chaque commande (statut `pending`) avant de la lancer en cuisine | workflow statuts |

Limite résiduelle assumée : un client **présent** dans le restaurant pendant la
session peut commander depuis son propre réseau mobile (pas besoin du wifi).
C'est le fonctionnement normal du produit ; la validation humaine en salle
couvre les abus.

## Architecture d'accès aux données

```
anon (client à table, visiteur)            authenticated (restaurateur)
        │                                          │
        ▼                                          ▼
5 RPCs SECURITY DEFINER                    Tables via RLS
  get_session_menu(token)                    policy: owner_id = auth.uid()
  place_order(token, items…)                 (helper is_restaurant_owner)
  get_order_public(token, order_id)
  get_restaurant_public(slug)
  create_reservation(slug, …)
```

- **RLS activée sur les 9 tables.** Le rôle `anon` n'a aucune policy → aucun
  accès direct, même en lecture. Toute la surface publique passe par les RPCs.
- `order_counters` : RLS sans policy (deny all volontaire) — accessible
  uniquement via `next_order_number()`, dont l'EXECUTE est révoqué pour
  `public/anon/authenticated` (vérifié : `permission denied` en anon).
- `get_order_public` exige le **couple** token + order_id : impossible de lire
  la commande d'une autre table.
- Toutes les fonctions ont `set search_path = public` (anti-hijack).
- Lint sécurité Supabase passé le 2026-06-12 : les seuls WARN restants sont
  les 5 RPCs publics — **intentionnels**, c'est l'API du produit.

## Côté application

- Open-redirect bloqué sur `/login?next=` (seuls les chemins internes passent).
- `proxy.ts` (Next 16) protège `/admin/*` et `/kitchen` ; les Server
  Components revérifient via `supabase.auth.getUser()` (le proxy n'est qu'un
  contrôle optimiste, conformément aux recommandations Next.js).
- Server Actions admin : chaque mutation refait `requireRestaurant()` et
  filtre par `restaurant_id` — défense en profondeur au-dessus de la RLS.
- Échappement HTML dans la fenêtre d'impression QR (seule injection de
  template HTML du code).
- Headers : `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy` (`next.config.ts`).
- Secrets : uniquement `.env.local` (gitignoré). La clé publique
  `sb_publishable_…` est faite pour être exposée ; il n'y a **aucune clé
  secrète dans le code**.

## Tests e2e réalisés (2026-06-12, API REST directe)

1. Menu via token valide → carte renvoyée ✓
2. `place_order` anon, 2 × Burger 15,50 € → total serveur 3100 ¢ ✓
3. Suivi commande via token + id ✓
4. Session clôturée → `SESSION_INVALID` ✓
5. Réservation publique → créée ✓
6. `next_order_number` en anon → `permission denied` ✓
7. `GET /rest/v1/restaurants` en anon → `[]` (RLS) ✓

## À faire avant production sérieuse

- [ ] Activer un CAPTCHA Supabase Auth (Turnstile) si spam d'inscriptions
- [ ] Brancher la rotation automatique des sessions en fin de service (cron pg_cron)
- [ ] Paiement Stripe (code prévu pour : env `STRIPE_SECRET_KEY` absente = paiement comptoir)
- [ ] Sauvegardes : plan gratuit Supabase = pas de PITR ; exporter régulièrement ou passer au plan Pro
