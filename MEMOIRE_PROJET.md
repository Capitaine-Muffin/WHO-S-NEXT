# Mémoire du projet Who's Next?

Dernière mise à jour : 25 août 2026 — version de test `v56`.

## Référence et autorité

- Dépôt : `Capitaine-Muffin/WHO-S-NEXT`
- Jeu en ligne : https://capitaine-muffin.github.io/WHO-S-NEXT/
- L'utilisateur est l'auteur du jeu de société. Ses précisions priment sur le PDF des règles.
- Direction graphique : fond jaune `#ffea6d`, logos et cartes officiels fournis par l'auteur.
- Le jeu doit rester très lisible sur téléphone, y compris pour des personnes âgées : gros textes, actions évidentes, peu de menus déroulants.

## Vision du produit

Adaptation mobile de Who's Next? pour 2 à 7 joueurs :

1. mode local contre des bots ;
2. mode multijoueur en ligne à brancher sur Supabase ;
3. future application mobile utilisant la même interface web ;
4. RevenueCat pourra servir plus tard à la monétisation, mais n'est pas utile au moteur multijoueur.

GitHub Pages héberge l'interface statique. Supabase doit gérer les comptes, salons et états des parties en ligne.

## Règles de base validées

- Les places sont nommées `J1`, `J2`, `J3`, etc.
- En solo, J1 est le joueur humain ; J2 à J7 sont les bots.
- En multijoueur, ces mêmes places pourront être occupées par de vrais joueurs.
- Au début d'une manche, le premier joueur choisit seulement son voisin de droite ou de gauche. Ce choix fixe le sens du jeu.
- Le voisin choisi pose la première carte. Une flèche simple `→` ou `←` est affichée devant chaque joueur pour ce premier coup uniquement.
- La valeur de la carte indique de combien de joueurs avancer dans le sens du jeu.
- Il ne faut jamais afficher automatiquement « à qui de jouer » après le premier coup : le cœur du jeu consiste à le deviner.
- Une carte Whootchi inverse le sens ; Whoot et Whootchi sont considérées comme deux cartes différentes.
- Les cartes restent dans la main et peuvent être jouées indéfiniment.
- Chaque joueur possède une carte de chaque valeur disponible : à 4 joueurs, Whoot, Double Whoot et Triple Whoot seulement.
- Jusqu'à quatre cartes, la main tient sur une ligne. À cinq ou six cartes, elle passe sur deux lignes.
- Le bouton Flip retourne toute la main en Whootchi et peut être préparé hors tour.
- Le minuteur est réglable jusqu'à 8 secondes. Le toucher le relance immédiatement depuis sa durée complète.
- Une manche s'arrête sur une fausse note. Le joueur fautif commence la manche suivante et choisit le sens.
- La partie normale s'arrête dès qu'un joueur atteint 7 fausses notes. Le ou les joueurs avec le moins de notes gagnent.

## Règles optionnelles validées

### Whootchi

Active le verso Whootchi des cartes et l'inversion du sens.

### Répétition — un seul joueur

Cette règle examine chaque joueur séparément. Quand son tour revient, un joueur fait une fausse note s'il rejoue exactement la même carte que lors de son propre tour précédent. Les cartes jouées entre-temps par les autres ne comptent pas.

### Trio interdit — tous les joueurs

Cette règle examine toute la table. Si deux cartes exactement identiques sont déjà visibles devant n'importe quels joueurs, poser une troisième carte identique provoque une fausse note.

### Maillon faible

La règle s'applique uniquement quand il existe à la fois :

- un unique leader avec le moins de fausses notes ;
- un unique point faible avec le plus de fausses notes.

L'unique leader ne peut pas viser l'unique point faible. En cas d'égalité au minimum ou au maximum, la règle ne s'applique pas. Elle est également ignorée lorsqu'il ne reste que deux joueurs actifs.

### Mort subite

À 7 fausses notes, le joueur est éliminé. La partie continue jusqu'à deux survivants ; celui qui possède le moins de fausses notes gagne.

## Difficultés prédéfinies

| Mode | Temps | Réussite des bots | Règles |
|---|---:|---:|---|
| Débutant | 8 s | 70 % | aucune règle spéciale |
| Intermédiaire | 5 s | 80 % | Whootchi |
| Expert | 3 s | 90 % | Whootchi, Répétition, Trio interdit |
| Impossible | 2 s | 95 % | règles Expert + Maillon faible |

Les paramètres avancés permettent d'activer chaque règle indépendamment, de régler le chrono, l'animation et le niveau des bots. Le niveau 10 possède 99 % de réussite, jamais 100 %.

Les bots choisissent aléatoirement parmi leurs cartes légales et jouent à un moment aléatoire entre le début et la fin du chrono. Un bot ne peut pas faire une erreur hors tour immédiatement après avoir lui-même joué.

## Interface de partie

- J1 se trouve en bas de l'écran.
- Aucune information secondaire n'est affichée sous le nom des joueurs : la ligne « cartes · fausses notes » a été supprimée.
- Les numéros J1, J2, J3, etc. sont affichés directement dans les avatars, avec un petit instrument accroché sur le côté. Aucun nom n'est placé sous l'avatar, afin de libérer la zone des cartes dans toutes les configurations et les tutoriels.
- Les adversaires sont disposés autour de la table et la pendule reste au centre.
- La pendule est volontairement petite et vibre légèrement dans l'urgence ; elle ne doit pas se déplacer sur la table.
- Une carte jouée apparaît d'abord en grand avec le nom du joueur, reste visible, puis se réduit vers sa place.
- Les deux dernières cartes posées devant chaque joueur sont empilées avec un léger décalage.
- Les animations ne doivent pas bloquer une nouvelle pose de carte.
- Lors d'une fausse note, la carte fautive est montrée, le joueur fautif passe en rouge, puis le bilan s'ouvre après l'animation.
- La durée des animations est réglable : normale, rapide ou désactivée.

## Rapport de partie

- Accessible depuis la zone de la main et depuis le bilan de fausse note.
- La fenêtre couvre la main afin de laisser la table visible.
- Le replay commence au début de la manche concernée, pas à la dernière action.
- Les flèches gauche et droite parcourent les actions.
- À chaque étape contenant une carte, celle-ci est rejouée avec une animation vers son joueur.
- La carte apparaît dans la pile exactement à la fin de son animation et le joueur qui agit est signalé en rouge.
- Si une carte est jouée hors tour, le fautif est rouge et le joueur qui devait jouer est indiqué en vert. Un simple dépassement du chrono ne déclenche pas ce marquage vert.
- Un anneau autour de la pendule reconstitue le sens du jeu et s'inverse au passage d'une carte Whootchi.
- Fermer le rapport restaure la table en direct et, si nécessaire, le bilan de fausse note.

## Tutoriels

Le menu Tutoriel contient un parcours « NOUVEAU JOUEUR — Clique ici ! » et un tutoriel par règle.

Principes d'affichage :

- cinq étapes clairement numérotées ;
- police et boutons très grands ;
- anneau animé autour de la pendule pour montrer le sens ;
- petite flèche sous J1 pendant l'exemple ;
- animation de pose plus lente que dans une vraie partie ;
- la carte demandée tremble légèrement, est entourée et porte l'indication « TOUCHE ICI ».

Le tutoriel de base commence par faire choisir le sens à J1 : pour l'exercice, seule la flèche vers le voisin de gauche est active. Il contient ensuite deux échanges. D'abord, J2 joue Double Whoot : `1 · J3`, `2 · J4`; J4 joue ensuite Whoot et amène le jeu sur J1, qui joue Whoot. Puis J2 joue Triple Whoot : `1 · J3`, `2 · J4`, `3 · J1`; J1 termine en jouant librement la carte de son choix.

## État du multijoueur

- `www/multijoueur.js` contient l'interface de création et de connexion à un salon.
- `www/supabase-config.js` est prévu pour la configuration publique Supabase.
- `supabase/schema.sql` contient le premier schéma de données.
- Les places du salon sont affichées J1, J2, J3, etc., avec le nom choisi par chaque personne.
- Le moteur temps réel complet n'est pas encore branché : synchronisation des poses, chrono partagé, reconnexion, autorité serveur et fin de partie restent à réaliser.
- Ne jamais enregistrer de clé secrète Supabase dans GitHub. Seule la clé publique anonyme peut être utilisée côté client, avec des règles RLS correctes.

## Architecture technique

- HTML natif : `www/index.html`
- Styles : `www/style.css`
- Moteur solo et tutoriels : `www/jeu.js`
- Préparation multijoueur : `www/multijoueur.js`
- Configuration Supabase : `www/supabase-config.js`
- Schéma Supabase : `supabase/schema.sql`
- Visuels officiels : `www/assets/`

Pas de framework, bundler ou CDN. Le projet doit rester léger, tactile, utilisable au clavier et compatible avec GitHub Pages.

## Méthode de reprise

Lors d'une nouvelle conversation :

1. lire ce fichier en entier ;
2. consulter les derniers commits et la version GitHub Pages ;
3. considérer les demandes de l'auteur comme la source de vérité ;
4. préserver l'interface mobile et les visuels officiels ;
5. vérifier le JavaScript avant chaque publication ;
6. pousser sur `main`, puis fournir un lien avec un paramètre de cache `?v=...`.

## Prochaines étapes probables

- Tester visuellement tous les tutoriels sur petit écran.
- Ajuster les flèches et animations selon les retours de l'auteur.
- Tester toutes les configurations de 2 à 7 joueurs.
- Compléter le véritable mode multijoueur Supabase.
- Préparer l'emballage en application mobile quand la boucle de jeu sera stabilisée.

