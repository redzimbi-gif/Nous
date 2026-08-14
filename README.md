# Nous

Petit espace privé à deux : chat en temps réel, photos partagées, agenda commun.
Next.js 14 (App Router) + Supabase (base de données, stockage, temps réel),
pensé pour être hébergé gratuitement sur Vercel.

## Comment ça marche

- **Connexion** : un seul code secret, connu de vous deux (pas de compte,
  pas d'inscription). Défini dans `src/lib/auth.ts` (`APP_PASSCODE`) —
  pour le changer, modifie cette valeur et repousse sur GitHub, Vercel
  redéploie automatiquement.
- **Chat** (`/chat`) : messages texte et photos, mise à jour en direct pour
  vous deux via Supabase Realtime.
- **Photos** (`/photos`) : toutes les photos partagées, dans une galerie,
  avec vue plein écran.
- **Agenda** (`/agenda`) : calendrier mensuel, événements avec catégorie
  (date, anniversaire, voyage, autre), liste "à venir".
- **Qui es-tu ?** : à la première visite sur un appareil, chacun choisit son
  prénom (stocké localement sur l'appareil) pour que les messages/événements
  soient attribués à la bonne personne. Ce n'est pas un compte — juste une
  étiquette d'affichage.

## Sécurité — à lire

Le code secret protège l'entrée dans l'app (personne ne voit rien sans le
code). Derrière cette porte, les données (messages, photos, agenda) sont
accessibles à quiconque a passé le code, via la clé publique Supabase — il
n'y a pas de compte séparé par personne. C'est adapté à un espace privé à
deux, mais ce n'est pas une sécurité "bancaire" : ne partage jamais le lien
ni le code en dehors de vous deux. Le projet Supabase est dédié à cette app
uniquement (rien d'autre n'y vit).

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Configuration Supabase

1. Dans **SQL Editor** du projet Supabase, exécute
   `supabase/migrations/0001_init.sql`.
2. Dans **Project Settings → API**, récupère `Project URL` et la clé
   publique (`anon` / `publishable`), et renseigne-les dans
   `src/lib/supabase.ts`.

## Déploiement

Le dépôt est connecté à Vercel : chaque push sur la branche principale
redéploie automatiquement.
