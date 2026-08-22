# Consignes

Jeu mobile de Capitaine Muffin, parti de `modele-jeu-mobile`.

## Style de réponse

Réponses **courtes**. Va droit au but.

- Pas de récapitulatif après chaque action : dis ce qui est fait en une phrase.
- Pas de tableau ni de liste d'options si on ne t'en demande pas.
- Pas de « pour aller plus loin », pas de suggestions non sollicitées.
- Si une question a une réponse en une ligne, réponds en une ligne.

## Les règles du dépôt

1. **Zéro build.** HTML/CSS/JS natif, servi tel quel. Pas de bundler, pas de
   TypeScript, pas de CDN — le jeu doit marcher hors ligne.
2. **Le jeu vit dans `www/`.** `index.html`, `style.css`, `jeu.js`, et les
   identifiants dans `config.js`.
3. **Jouable au clavier ET au tactile**, responsive, sans défilement
   horizontal. Il sera testé depuis un téléphone.
4. **Le français partout** : textes, commentaires, messages de commit. Les
   identifiants de code restent en anglais quand c'est l'usage.

## Monétisation

Elle vient du paquet partagé `@capitaine-muffin/monetisation`, recopié dans
`www/vendor/` par `npm run preparer`.

**Ne pas la réécrire dans le jeu.** Chacun de ses garde-fous vient d'un bug
qui a coûté de l'argent en production, et ils sont commentés. Un correctif
se fait dans le paquet, où il profite à tous les jeux.

⚠️ Un droit RevenueCat par produit vendu. Un droit qui en porte plusieurs
est acquis dès qu'un **seul** est acheté.

## Publier

`git tag vX.Y.Z && git push --tags` — la CI fait le reste.

Ne jamais envoyer une version à la main depuis la Play Console : le
`versionCode` serait choisi à la main, et Play refuse un numéro déjà
utilisé.

La procédure Store complète, avec les pièges qui ne produisent aucune
erreur, est dans
[publier-sur-play](https://github.com/Capitaine-Muffin/publier-sur-play).

## À ne jamais commiter

La clé de signature (`*.jks`), le JSON du compte de service Google, une clé
RevenueCat secrète (`sk_`). Ils vivent dans les secrets GitHub.
