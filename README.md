# Nous

L'espace privé de ceux qui comptent : en couple, entre amis ou en famille. Un compte, plusieurs espaces ; chaque espace a ses membres, son profil, sa formule et sa palette.

> **Branche de la v2 (squelette).** La v1, l'espace privé à deux (code PIN, un seul projet Supabase), reste sur `main`. Cette branche est une reconstruction : même identité visuelle, vraie authentification, multi-espaces, sécurité par appartenance.

## Ce que contient le squelette

| Domaine | État |
| --- | --- |
| Connexion par code e-mail (sans mot de passe) | écrit, à tester sur un projet Supabase |
| Créer un espace / rejoindre avec un code | écrit, à tester sur un projet Supabase |
| Sélecteur d'espaces, profil propre à chaque espace | écrit |
| Modules : noyau commun + modules au choix selon le type d'espace et la formule | écrit, testé (Vitest) |
| Écrans réels : accueil, À faire, humeur, réglages | écrits |
| Chat, photos, agenda | écrans « Bientôt », à porter depuis la v1 |
| Schéma SQL, politiques RLS, fonctions métier | écrits et testés sur Postgres (`npm run db:test`) |
| Abonnements Stripe, points, promesses | prévus, pas encore commencés |

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis renseigner l'URL et la clé publique Supabase
npm run dev
```

L'**aperçu de l'interface** ne demande aucune configuration : <http://localhost:3000/preview> (données fictives, une palette par type d'espace). En production il reste fermé, sauf si `NEXT_PUBLIC_ENABLE_PREVIEW=1`.

### Brancher Supabase (projet neuf, jamais celui de la v1)

1. Créer un projet Supabase dédié à la v2.
2. Appliquer `supabase/migrations/*.sql` (`supabase db push`, ou copier le fichier dans l'éditeur SQL).
3. *Authentication → Email Templates → Magic Link* : remplacer le corps par le code à six chiffres, par exemple :
   `<h2>Ton code Nous</h2><p style="font-size:28px;letter-spacing:4px">{{ .Token }}</p>`
4. *Authentication → URL Configuration* : renseigner l'adresse du site.
5. Copier l'URL du projet et la clé *publishable* dans `.env.local` (et dans Vercel).

## Architecture

```
compte ──< appartenance (space_members) >── espace ──1 abonnement
                  │                            └──< modules activés / désactivés
                  └─ profil propre à l'espace : prénom, couleur, humeur
```

- **Un profil par espace.** `space_members` porte le prénom affiché, la couleur et l'humeur. Les enfants de moins de 15 ans sont des profils *supervisés* (sans compte), gérés par un parent.
- **L'abonnement appartient à l'espace.** Un titulaire paie, tous les membres en profitent. `src/lib/entitlements.ts` calcule la formule réelle : une formule échue retombe en gratuit sans rien supprimer.
- **Modules.** `src/modules/registry.ts` est la source unique : noyau commun (accueil, chat, photos, agenda, tâches : barre du bas, jamais désactivable), modules au choix préréglés par type d'espace et verrouillés par formule. La base ne stocke que les écarts.
- **Palettes.** Les couleurs sont des variables CSS sémantiques (`src/app/globals.css`), une palette par type d'espace. Couple = les couleurs historiques de Nous.
- **Navigation minimaliste.** Barre du bas de cinq icônes (seul l'onglet actif montre son nom), en-tête avec deux contrôles (l'espace courant, l'avatar), tout le reste dans deux feuilles.

## Sécurité

- Aucune politique n'est ouverte à `anon` ; chaque table est protégée par RLS et par des privilèges de colonne (par exemple, `invite_code` et `role` ne sont pas modifiables directement).
- Créer ou rejoindre un espace passe par des fonctions `SECURITY DEFINER` : capacité d'un couple limitée à deux personnes, verrou par espace, limite de tentatives sur les codes (8 par quart d'heure).
- Un espace archivé est en lecture seule pour tous.
- `supabase/tests/rls.sql` vérifie l'isolation entre espaces, les refus de droits et les cas limites.

## Tests

```bash
npm test          # logique pure : codes d'invitation, formules, modules (Vitest)
npm run typecheck

# Isolation des données : rejoue les migrations sur une base JETABLE puis les tests RLS
docker run --rm -d --name nous-pg -e POSTGRES_PASSWORD=postgres -p 54329:5432 postgres:16
DATABASE_URL=postgres://postgres:postgres@localhost:54329/postgres npm run db:test
```

`npm run db:test` efface la base visée : ne jamais l'utiliser sur une base qui contient des données.

## Récupérer du code de la v1

Les jeux (`src/lib/uno.ts`, `checkers.ts`, `connect4.ts`, `battleship.ts`, `guessword.ts`, `tictactoe.ts`), le chat, les photos et l'agenda sont encore sur `main` :

```bash
git show main:src/lib/uno.ts > src/modules/jeux/lib/uno.ts
```

## Prochaines étapes

1. Créer le projet Supabase de la v2, appliquer la migration, tester les parcours réels.
2. Porter chat, photos (stockage + URL signées) et agenda sur le modèle multi-espaces.
3. Points, défis, promesses (registre append-only, plafond quotidien).
4. Stripe (abonnement par espace, titulaire, transfert), publicité non ciblée en gratuit.
5. Départ d'un membre, archivage d'un couple, export et suppression des données (RGPD).
