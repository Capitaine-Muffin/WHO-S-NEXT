/**
 * Envoie un `.aab` sur Google Play, sans ouvrir la console.
 *
 * Remplace la séquence manuelle qui prend dix minutes et se rate
 * silencieusement : créer une version, glisser le fichier, coller les
 * notes, prévisualiser, enregistrer, aller dans la vue d'ensemble,
 * envoyer pour examen.
 *
 *   node tools/publier.mjs <chemin.aab> --piste internal --notes notes.txt
 *
 * Pistes possibles : `internal` (par défaut, se propage en quelques
 * minutes), `alpha`, `beta`, `production`.
 *
 * Le compte de service s'authentifie via la variable d'environnement
 * `GOOGLE_PLAY_SERVICE_ACCOUNT` — le contenu JSON lui-même, pas un chemin,
 * pour qu'il puisse venir d'un secret GitHub sans jamais toucher le disque.
 *
 * ⚠️ Ce compte doit être **distinct** de celui donné à RevenueCat : un
 * fichier de clé unique qui sait à la fois lire les achats et publier des
 * versions est déjà déposé chez un tiers. Lui accorder le droit
 * « Publier des versions » dans Play Console → Utilisateurs et
 * autorisations.
 *
 * Aucune dépendance : tout passe par `fetch` et le module `crypto` de Node.
 */
import { createSign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://androidpublisher.googleapis.com';
const PISTES = ['internal', 'alpha', 'beta', 'production'];

const args = process.argv.slice(2);
const cheminAab = args[0];
const piste = valeurDe('--piste') ?? 'internal';
const cheminNotes = valeurDe('--notes');

if (!cheminAab || cheminAab.startsWith('--')) {
  console.error('Usage : node tools/publier.mjs <chemin.aab> [--piste internal] [--notes notes.txt]');
  process.exit(1);
}
if (!existsSync(cheminAab)) {
  console.error(`Fichier introuvable : ${cheminAab}`);
  process.exit(1);
}
if (!PISTES.includes(piste)) {
  console.error(`Piste inconnue : ${piste}. Choisir parmi ${PISTES.join(', ')}.`);
  process.exit(1);
}

const compte = lireCompteDeService();
const paquet = lireNomDePaquet();
const notes = cheminNotes ? readFileSync(cheminNotes, 'utf8').trim() : null;

console.log(`Publication de ${path.basename(cheminAab)} sur ${paquet} → piste ${piste}`);

const jeton = await obtenirJeton(compte);
const edition = await appeler('POST', `/androidpublisher/v3/applications/${paquet}/edits`, jeton);
console.log(`Édition ouverte : ${edition.id}`);

try {
  const bundle = await televerser(jeton, edition.id);
  console.log(`Envoyé : versionCode ${bundle.versionCode}`);

  await appeler(
    'PUT',
    `/androidpublisher/v3/applications/${paquet}/edits/${edition.id}/tracks/${piste}`,
    jeton,
    {
      track: piste,
      releases: [
        {
          versionCodes: [String(bundle.versionCode)],
          status: 'completed',
          ...(notes ? { releaseNotes: [{ language: 'fr-FR', text: notes }] } : {}),
        },
      ],
    },
  );

  await appeler('POST', `/androidpublisher/v3/applications/${paquet}/edits/${edition.id}:commit`, jeton);
  console.log(`Publié sur ${piste}. L'examen de Google démarre maintenant.`);
} catch (erreur) {
  // Une édition laissée ouverte bloque les suivantes : on la referme avant
  // de relayer l'erreur, sinon la prochaine tentative échoue pour une
  // raison sans rapport avec le vrai problème.
  await appeler(
    'DELETE',
    `/androidpublisher/v3/applications/${paquet}/edits/${edition.id}`,
    jeton,
  ).catch(() => {});
  console.error(`\nÉchec : ${erreur.message}`);
  process.exit(1);
}

/** La valeur qui suit une option, ou `null` si l'option est absente. */
function valeurDe(option) {
  const index = args.indexOf(option);
  return index === -1 ? null : args[index + 1] ?? null;
}

/**
 * Le nom de paquet vient de `capacitor.config.json` : le répéter en
 * argument ouvrirait la porte à publier un jeu sous l'identifiant d'un
 * autre.
 */
function lireNomDePaquet() {
  const racine = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const config = JSON.parse(readFileSync(path.join(racine, 'capacitor.config.json'), 'utf8'));
  if (!config.appId) {
    console.error("capacitor.config.json ne contient pas appId.");
    process.exit(1);
  }
  return config.appId;
}

function lireCompteDeService() {
  const brut = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  if (!brut) {
    console.error('La variable GOOGLE_PLAY_SERVICE_ACCOUNT est absente.');
    console.error("Elle doit contenir le JSON du compte de service, pas son chemin.");
    process.exit(1);
  }
  const compte = JSON.parse(brut);
  if (!compte.client_email || !compte.private_key) {
    console.error("Ce JSON n'est pas un compte de service Google.");
    process.exit(1);
  }
  return compte;
}

/**
 * Échange la clé du compte de service contre un jeton d'accès.
 *
 * Google demande un JWT signé en RS256 ; `crypto` sait le faire, ce qui
 * évite d'ajouter `googleapis` (et ses cent dépendances) au projet.
 */
async function obtenirJeton(compte) {
  const maintenant = Math.floor(Date.now() / 1000);
  const entete = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const charge = base64url(
    JSON.stringify({
      iss: compte.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: maintenant,
      exp: maintenant + 3600,
    }),
  );

  let signature;
  try {
    signature = createSign('RSA-SHA256')
      .update(`${entete}.${charge}`)
      .sign(compte.private_key, 'base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    // Cas le plus fréquent : le JSON a transité par un secret qui a mangé
    // les retours à la ligne de la clé. Le message brut de `crypto` ne le
    // dit pas du tout.
    console.error('La clé privée du compte de service est illisible.');
    console.error('Les retours à la ligne de `private_key` ont probablement été perdus.');
    process.exit(1);
  }

  const reponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${entete}.${charge}.${signature}`,
    }),
  });

  const corps = await reponse.json();
  if (!reponse.ok) throw new Error(`Authentification refusée : ${corps.error_description ?? reponse.status}`);
  return corps.access_token;
}

function base64url(texte) {
  return Buffer.from(texte).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function appeler(methode, chemin, jeton, corps) {
  const reponse = await fetch(`${API}${chemin}`, {
    method: methode,
    headers: {
      Authorization: `Bearer ${jeton}`,
      ...(corps ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(corps ? { body: JSON.stringify(corps) } : {}),
  });

  if (!reponse.ok) {
    const detail = await reponse.text();
    throw new Error(`${methode} ${chemin} → ${reponse.status} ${detail.slice(0, 400)}`);
  }
  return reponse.status === 204 ? null : reponse.json();
}

/** Le `.aab` part en une seule requête, sur l'hôte d'envoi de Google. */
async function televerser(jeton, editionId) {
  const reponse = await fetch(
    `${API}/upload/androidpublisher/v3/applications/${paquet}/edits/${editionId}/bundles?uploadType=media`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jeton}`,
        'Content-Type': 'application/octet-stream',
      },
      body: readFileSync(cheminAab),
    },
  );

  if (!reponse.ok) {
    const detail = await reponse.text();
    throw new Error(`Envoi du bundle refusé (${reponse.status}) : ${detail.slice(0, 400)}`);
  }
  return reponse.json();
}
