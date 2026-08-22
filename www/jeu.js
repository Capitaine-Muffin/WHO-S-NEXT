/**
 * Le jeu. Tout part d'ici.
 *
 * La monétisation est déjà branchée plus bas : tant que les identifiants
 * ne sont pas renseignés dans `config.js`, elle ne fait rien et le jeu
 * tourne normalement dans un navigateur.
 */
import { CLE_REVENUECAT, DROITS, BLOC_BANNIERE, PRODUITS } from './config.js';
import { configurer, lireAchats, appliquer, surAchatsChanges } from './vendor/monetisation/achats.js';
import { demarrerPubs, montrerBanniere } from './vendor/monetisation/pubs.js';

let achats = [];

document.querySelector('#jouer').addEventListener('click', () => {
  // À remplacer par le jeu.
});

demarrer();

async function demarrer() {
  await configurer({ cle: CLE_REVENUECAT, correspondances: DROITS });

  // Le store fait foi ; `appliquer` ne remplace que s'il a vraiment répondu.
  achats = appliquer(achats, await lireAchats());
  surAchatsChanges((produits) => {
    achats = produits;
  });

  const sansPub = achats.includes(PRODUITS.SANS_PUB);
  if (await demarrerPubs({ testeur: location.hostname === 'localhost' })) {
    await montrerBanniere({ bloc: BLOC_BANNIERE, sansPub });
  }
}
