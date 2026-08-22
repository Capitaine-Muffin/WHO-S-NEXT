# modele-jeu-mobile

Le dépôt dont part chaque nouveau jeu mobile de Capitaine Muffin.

Bouton **Use this template** en haut de la page GitHub → nouveau dépôt →
suivre les six étapes ci-dessous. Le jeu est alors publiable par un tag,
sans jamais ouvrir la Play Console pour envoyer une version.

## Démarrer un jeu

1. **Nommer le jeu** — dans `capacitor.config.json`, remplacer `appId`
   (`com.capitainemuffin.MONJEU`) et `appName`. L'`appId` ne pourra plus
   jamais changer une fois l'app créée dans Play : le choisir sérieusement.
2. **Installer** — `npm install`
3. **Coder** — tout est dans `www/` : `index.html`, `style.css`, `jeu.js`.
   Voir plus bas pour ce qui est attendu d'un jeu.
4. **Essayer** — `npm run servir` puis <http://localhost:8000>
5. **Sur téléphone** — `npm run android` (ouvre Android Studio)
6. **Publier** — créer l'app dans Play Console, puis poser les secrets
   (voir ci-dessous) et `git tag v1.0.0 && git push --tags`

## Ce que le modèle apporte déjà

- **Zéro build** : HTML/CSS/JS servis tels quels, aucun bundler. Un jeu
  s'ouvre dans un navigateur en double-cliquant.
- **Achats et publicités branchés** via
  [monetisation](https://github.com/Capitaine-Muffin/monetisation), avec les
  garde-fous qui ont coûté une journée sur Flirt. Tant que `www/config.js`
  est vide, ils ne font rien et le jeu tourne normalement.
- **Publication automatique** : un tag `v*` fabrique l'`.aab`, vérifie que
  le paquet contient bien la version du dépôt, et l'envoie en test interne.
  Le bouton *Run workflow* permet de choisir une autre piste.
- **Le `versionCode` calculé** à partir du numéro de run, jamais saisi à la
  main — Play refuse un numéro déjà utilisé.

## Ce qu'on attend d'un jeu

- **Jouable au clavier ET au tactile.** Un jeu qui exige un clavier est un
  jeu à moitié testé : il sera essayé depuis un téléphone.
- **Responsive**, sans défilement horizontal, et qui remplit l'écran.
- **Aucune ressource externe** : pas de CDN, pas de police distante. Tout
  est local ou dessiné en code — le jeu doit marcher hors ligne.
- **Un score et un meilleur score** quand le genre s'y prête : c'est ce qui
  fait revenir.

## Les secrets à poser une fois par jeu

Dépôt GitHub → *Settings* → *Secrets and variables* → *Actions* :

| Secret | D'où il vient |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | la clé de signature, encodée en base64 |
| `ANDROID_KEYSTORE_PASSWORD` | " |
| `ANDROID_KEY_ALIAS` | " |
| `ANDROID_KEY_PASSWORD` | " |
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | le JSON du compte de service Google, avec le droit de publier |

La clé de signature se génère une fois par jeu :

```bash
keytool -genkeypair -v -keystore cle.jks -alias cle \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 cle.jks   # à coller dans ANDROID_KEYSTORE_BASE64
```

⚠️ **Garder `cle.jks` en lieu sûr, hors du dépôt.** Sans elle, il devient
impossible de mettre le jeu à jour : Play n'accepte que des versions signées
avec la même clé.

## Le reste

Créer l'app dans Play Console, remplir les déclarations, créer les produits
et fixer les prix : c'est une heure de travail, une fois par jeu, et la
marche à suivre — avec les pièges qui ne produisent aucune erreur — est
dans [publier-sur-play](https://github.com/Capitaine-Muffin/publier-sur-play).

La fabrication de l'`.aab` est décrite dans [`docs/BUILD.md`](docs/BUILD.md).
