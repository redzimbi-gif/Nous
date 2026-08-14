// Porte d'entrée de l'app : un seul code secret, connu de vous deux.
// Pas de compte, pas de mot de passe oublié — juste ce code.
// Pour le changer : modifie APP_PASSCODE ci-dessous et repousse sur GitHub
// (Vercel redéploie automatiquement en ~1 minute).
export const APP_PASSCODE = "Lapalisse";

// Jeton de session interne (pas le code affiché à l'écran de connexion).
// Généré aléatoirement une fois, ne change que si tu veux invalider toutes
// les sessions en cours.
export const SESSION_TOKEN =
  "2af8a8a5c56dbeb1d513d58a59b9e7191a24d76ddb8713f9c302e969f65b0c4d";

export const SESSION_COOKIE = "nous_session";
