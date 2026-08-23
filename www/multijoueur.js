import { SUPABASE } from './supabase-config.js';

const avatars = ['🎤', '🎸', '🥁', '🎷', '🎹', '🎺', '🪕'];
let session = null;
let salon = null;
let actualisation = null;

export function initialiserMultijoueur({ elements, obtenirNom, ouvrirReglages, obtenirReglages }) {
  const ui = {
    accueil: elements.accueil,
    enLigne: document.querySelector('#en-ligne'),
    connexion: document.querySelector('#connexion-en-ligne'),
    salon: document.querySelector('#salon'),
    code: document.querySelector('#code-salle'),
    statut: document.querySelector('#statut-en-ligne'),
    codeSalon: document.querySelector('#code-salon'),
    joueurs: document.querySelector('#joueurs-salon'),
    lancer: document.querySelector('#lancer-en-ligne'),
    resume: document.querySelector('#resume-salon'),
  };

  document.querySelector('#jouer-en-ligne').addEventListener('click', () => afficherEnLigne(ui));
  document.querySelector('#retour-en-ligne').addEventListener('click', () => retourMenu(ui));
  document.querySelector('#quitter-salon').addEventListener('click', () => quitterSalon(ui));
  document.querySelector('#creer-salle').addEventListener('click', () => creerSalle(ui, obtenirNom(), obtenirReglages()));
  document.querySelector('#rejoindre-salle').addEventListener('click', () => rejoindreSalle(ui, obtenirNom()));
  document.querySelector('#copier-code').addEventListener('click', () => navigator.clipboard?.writeText(salon?.code ?? ''));
  document.querySelector('#regler-salon').addEventListener('click', () => {
    if (!salon?.hote) return changerStatut(ui, 'Seul l’hôte peut modifier les règles.');
    ouvrirReglages();
  });
  elements.validerDifficulte.addEventListener('click', () => mettreAJourReglages(ui, obtenirReglages()));
  document.querySelector('#lancer-en-ligne').addEventListener('click', () => changerStatut(ui, 'Le moteur de partie en ligne sera activé après le branchement Supabase.'));
  ui.code.addEventListener('input', () => { ui.code.value = ui.code.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
}

function estConfigure() {
  return SUPABASE.url.startsWith('https://') && SUPABASE.clePublique.length > 20;
}

function afficherEnLigne(ui) {
  ui.accueil.classList.remove('actif');
  ui.enLigne.classList.add('actif');
  changerStatut(ui, estConfigure() ? '' : 'Aperçu local : branche Supabase pour inviter d’autres téléphones.');
}

function retourMenu(ui) {
  arreterActualisation();
  ui.enLigne.classList.remove('actif');
  ui.accueil.classList.add('actif');
}

async function creerSalle(ui, nom, reglages) {
  try {
    if (!estConfigure()) {
      salon = { code: genererCode(), hote: true, joueurs: [{ nom, avatar: avatars[0] }], ...reglages };
    } else {
      await authentifier();
      salon = await appeler('creer_salle', { nom_joueur: nom, reglages });
    }
    afficherSalon(ui);
  } catch (erreur) { changerStatut(ui, erreur.message); }
}

async function rejoindreSalle(ui, nom) {
  const code = ui.code.value.trim().toUpperCase();
  if (code.length !== 6) return changerStatut(ui, 'Entre un code de 6 caractères.');
  if (!estConfigure()) return changerStatut(ui, 'Branche Supabase pour rejoindre une partie depuis un autre téléphone.');
  try {
    await authentifier();
    salon = await appeler('rejoindre_salle', { p_code_salle: code, nom_joueur: nom });
    afficherSalon(ui);
  } catch (erreur) { changerStatut(ui, erreur.message); }
}

function afficherSalon(ui) {
  ui.connexion.hidden = true;
  ui.salon.hidden = false;
  ui.codeSalon.textContent = salon.code;
  rendreJoueurs(ui, salon.joueurs);
  afficherReglages(ui);
  document.querySelector('#regler-salon').hidden = !salon.hote;
  ui.lancer.disabled = !salon.hote || salon.joueurs.length < 2;
  if (estConfigure()) actualisation = setInterval(() => rafraichirSalon(ui), 1200);
}

async function rafraichirSalon(ui) {
  try {
    const joueurs = await lire(`joueurs_salle?code_salle=eq.${salon.code}&select=nom,avatar,ordre&order=ordre`);
    salon.joueurs = joueurs;
    rendreJoueurs(ui, joueurs);
    ui.lancer.disabled = !salon.hote || joueurs.length < 2;
  } catch { /* La prochaine actualisation retentera automatiquement. */ }
}

async function mettreAJourReglages(ui, reglages) {
  if (!salon?.hote) return;
  Object.assign(salon, reglages);
  afficherReglages(ui);
  if (estConfigure()) await appeler('regler_salle', { p_code_salle: salon.code, reglages }).catch(() => {});
}

function afficherReglages(ui) {
  if (!salon) return;
  ui.resume.textContent = `Niveau ${salon.niveau} · ${salon.chrono} secondes · animation ${salon.animation}`;
}

function rendreJoueurs(ui, joueurs) {
  ui.joueurs.innerHTML = joueurs.map((joueur, index) => `<div class="joueur-salon"><span>${joueur.avatar || avatars[index]}</span>${echapper(joueur.nom)}${index === 0 ? ' · hôte' : ''}</div>`).join('');
}

function quitterSalon(ui) {
  arreterActualisation();
  salon = null;
  ui.salon.hidden = true;
  ui.connexion.hidden = false;
  changerStatut(ui, '');
}

async function authentifier() {
  if (session?.access_token) return;
  const reponse = await fetch(`${SUPABASE.url}/auth/v1/signup`, { method: 'POST', headers: entetes(), body: '{}' });
  if (!reponse.ok) throw new Error('Impossible de se connecter à Supabase.');
  session = await reponse.json();
}

async function appeler(fonction, parametres) {
  const reponse = await fetch(`${SUPABASE.url}/rest/v1/rpc/${fonction}`, { method: 'POST', headers: entetes(true), body: JSON.stringify(parametres) });
  if (!reponse.ok) throw new Error(await messageErreur(reponse));
  return reponse.json();
}

async function lire(chemin) {
  const reponse = await fetch(`${SUPABASE.url}/rest/v1/${chemin}`, { headers: entetes(true) });
  if (!reponse.ok) throw new Error(await messageErreur(reponse));
  return reponse.json();
}

function entetes(auth = false) {
  return { apikey: SUPABASE.clePublique, 'Content-Type': 'application/json', ...(auth && session ? { Authorization: `Bearer ${session.access_token}` } : {}) };
}

async function messageErreur(reponse) {
  const erreur = await reponse.json().catch(() => ({}));
  return erreur.message || 'Le mode en ligne ne répond pas.';
}

function genererCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function changerStatut(ui, texte) { ui.statut.textContent = texte; }
function arreterActualisation() { clearInterval(actualisation); actualisation = null; }
function echapper(texte) { const element = document.createElement('span'); element.textContent = texte; return element.innerHTML; }

