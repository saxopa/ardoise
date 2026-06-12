# Déploiement — Ardoise

## Infra actuelle

- **Supabase** : projet `ardoise` — ref `<projet>`, région
  `eu-west-3` (Paris), organisation « saxopa's Org », **plan gratuit (0 €)**.
  4 migrations appliquées (voir `supabase/migrations/`).
- **App** : non déployée — tourne en local (`npm run dev`).

## Déployer sur Vercel (recommandé)

```bash
# 1. Pousser le repo sur GitHub (compte saxopa)
gh repo create saxopa/ardoise --private --source . --push

# 2. Importer dans Vercel (vercel.com/new), puis variables d'environnement :
NEXT_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_<cle>
NEXT_PUBLIC_APP_URL=https://<domaine-final>
```

## Après mise en ligne — checklist Supabase

1. **Authentication → URL Configuration** : Site URL = domaine final,
   ajouter `https://<domaine>/**` aux Redirect URLs (sinon les mails de
   confirmation pointent vers localhost).
2. **Authentication → Sign In / Up** : décider de garder ou non la
   confirmation d'email (UX onboarding vs anti-spam).
3. Vérifier les QR : ils encodent `window.location.origin` au moment de
   l'impression → réimprimer après changement de domaine.

## Points d'attention

- **Plan gratuit Supabase** : le projet est mis en pause après ~7 jours
  d'inactivité ; pas de backups PITR. Pour un client payant → plan Pro (25 $/mois).
- **Next 16** : `proxy.ts` remplace `middleware.ts` (déjà fait ici).
- **Realtime** : seule la table `orders` est dans la publication
  `supabase_realtime` — en ajouter d'autres si besoin (`alter publication…`).
- **Multi-restaurants** : le schéma est multi-tenant par design
  (`restaurant_id` partout + RLS). Un seul déploiement sert N clients.

## Stripe (plus tard)

Le flux actuel est « paiement au comptoir ». Pour le paiement en ligne :
créer un compte Stripe, renseigner `STRIPE_SECRET_KEY` et
`STRIPE_WEBHOOK_SECRET`, puis implémenter le Checkout (place prévue dans le
flux de commande — la commande existe déjà côté DB avant paiement, il suffit
d'ajouter un statut `paid` + webhook).
