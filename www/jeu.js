const nomsIA = ['Mélodie', 'Tempo', 'Jazz', 'Riff', 'Punk', 'Bongo'];
const avatars = ['🎤', '🎸', '🥁', '🎷', '🎹', '🎺', '🪕'];
const tempsParNiveau = [14, 10, 8, 7, 6, 5, 4];

const elements = {
  accueil: document.querySelector('#accueil'),
  partie: document.querySelector('#partie'),
  nombreJoueurs: document.querySelector('#nombre-joueurs'),
  niveau: document.querySelector('#niveau'),
  dureeChrono: document.querySelector('#duree-chrono'),
  jouer: document.querySelector('#jouer'),
  quitter: document.querySelector('#quitter'),
  table: document.querySelector('#joueurs-table'),
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
};

let etat = null;
let minuterie = null;
let actionIA = null;

elements.jouer.addEventListener('click', demarrerPartie);
elements.quitter.addEventListener('click', quitterPartie);
elements.continuer.addEventListener('click', nouvelleManche);
elements.relancerChrono.addEventListener('click', relancerChrono);
elements.niveau.addEventListener('change', () => {
  elements.dureeChrono.value = tempsParNiveau[Number(elements.niveau.value)];
});
document.addEventListener('keydown', gererClavier);

function demarrerPartie() {
  const nombre = Number(elements.nombreJoueurs.value);
  const niveau = Number(elements.niveau.value);
  const dureeChrono = Math.max(1, Math.min(60, Number(elements.dureeChrono.value) || tempsParNiveau[niveau]));
  const joueurs = Array.from({ length: nombre }, (_, index) => ({
    nom: index === 0 ? 'Toi' : nomsIA[index - 1],
    humain: index === 0,
    avatar: avatars[index],
    notes: 0,
    main: [],
    derniere: null,
    erreurConsecutive: 0,
  }));

  etat = {
    joueurs,
    niveau,
    manche: 0,
    sens: Math.random() < .5 ? 1 : -1,
    actif: 0,
    dureeChrono,
    temps: dureeChrono,
    enCours: true,
  };

  elements.accueil.classList.remove('actif');
  elements.partie.classList.add('actif');
  nouvelleManche();
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
  etat.sens = Math.random() < .5 ? 1 : -1;
  etat.actif = etat.manche === 1 ? 0 : (etat.actif + etat.sens + etat.joueurs.length) % etat.joueurs.length;
  etat.joueurs.forEach((joueur) => {
    joueur.main = creerMain(etat.joueurs.length);
    joueur.derniere = null;
  });
  etat.enCours = true;
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

function jouerCarte(indexCarte, retourner = false, auteur = 0) {
  if (!etat?.enCours) return;
  const joueur = etat.joueurs[auteur];
  if (!joueur) return;

  if (auteur !== etat.actif) {
    sanctionner(joueur, `${joueur.nom} a joué alors que ce n'était pas son tour.`);
    return;
  }

  const carte = joueur.main[indexCarte];
  if (!carte) return;

  carte.whootchi = retourner && etat.niveau >= 1;

  if (estPoseInterdite(joueur, carte)) {
    sanctionner(joueur, 'Cette carte ne pouvait pas être jouée.');
    return;
  }

  arreterTemps();
  joueur.main.splice(indexCarte, 1);
  joueur.derniere = { ...carte };
  joueur.erreurConsecutive = 0;

  if (carte.whootchi) etat.sens *= -1;
  const distance = carte.valeur * etat.sens;
  etat.actif = (etat.actif + distance + etat.joueurs.length * 10) % etat.joueurs.length;

  if (joueur.main.length === 0) {
    terminerManche(true, `${joueur.nom} a joué toutes ses cartes sans fausse note.`);
    return;
  }

  afficher();
  commencerTour();
}

function estPoseInterdite(joueur, carte) {
  if (etat.niveau >= 3 && joueur.derniere && joueur.derniere.valeur === carte.valeur && joueur.derniere.whootchi === carte.whootchi) {
    return true;
  }

  if (etat.niveau >= 4) {
    const identiques = etat.joueurs.filter(({ derniere }) => derniere && derniere.valeur === carte.valeur && derniere.whootchi === carte.whootchi).length;
    if (identiques >= 2) return true;
  }
  return false;
}

function commencerTour() {
  arreterTemps();
  if (!etat?.enCours) return;

  const joueur = etat.joueurs[etat.actif];
  etat.temps = etat.niveau === 6 ? Math.max(1, etat.dureeChrono - etat.manche + 1) : etat.dureeChrono;
  elements.message.textContent = 'Qui doit jouer maintenant ?';
  afficher();

  minuterie = setInterval(() => {
    etat.temps -= 1;
    afficherChrono();
    if (etat.temps <= 0) sanctionner(joueur, `${joueur.nom} a dépassé le chrono.`);
  }, 1000);

  if (!joueur.humain) {
    const delai = 650 + Math.random() * Math.min(2100, etat.temps * 450);
    actionIA = setTimeout(() => jouerIA(joueur), delai);
  }
}

function relancerChrono() {
  if (!etat?.enCours) return;
  etat.temps = etat.niveau === 6 ? Math.max(1, etat.dureeChrono - etat.manche + 1) : etat.dureeChrono;
  afficherChrono();
  elements.chronoBloc.classList.remove('relance');
  void elements.chronoBloc.offsetWidth;
  elements.chronoBloc.classList.add('relance');
}

function jouerIA(joueur) {
  if (!etat?.enCours || etat.joueurs[etat.actif] !== joueur) return;

  const options = joueur.main
    .map((carte, index) => ({ carte, index }))
    .filter(({ carte }) => !estPoseInterdite(joueur, carte));

  if (Math.random() < probabiliteErreur()) {
    sanctionner(joueur, `${joueur.nom} s'est emmêlé dans le rythme.`);
    return;
  }

  const choix = options[Math.floor(Math.random() * options.length)];
  if (!choix) {
    sanctionner(joueur, `${joueur.nom} n'avait aucun coup valable.`);
    return;
  }

  const retourner = etat.niveau >= 1 && Math.random() < .32;
  jouerCarte(choix.index, retourner, etat.joueurs.indexOf(joueur));
}

function probabiliteErreur() {
  return .03 + etat.niveau * .012;
}

function sanctionner(joueur, raison) {
  if (!etat?.enCours) return;
  arreterTemps();
  etat.enCours = false;
  joueur.erreurConsecutive += 1;
  const penalite = etat.niveau >= 4 ? Math.min(3, joueur.erreurConsecutive) : 1;
  joueur.notes += penalite;
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
  elements.dialogue.showModal();
}

function afficher() {
  if (!etat) return;
  elements.niveauAffiche.textContent = `Niveau ${etat.niveau}`;
  elements.mancheAffiche.textContent = `Manche ${etat.manche} · sens ${etat.sens === 1 ? 'horaire' : 'antihoraire'}`;
  const notes = etat.joueurs[0].notes;
  elements.notesJoueur.textContent = `${notes} fausse note${notes === 1 ? '' : 's'}`;
  afficherChrono();
  afficherTable();
  afficherMain();
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
    carte.className = `musicien${joueur.humain ? ' humain' : ''}`;
    carte.style.left = `${50 + Math.cos(angle) * 37}%`;
    carte.style.top = `${50 + Math.sin(angle) * 36}%`;
    carte.innerHTML = `<div class="avatar">${joueur.avatar}</div><strong>${joueur.nom}</strong><span>${joueur.main.length} cartes · ${joueur.notes} ♪</span>${joueur.derniere ? '<div class="derniere-carte"><div class="mini-carte"></div></div>' : ''}`;
    if (joueur.derniere) {
      appliquerFaceCarte(carte.querySelector('.mini-carte'), joueur.derniere.valeur, joueur.derniere.whootchi);
    }
    elements.table.append(carte);
  });
}

function afficherMain() {
  elements.main.replaceChildren();
  etat.joueurs[0].main.forEach((carte, index) => {
    const bouton = document.createElement('button');
    bouton.className = 'carte';
    bouton.disabled = !etat.enCours;
    appliquerFaceCarte(bouton, carte.valeur, false);
    bouton.innerHTML = `<span class="visuellement-cache">${nomCarte(carte.valeur, false)}${etat.niveau >= 1 ? ', appui long pour la face Whootchi' : ''}</span>`;
    bouton.addEventListener('click', () => jouerCarte(index, false, 0));
    if (etat.niveau >= 1) ajouterAppuiLong(bouton, () => jouerCarte(index, true, 0));
    elements.main.append(bouton);
  });
}

function appliquerFaceCarte(element, valeur, whootchi) {
  const colonnes = [18, 191, 364, 537, 710, 883];
  const index = (valeur - 1) * 2 + (whootchi ? 1 : 0);
  element.style.setProperty('--sprite-x', `${-colonnes[index % 6]}px`);
  element.style.setProperty('--sprite-y', `${index < 6 ? -18 : -192}px`);
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
  if (index >= 0 && index < etat.joueurs[0].main.length) jouerCarte(index, event.shiftKey, 0);
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
  etat = null;
  elements.partie.classList.remove('actif');
  elements.accueil.classList.add('actif');
}

