import { initialiserMultijoueur } from './multijoueur.js?v=2';

const nomsIA = ['Mélodie', 'Tempo', 'Jazz', 'Riff', 'Punk', 'Bongo'];
const nomsDeScene = ['Docteur Groove', 'Lady Tempo', 'Captain Riff', 'Mister Beat', 'Miss Décibel', 'DJ Moustache', 'Rocky Banjo', 'Saxo Kid', 'Major Bongo', 'Funky Mozart', 'Queen Cymbale', 'El Trompette'];
const avatars = ['🎤', '🎸', '🥁', '🎷', '🎹', '🎺', '🪕'];
const profils = {
  debutant: { regles: [], ia: 3, chrono: 8, animation: 'normale' },
  intermediaire: { regles: ['whootchi'], ia: 5, chrono: 5, animation: 'normale' },
  expert: { regles: ['whootchi', 'repetition', 'trio'], ia: 8, chrono: 3, animation: 'rapide' },
  impossible: { regles: ['whootchi', 'repetition', 'trio', 'point-faible'], ia: 10, chrono: 2, animation: 'rapide' },
};
const elements = {
  accueil: document.querySelector('#accueil'),
  partie: document.querySelector('#partie'),
  nombreJoueurs: document.querySelector('#nombre-joueurs'),
  nomJoueur: document.querySelector('#nom-joueur'),
  niveauIA: document.querySelector('#niveau-ia'),
  dureeChrono: document.querySelector('#duree-chrono'),
  jouer: document.querySelector('#jouer'),
  quitter: document.querySelector('#quitter'),
  table: document.querySelector('#joueurs-table'),
  plateau: document.querySelector('#table'),
  main: document.querySelector('#main-joueur'),
  message: document.querySelector('#message'),
  chrono: document.querySelector('#chrono'),
  chronoBloc: document.querySelector('.pendule'),
  niveauAffiche: document.querySelector('#niveau-affiche'),
  mancheAffiche: document.querySelector('#manche-affiche'),
  notesJoueur: document.querySelector('#notes-joueur'),
  dialogue: document.querySelector('#fin-manche'),
  finSurtitre: document.querySelector('#fin-surtitre'),
  finTitre: document.querySelector('#fin-titre'),
  finTexte: document.querySelector('#fin-texte'),
  continuer: document.querySelector('#continuer'),
  relancerChrono: document.querySelector('#relancer-chrono'),
  choixSens: document.querySelector('#choix-sens'),
  flip: document.querySelector('#flip'),
  ouvrirDifficulte: document.querySelector('#ouvrir-difficulte'),
  difficulte: document.querySelector('#difficulte'),
  validerDifficulte: document.querySelector('#valider-difficulte'),
  vitesseAnimation: document.querySelector('#vitesse-animation'),
  portraitMenu: document.querySelector('#portrait-menu'),
  rapport: document.querySelector('#rapport-partie'),
  listeRapport: document.querySelector('#liste-rapport'),
};

let etat = null;
let minuterie = null;
let actionIA = null;

elements.jouer.addEventListener('click', demarrerPartie);
elements.quitter.addEventListener('click', quitterPartie);
elements.continuer.addEventListener('click', nouvelleManche);
elements.relancerChrono.addEventListener('click', relancerChrono);
elements.flip.addEventListener('click', retournerMain);
elements.ouvrirDifficulte.addEventListener('click', ouvrirDifficulte);
elements.validerDifficulte.addEventListener('click', () => elements.difficulte.close());
document.querySelectorAll('[data-joueurs]').forEach((bouton) => bouton.addEventListener('click', () => choisirPastille('joueurs', bouton)));
document.querySelectorAll('[data-ia]').forEach((bouton) => bouton.addEventListener('click', () => choisirPastille('ia', bouton)));
document.querySelectorAll('[data-animation]').forEach((bouton) => bouton.addEventListener('click', () => choisirPastille('animation', bouton)));
document.querySelectorAll('[data-preset]').forEach((bouton) => bouton.addEventListener('click', () => appliquerProfil(bouton.dataset.preset)));
document.querySelectorAll('[data-info]').forEach((bouton) => bouton.addEventListener('click', (event) => afficherAide(event, bouton.dataset.info)));
document.querySelector('#ouvrir-rapport').addEventListener('click', () => basculerRapport(true));
document.querySelector('#fermer-rapport').addEventListener('click', () => basculerRapport(false));
document.querySelector('#retour-en-ligne').addEventListener('click', changerPortraitMenu);
document.querySelector('#ouvrir-tutoriel').addEventListener('click', () => document.querySelector('#tutoriel').showModal());
document.querySelector('#fermer-tutoriel').addEventListener('click', () => document.querySelector('#tutoriel').close());
elements.dureeChrono.addEventListener('change', marquerPersonnalise);
elements.difficulte.querySelectorAll('[data-regle]').forEach((bouton) => {
  bouton.addEventListener('click', () => basculerRegle(bouton));
});
elements.choixSens.querySelectorAll('[data-sens]').forEach((bouton) => {
  bouton.addEventListener('click', () => appliquerSens(Number(bouton.dataset.sens)));
});
document.addEventListener('keydown', gererClavier);
elements.nomJoueur.value = nomDeSceneAleatoire();
changerPortraitMenu();
initialiserMultijoueur({
  elements,
  obtenirNom: () => elements.nomJoueur.value.trim() || nomDeSceneAleatoire(),
  ouvrirReglages: ouvrirDifficulte,
  obtenirReglages: () => ({ regles: obtenirRegles(), chrono: Number(elements.dureeChrono.value), animation: elements.vitesseAnimation.value }),
});

function demarrerPartie() {
  const nombre = Number(elements.nombreJoueurs.value);
  const regles = obtenirRegles();
  const niveauIA = Number(elements.niveauIA.value);
  const dureeChrono = Math.max(1, Math.min(8, Number(elements.dureeChrono.value) || 8));
  const nomHumain = elements.nomJoueur.value.trim() || nomDeSceneAleatoire();
  elements.nomJoueur.value = nomHumain;
  const nomsDisponibles = [...nomsIA, ...nomsDeScene].filter((nom, index, liste) =>
    nom.toLocaleLowerCase('fr') !== nomHumain.toLocaleLowerCase('fr') && liste.indexOf(nom) === index
  );
  const joueurs = Array.from({ length: nombre }, (_, index) => ({
    nom: index === 0 ? nomHumain : nomsDisponibles[index - 1],
    humain: index === 0,
    avatar: avatars[index],
    notes: 0,
    main: [],
    derniere: null,
    historique: [],
    erreurConsecutive: 0,
  }));

  etat = {
    joueurs,
    regles,
    niveauIA,
    manche: 0,
    sens: 0,
    actif: 0,
    dureeChrono,
    temps: dureeChrono,
    enCours: true,
    premierTour: true,
    faceMainWhootchi: false,
    vitesseAnimation: elements.vitesseAnimation.value,
    animationErreur: false,
    rapport: [],
  };

  elements.accueil.classList.remove('actif');
  elements.partie.classList.add('actif');
  nouvelleManche();
}

function nomDeSceneAleatoire() {
  return nomsDeScene[Math.floor(Math.random() * nomsDeScene.length)];
}

function choisirPastille(type, bouton, personnaliser = true) {
  const attribut = type === 'joueurs' ? 'data-joueurs' : `data-${type}`;
  document.querySelectorAll(`[${attribut}]`).forEach((candidat) => candidat.classList.toggle('actif', candidat === bouton));
  const cible = type === 'joueurs' ? elements.nombreJoueurs : (type === 'ia' ? elements.niveauIA : elements.vitesseAnimation);
  cible.value = bouton.dataset[type];
  if (personnaliser && type !== 'joueurs') marquerPersonnalise();
}

function appliquerProfil(nom) {
  const profil = profils[nom];
  if (!profil) return;
  elements.difficulte.querySelectorAll('[data-regle]').forEach((bouton) => bouton.classList.toggle('actif', profil.regles.includes(bouton.dataset.regle)));
  choisirPastille('ia', document.querySelector(`[data-ia="${profil.ia}"]`), false);
  choisirPastille('animation', document.querySelector(`[data-animation="${profil.animation}"]`), false);
  elements.dureeChrono.value = profil.chrono;
  document.querySelectorAll('[data-preset]').forEach((bouton) => bouton.classList.toggle('actif', bouton.dataset.preset === nom));
  elements.ouvrirDifficulte.classList.remove('personnalise');
  elements.ouvrirDifficulte.innerHTML = '<strong>Paramètres avancés</strong><small>Fais tes propres règles !</small>';
}

function marquerPersonnalise() {
  document.querySelectorAll('[data-preset]').forEach((bouton) => bouton.classList.remove('actif'));
  elements.ouvrirDifficulte.classList.add('personnalise');
  elements.ouvrirDifficulte.innerHTML = '<strong>Paramètres personnalisés</strong><small>Ta propre combinaison est active</small>';
}

function afficherAide(event, nom) {
  event.stopPropagation();
  const bulle = document.querySelector(`[data-bulle="${nom}"]`);
  if (!bulle) return;
  document.querySelectorAll('[data-bulle]').forEach((autre) => { if (autre !== bulle) autre.hidden = true; });
  bulle.hidden = !bulle.hidden;
}

function changerPortraitMenu() {
  const index = Math.floor(Math.random() * 12);
  const colonnes = [36, 382, 728, 1074, 1420, 1766];
  elements.portraitMenu.style.setProperty('--portrait-x', `${-colonnes[index % 6] * .41}px`);
  elements.portraitMenu.style.setProperty('--portrait-y', `${(index < 6 ? -36 : -384) * .41}px`);
}

function ouvrirDifficulte() {
  elements.difficulte.showModal();
}

function basculerRegle(bouton) {
  bouton.classList.toggle('actif');
  marquerPersonnalise();
}

function obtenirRegles() {
  return [...elements.difficulte.querySelectorAll('[data-regle].actif')].map((bouton) => bouton.dataset.regle);
}

function aRegle(regle) {
  return etat.regles.includes(regle);
}

function nouvelleManche() {
  elements.dialogue.close();
  if (!etat) return;

  const perdant = etat.joueurs.find((joueur) => joueur.notes >= 7);
  if (perdant) {
    quitterPartie();
    return;
  }

  etat.manche += 1;
  ajouterRapport({ type: 'manche', texte: `Début de la manche ${etat.manche}` });
  etat.chef = etat.actif;
  etat.sens = 0;
  etat.choixSens = true;
  etat.premierTour = true;
  etat.joueurs.forEach((joueur) => {
    joueur.main = creerMain(etat.joueurs.length);
    joueur.derniere = null;
    joueur.historique = [];
  });
  etat.enCours = true;
  afficher();
  demanderSens();
}

function demanderSens() {
  const chef = etat.joueurs[etat.chef];
  elements.message.textContent = `${chef.nom} choisit le sens du jeu…`;
  if (chef.humain) {
    elements.choixSens.show();
    return;
  }

  actionIA = setTimeout(() => appliquerSens(Math.random() < .5 ? 1 : -1), 1200);
}

function appliquerSens(sens) {
  if (!etat?.choixSens) return;
  clearTimeout(actionIA);
  if (elements.choixSens.open) elements.choixSens.close();
  etat.sens = sens;
  etat.choixSens = false;
  etat.actif = (etat.chef + sens + etat.joueurs.length) % etat.joueurs.length;
  afficher();
  commencerTour();
}

function creerMain(nombreJoueurs) {
  const maximum = Math.max(1, nombreJoueurs - 1);
  return Array.from({ length: maximum }, (_, index) => ({
    valeur: index + 1,
    whootchi: false,
  }));
}

async function jouerCarte(indexCarte, retourner = false, auteur = 0) {
  if (!etat?.enCours || etat.animationErreur || etat.choixSens) return;
  const joueur = etat.joueurs[auteur];
  if (!joueur) return;
  const carteBase = joueur.main[indexCarte];
  if (!carteBase) return;
  const carte = { ...carteBase, whootchi: retourner && aRegle('whootchi') };

  if (auteur !== etat.actif) {
    arreterTemps();
    etat.animationErreur = true;
    ajouterRapport({ type: 'carte-faute', joueur: joueur.nom, carte });
    await animerCarteErreur(joueur, carte, `${joueur.nom} joue trop tôt !`);
    etat.animationErreur = false;
    sanctionner(joueur, `${joueur.nom} a joué alors que ce n'était pas son tour.`);
    return;
  }

  if (estPoseInterdite(joueur, carte)) {
    arreterTemps();
    etat.animationErreur = true;
    ajouterRapport({ type: 'carte-faute', joueur: joueur.nom, carte });
    await animerCarteErreur(joueur, carte, `${joueur.nom} joue une carte interdite !`);
    etat.animationErreur = false;
    sanctionner(joueur, 'Cette carte ne pouvait pas être jouée.');
    return;
  }

  arreterTemps();
  joueur.derniere = { ...carte };
  joueur.historique.push({ ...carte });
  joueur.historique = joueur.historique.slice(-2);
  joueur.erreurConsecutive = 0;
  etat.premierTour = false;
  ajouterRapport({ type: 'carte', joueur: joueur.nom, carte });

  if (carte.whootchi) etat.sens *= -1;
  const distance = carte.valeur * etat.sens;
  etat.actif = (etat.actif + distance + etat.joueurs.length * 10) % etat.joueurs.length;

  afficher();
  animerCarteJouee(auteur, joueur, carte);
  if (await tenterErreurIA(auteur)) return;
  commencerTour();
}

async function tenterErreurIA(dernierAuteur) {
  const candidats = etat.joueurs.filter((joueur, index) => !joueur.humain && index !== dernierAuteur && index !== etat.actif);
  if (!candidats.length || Math.random() >= probabiliteErreur()) return false;
  const joueur = candidats[Math.floor(Math.random() * candidats.length)];
  const carteBase = joueur.main[Math.floor(Math.random() * joueur.main.length)];
  const carte = { ...carteBase, whootchi: aRegle('whootchi') && Math.random() < .5 };
  arreterTemps();
  etat.animationErreur = true;
  ajouterRapport({ type: 'carte-faute', joueur: joueur.nom, carte });
  await animerCarteErreur(joueur, carte, `${joueur.nom} joue trop tôt !`);
  etat.animationErreur = false;
  sanctionner(joueur, `${joueur.nom} a joué alors que ce n'était pas son tour.`);
  return true;
}

async function animerCarteErreur(joueur, carte, texte = `${joueur.nom} fait une fausse note !`) {
  if (etat.vitesseAnimation === 'aucune') return;
  const rapide = etat.vitesseAnimation === 'rapide';
  const animation = document.createElement('div');
  animation.className = 'pose-carte erreur-pose';
  animation.innerHTML = `<strong>${texte}</strong><div class="carte carte-animee"><span class="visuellement-cache">${nomCarte(carte.valeur, carte.whootchi)}</span></div>`;
  appliquerFaceCarte(animation.querySelector('.carte-animee'), carte.valeur, carte.whootchi);
  document.body.append(animation);
  await attendre(rapide ? 450 : 1200);
  await animation.animate([
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
    { transform: 'translate(-50%, -50%) scale(.9)', opacity: 0 },
  ], { duration: rapide ? 100 : 220, easing: 'ease-in', fill: 'forwards' }).finished;
  animation.remove();
}

async function animerCarteJouee(indexJoueur, joueur, carte) {
  if (etat.vitesseAnimation === 'aucune') return;
  const rapide = etat.vitesseAnimation === 'rapide';
  const animation = document.createElement('div');
  animation.className = 'pose-carte';
  animation.innerHTML = `<strong>${joueur.nom} joue</strong><div class="carte carte-animee"><span class="visuellement-cache">${nomCarte(carte.valeur, carte.whootchi)}</span></div>`;
  appliquerFaceCarte(animation.querySelector('.carte-animee'), carte.valeur, carte.whootchi);
  document.body.append(animation);

  const cible = elements.table.querySelector(`[data-joueur-index="${indexJoueur}"] .derniere-carte:last-child`) ?? elements.table.querySelector(`[data-joueur-index="${indexJoueur}"] .avatar`);
  const positionPile = Math.max(0, joueur.historique.length - 1);
  cible?.classList.add('cible-animation');

  await attendre(rapide ? 350 : 1000);

  const cadre = cible?.getBoundingClientRect();
  if (cadre) {
    const etiquette = animation.querySelector('strong');
    await etiquette.animate([{ opacity: 1 }, { opacity: 0 }], { duration: rapide ? 70 : 140, fill: 'forwards' }).finished;
    etiquette.style.display = 'none';
    const arriveeX = cadre.left + cadre.width / 2;
    const arriveeY = cadre.top + cadre.height / 2;
    const angleFinal = -7 + positionPile * 10;
    await animation.animate([
      { left: '50%', top: '50%', transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { left: `${arriveeX}px`, top: `${arriveeY}px`, transform: `translate(-50%, -50%) scale(.3333) rotate(${angleFinal}deg)`, opacity: 1 },
    ], { duration: rapide ? 240 : 620, easing: 'cubic-bezier(.22,.78,.25,1)', fill: 'forwards' }).finished;
  }

  animation.remove();
  cible?.classList.remove('cible-animation');
}

function attendre(duree) {
  return new Promise((resolve) => setTimeout(resolve, duree));
}

function estPoseInterdite(joueur, carte) {
  if (aRegle('repetition') && joueur.derniere && joueur.derniere.valeur === carte.valeur && joueur.derniere.whootchi === carte.whootchi) {
    return true;
  }

  if (aRegle('trio')) {
    const identiques = etat.joueurs.filter(({ derniere }) => derniere && derniere.valeur === carte.valeur && derniere.whootchi === carte.whootchi).length;
    if (identiques >= 2) return true;
  }

  if (aRegle('point-faible') && visePointFaible(joueur, carte)) return true;
  return false;
}

function visePointFaible(joueur, carte) {
  const maximum = Math.max(...etat.joueurs.map(({ notes }) => notes));
  const pointsFaibles = etat.joueurs.filter(({ notes }) => notes === maximum);
  if (pointsFaibles.length !== 1) return false;

  const minimum = Math.min(...etat.joueurs.map(({ notes }) => notes));
  if (joueur.notes !== minimum) return false;

  const indexJoueur = etat.joueurs.indexOf(joueur);
  const sensApresCarte = carte.whootchi ? -etat.sens : etat.sens;
  const indexCible = (indexJoueur + carte.valeur * sensApresCarte + etat.joueurs.length * 10) % etat.joueurs.length;
  return etat.joueurs[indexCible] === pointsFaibles[0];
}

function commencerTour() {
  arreterTemps();
  if (!etat?.enCours) return;

  const joueur = etat.joueurs[etat.actif];
  etat.temps = etat.dureeChrono;
  elements.message.textContent = 'Qui doit jouer maintenant ?';
  afficher();

  minuterie = setInterval(() => {
    etat.temps -= 1;
    afficherChrono();
    if (etat.temps <= 0) sanctionner(joueur, `${joueur.nom} a dépassé le chrono.`);
  }, 1000);

  if (!joueur.humain) {
    const delaiMaximum = Math.max(180, etat.temps * 1000 - 120);
    const delai = 120 + Math.random() * (delaiMaximum - 120);
    actionIA = setTimeout(() => jouerIA(joueur), delai);
  }
}

function relancerChrono() {
  if (!etat?.enCours) return;
  etat.temps = etat.dureeChrono;
  afficherChrono();
  elements.chronoBloc.classList.remove('relance');
  void elements.chronoBloc.offsetWidth;
  elements.chronoBloc.classList.add('relance');
}

async function jouerIA(joueur) {
  if (!etat?.enCours || etat.joueurs[etat.actif] !== joueur) return;

  const faces = aRegle('whootchi') ? [false, true] : [false];
  const options = joueur.main.flatMap((carte, index) =>
    faces.map((whootchi) => ({ carte: { ...carte, whootchi }, index, retourner: whootchi }))
  ).filter(({ carte }) => !estPoseInterdite(joueur, carte));

  const choix = options[Math.floor(Math.random() * options.length)];
  if (!choix) {
    sanctionner(joueur, `${joueur.nom} n'avait aucun coup valable.`);
    return;
  }

  jouerCarte(choix.index, choix.retourner, etat.joueurs.indexOf(joueur));
}

function probabiliteErreur() {
  return etat.niveauIA >= 10 ? 0 : (10 - etat.niveauIA) * .05;
}

function sanctionner(joueur, raison) {
  if (!etat?.enCours) return;
  arreterTemps();
  etat.enCours = false;
  joueur.erreurConsecutive += 1;
  const penalite = 1;
  joueur.notes += penalite;
  ajouterRapport({ type: 'faute', joueur: joueur.nom, texte: raison });
  etat.actif = etat.joueurs.indexOf(joueur);
  afficher();

  if (joueur.notes >= 7) {
    const gagnants = etat.joueurs.filter((candidat) => candidat.notes === Math.min(...etat.joueurs.map((j) => j.notes))).map((j) => j.nom).join(' et ');
    ouvrirDialogue('FIN DU CONCERT', `${joueur.nom} atteint 7 fausses notes`, `${raison} ${gagnants} remporte${gagnants.includes(' et ') ? 'nt' : ''} la partie.`);
  } else {
    ouvrirDialogue('FAUSSE NOTE', `${penalite} fausse note${penalite > 1 ? 's' : ''} pour ${joueur.nom}`, raison);
  }
}

function terminerManche(reussie, texte) {
  arreterTemps();
  etat.enCours = false;
  ouvrirDialogue(reussie ? 'BRAVO' : 'MANCHE TERMINÉE', 'Le rythme est tenu !', texte);
}

function ouvrirDialogue(surtitre, titre, texte) {
  elements.finSurtitre.textContent = surtitre;
  elements.finTitre.textContent = titre;
  elements.finTexte.textContent = texte;
  elements.continuer.textContent = etat.joueurs.some((j) => j.notes >= 7) ? 'Retour au menu' : 'Manche suivante';
  elements.dialogue.show();
}

function afficher() {
  if (!etat) return;
  elements.niveauAffiche.textContent = `${etat.regles.length} règle${etat.regles.length > 1 ? 's' : ''}`;
  elements.mancheAffiche.textContent = `Manche ${etat.manche} · sens ${etat.sens === 1 ? 'horaire' : 'antihoraire'}`;
  const notes = etat.joueurs[0].notes;
  elements.notesJoueur.textContent = `${notes} fausse note${notes === 1 ? '' : 's'}`;
  afficherChrono();
  afficherTable();
  afficherMain();
  if (!elements.rapport.hidden) afficherRapport();
}

function ajouterRapport(entree) {
  if (!etat) return;
  etat.rapport.push({ ...entree, manche: etat.manche });
  if (!elements.rapport.hidden) afficherRapport();
}

function basculerRapport(ouvert) {
  elements.rapport.hidden = !ouvert;
  if (ouvert) afficherRapport();
}

function afficherRapport() {
  elements.listeRapport.replaceChildren();
  const entrees = etat?.rapport ?? [];
  if (!entrees.length) {
    elements.listeRapport.innerHTML = '<div class="ligne-rapport">Le concert n’a pas encore commencé.</div>';
    return;
  }
  entrees.forEach((entree) => {
    const ligne = document.createElement('div');
    ligne.className = `ligne-rapport${entree.type.includes('faute') ? ' faute' : ''}`;
    if (entree.carte) {
      const icone = document.createElement('i');
      icone.className = 'icone-rapport';
      appliquerMiniatureRapport(icone, entree.carte);
      ligne.append(icone);
    } else {
      const icone = document.createElement('span');
      icone.textContent = entree.type === 'manche' ? '🎬' : '♪';
      ligne.append(icone);
    }
    const texte = document.createElement('span');
    texte.textContent = entree.carte
      ? `${entree.joueur} · ${nomCarte(entree.carte.valeur, entree.carte.whootchi)}${entree.type === 'carte-faute' ? ' · FAUSSE NOTE' : ''}`
      : (entree.joueur ? `${entree.joueur} · ${entree.texte}` : entree.texte);
    ligne.append(texte);
    elements.listeRapport.append(ligne);
  });
  elements.listeRapport.scrollTop = elements.listeRapport.scrollHeight;
}

function appliquerMiniatureRapport(element, carte) {
  const colonnes = [36, 382, 728, 1074, 1420, 1766];
  const index = (carte.valeur - 1) * 2 + (carte.whootchi ? 1 : 0);
  element.style.setProperty('--rapport-x', `${-colonnes[index % 6] * .15}px`);
  element.style.setProperty('--rapport-y', `${(index < 6 ? -36 : -384) * .15}px`);
}

function afficherChrono() {
  elements.chrono.textContent = etat?.temps ?? 0;
  elements.chronoBloc.classList.toggle('urgent', Boolean(etat && etat.temps <= 3));
}

function afficherTable() {
  elements.table.replaceChildren();
  const nombre = etat.joueurs.length;
  etat.joueurs.forEach((joueur, index) => {
    const angle = Math.PI / 2 + (index / nombre) * Math.PI * 2;
    const carte = document.createElement('article');
    const choisitSens = etat.choixSens && index === etat.chef;
    const commence = !etat.choixSens && etat.premierTour && index === etat.actif;
    carte.className = `musicien${joueur.humain ? ' humain' : ''}${choisitSens || commence ? ' premier' : ''}`;
    carte.style.left = `${50 + Math.cos(angle) * 37}%`;
    carte.style.top = `${50 + Math.sin(angle) * 36}%`;
    const distancePile = nombre >= 6 ? 47 : 58;
    carte.style.setProperty('--pile-x', `${-Math.sin(angle) * distancePile}px`);
    carte.style.setProperty('--pile-y', `${Math.cos(angle) * distancePile}px`);
    carte.dataset.joueurIndex = index;
    const badge = choisitSens ? 'CHOISIT LE SENS' : (commence ? 'COMMENCE' : '');
    carte.innerHTML = `<div class="avatar">${joueur.avatar}</div><strong>${joueur.nom}</strong><span>${joueur.main.length} cartes · ${joueur.notes} ♪</span>${badge ? `<b class="badge-premier">${badge}</b>` : ''}<div class="pile-cartes"></div>`;
    const pile = carte.querySelector('.pile-cartes');
    joueur.historique.forEach((carteJouee, position) => {
      const conteneur = document.createElement('div');
      conteneur.className = 'derniere-carte';
      conteneur.style.setProperty('--position-pile', position);
      const miniature = document.createElement('div');
      miniature.className = 'mini-carte';
      appliquerFaceCarte(miniature, carteJouee.valeur, carteJouee.whootchi);
      conteneur.append(miniature);
      pile.append(conteneur);
    });
    elements.table.append(carte);
  });
}

function afficherMain() {
  elements.main.replaceChildren();
  const nombreCartes = etat.joueurs[0].main.length;
  elements.main.style.gridTemplateColumns = `repeat(${nombreCartes >= 5 ? 3 : nombreCartes}, 66px)`;
  elements.flip.hidden = !aRegle('whootchi');
  elements.flip.classList.toggle('actif', etat.faceMainWhootchi);
  elements.flip.setAttribute('aria-pressed', String(etat.faceMainWhootchi));
  etat.joueurs[0].main.forEach((carte, index) => {
    const bouton = document.createElement('button');
    bouton.className = 'carte';
    bouton.disabled = !etat.enCours || etat.choixSens;
    appliquerFaceCarte(bouton, carte.valeur, etat.faceMainWhootchi);
    bouton.innerHTML = `<span class="visuellement-cache">${nomCarte(carte.valeur, etat.faceMainWhootchi)}</span>`;
    bouton.addEventListener('click', () => jouerCarte(index, etat.faceMainWhootchi, 0));
    elements.main.append(bouton);
  });
}

function retournerMain() {
  if (!etat || !aRegle('whootchi')) return;
  etat.faceMainWhootchi = !etat.faceMainWhootchi;
  afficherMain();
}

function appliquerFaceCarte(element, valeur, whootchi) {
  const colonnesBrutes = [36, 382, 728, 1074, 1420, 1766];
  const index = (valeur - 1) * 2 + (whootchi ? 1 : 0);
  element.style.setProperty('--sprite-x', `${-colonnesBrutes[index % 6] * .33}px`);
  element.style.setProperty('--sprite-y', `${(index < 6 ? -36 : -384) * .33}px`);
  element.style.setProperty('--sprite-x-grand', `${-colonnesBrutes[index % 6] * .75}px`);
  element.style.setProperty('--sprite-y-grand', `${(index < 6 ? -36 : -384) * .75}px`);
}

function nomCarte(valeur, whootchi) {
  const multiplicateurs = ['', 'Double ', 'Triple ', 'Quadruple ', 'Quintuple ', 'Sextuple '];
  return `${multiplicateurs[valeur - 1]}${whootchi ? 'Whootchi' : 'Whoot'}`;
}

function ajouterAppuiLong(element, action) {
  let attente;
  let declenche = false;
  const commencer = () => {
    declenche = false;
    attente = setTimeout(() => { declenche = true; action(); }, 500);
  };
  const finir = (event) => {
    clearTimeout(attente);
    if (declenche) event.preventDefault();
  };
  element.addEventListener('pointerdown', commencer);
  element.addEventListener('pointerup', finir);
  element.addEventListener('pointerleave', finir);
}

function gererClavier(event) {
  if (!etat?.enCours) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < etat.joueurs[0].main.length) jouerCarte(index, etat.faceMainWhootchi, 0);
}

function arreterTemps() {
  clearInterval(minuterie);
  clearTimeout(actionIA);
  minuterie = null;
  actionIA = null;
}

function quitterPartie() {
  arreterTemps();
  if (elements.dialogue.open) elements.dialogue.close();
  if (elements.choixSens.open) elements.choixSens.close();
  if (elements.difficulte.open) elements.difficulte.close();
  etat = null;
  elements.rapport.hidden = true;
  changerPortraitMenu();
  elements.partie.classList.remove('actif');
  elements.accueil.classList.add('actif');
}

