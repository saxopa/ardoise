# Ardoise

**Commande à table par QR code + réservations en ligne, pour restaurateurs indépendants.**

Le client scanne le QR de sa table → consulte la carte → commande depuis son téléphone. La cuisine reçoit le ticket en temps réel. Le restaurateur gère carte, tables, commandes et réservations depuis un tableau de bord unique. Aucune app à installer côté client (web mobile pur), aucune commission.

## Démarrage rapide

```bash
npm install
npm run dev          # http://localhost:3000
```

Le fichier `.env.local` est déjà configuré sur le projet Supabase `ardoise`
(`<projet>`, région eu-west-3 Paris, plan gratuit).

**Compte de test existant** (email confirmé) :
`test@example.com` / `<mot-de-passe-de-test>`

> Note : la confirmation d'email est activée sur Supabase Auth. Pour les
> nouveaux comptes, le mail de confirmation doit être cliqué avant connexion.
> Désactivable dans Dashboard → Authentication → Sign In / Up → Email.

## Parcours complet (5 minutes)

1. `/login` → connexion → onboarding crée le restaurant (+ carte d'exemple et 4 tables si coché)
2. `/admin/tables` → « Ouvrir une session + générer le QR » sur une table → « Imprimer le QR »
3. Scanner le QR (ou ouvrir l'URL `/t/<token>` affichée) sur un téléphone → commander
4. `/kitchen` sur une tablette en cuisine → le ticket apparaît en temps réel → « Lancer » → « Prêt » → « Servi »
5. Le client suit l'avancement sur sa page de commande (mise à jour auto)
6. `/r/<slug>` = page publique de réservation à partager (lien dans `/admin/reservations`)

## Pages

| Route | Accès | Rôle |
|---|---|---|
| `/` | public | Landing commerciale |
| `/login` | public | Connexion / inscription |
| `/admin` | propriétaire | Dashboard : chiffre du jour, commandes, couverts |
| `/admin/menu` | propriétaire | CRUD carte (catégories, plats, rupture en 1 clic) |
| `/admin/tables` | propriétaire | Tables, sessions, génération + impression QR |
| `/admin/orders` | propriétaire | Commandes du jour, temps réel, changement de statut |
| `/admin/reservations` | propriétaire | Demandes de réservation, confirmation |
| `/admin/settings` | propriétaire | Nom, contact, interrupteurs commande/réservation |
| `/kitchen` | propriétaire | Écran cuisine sombre temps réel, lisible à 2 m |
| `/t/[token]` | public (token) | Carte + panier + commande du client |
| `/t/[token]/o/[id]` | public (token) | Suivi de commande (polling 8 s) |
| `/r/[slug]` | public | Formulaire de réservation |

## Sécurité — réponse à « et si je commande depuis chez moi ? »

C'était la question fondatrice du projet. Réponse implémentée :

1. **Token de session UUID** par table, généré côté serveur, **expirant** (4 h par défaut, réglable 1–24 h).
2. **Clôture par le staff** : table libérée → token mort → toute commande renvoie `SESSION_INVALID`. Vérifié par test e2e.
3. **Le rôle `anon` ne touche jamais les tables** : toute la surface publique passe par 5 fonctions PostgreSQL `SECURITY DEFINER` (RLS partout ailleurs, deny par défaut).
4. **Prix recalculés serveur** depuis la base — un panier falsifié dans le navigateur n'a aucun effet.
5. **Rate limiting en base** : 10 commandes max / session / 15 min ; 3 réservations max / téléphone / 24 h.
6. **Limites de saisie** partout (qty ≤ 20, 30 lignes max, longueurs de champs contraintes par `CHECK`).
7. Headers HTTP durcis (`X-Frame-Options: DENY`, `nosniff`, etc.) dans `next.config.ts`.

Détails dans [`docs/SECURITY.md`](docs/SECURITY.md).

## Stack

- **Next.js 16** (App Router, Server Actions, `proxy.ts`), React 19, TypeScript
- **Supabase** : PostgreSQL + RLS, Auth, Realtime (écran cuisine et commandes)
- **Tailwind CSS v4** — design system maison (voir [`docs/DESIGN.md`](docs/DESIGN.md))
- `qrcode` pour la génération des QR côté navigateur

Schéma SQL complet et rejouable : [`supabase/migrations/20260612_schema_complet.sql`](supabase/migrations/20260612_schema_complet.sql)

## Déploiement

Voir [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Résumé : Vercel (gratuit pour commencer) + le projet Supabase existant ; renseigner `NEXT_PUBLIC_APP_URL` avec le domaine final (utilisé pour l'affichage des liens publics).

## Modèle économique visé

SaaS par abonnement (49–129 €/mois selon module), cible : restaurateurs
indépendants Guyane (réseau Ponti'Com) puis Bordeaux/Toulouse. Voir
[`docs/BUSINESS.md`](docs/BUSINESS.md).
