# 🧟 The March of the Dead — escape game (cours d'anglais)

Paris tombe aux mains des **zombies à képi**. Deux équipes de 6 mènent chacune leur cortège de **République** jusqu'au **bunker de l'Élysée** avant la fin du chrono (30 min).
Chaque joueur a **son propre téléphone** et des **indices différents** : on est obligé de se parler (en anglais).
Le tableau projeté (page admin) montre la carte de Paris, les deux cortèges en direct, le chrono, et accueille les **duels synchronisés**.

## Le parcours

| # | Lieu | Épreuve | Mécanique | Critère de la grille |
|---|------|---------|-----------|----------------------|
| 1 | République | 🎺 **The Lost Fanfare** | 6 musiciens répartis sur les téléphones : on les remet dans l'ordre grâce à leurs phrases, on lit leurs notes sur la portée (moyen mnémotechnique anglais *Every Good Boy Deserves Fun* / *FACE*) → mot de passe **FACADE** | Musique, logique |
| 2 | Châtelet | 🎙️ **Street Interviews** | 6 témoins audio avec des accents différents (UK, US, Australie, Irlande, Inde) ; l'un d'eux est un zombie qui ment → le seul pont sûr (**Pont Neuf**) | Ambiance, compréhension orale |
| ⚔️ | Le Marais | **BRAV-M Raid** (duel) | Façon Fruit Ninja sur les 12 téléphones en même temps : on tranche les zombies (+1), pas les touristes (−3). Scores en direct au tableau | Engagement |
| 3 | Pont Neuf | 🧒 **Six or Seven?** | Les enfants zombies posent des questions dont la réponse est 6 ou 7 ; chaque joueur doit en réussir 4 | Fun, rythme |
| 4 | Louvre | 🎨 **The Stolen Masterpiece** | Téléphone arabe dessiné : un seul joueur voit *La Liberté guidant le peuple* ; le reste de la chaîne alterne descriptions et dessins, et le dernier retrouve le tableau parmi 6 | Art visuel |
| 🎤 | Opéra Garnier | **Karaoke Duel** (duel) | Chaque équipe réécrit le refrain de *When the Saints Go Marching In* sur ses téléphones, puis le chante au tableau avec la musique ; le prof désigne le gagnant | Musique, engagement |
| 5 | Élysée | 🪖 **The Zombie General** | Méta-énigme : le code du bunker (4 chiffres) se déduit des cartes récoltées à chaque étape (inventaire 🎒) | Logique et structure |

**Mécaniques transversales**
- ❌ Mauvaise réponse → **attaque zombie** : les téléphones de l'équipe sont bloqués pendant 20 à 30 s.
- 💡 **Indices** : ils coûtent un jeton 🎟️, ou 30 s d'attaque si l'équipe n'en a plus.
- 🕵️ **Missions secrètes** : chaque joueur en a une sur son téléphone, par exemple « fais dire *baguette* à l'autre équipe ». Le prof valide depuis l'admin et l'équipe gagne un jeton.
- ⚔️ **Duels** : le gagnant reçoit +1 jeton, le perdant subit une attaque de 30 s.
- 🟢 Au tableau, Paris **verdit** et les zombies encerclent la carte au fil du temps.

## Tester tout de suite (sans rien installer)

Sans configuration, le jeu tourne en **mode local** : tous les onglets d'un même navigateur partagent la partie.

```bash
python3 -m http.server 8000
```

Puis ouvrir :
- `http://localhost:8000/admin.html` (le tableau)
- `http://localhost:8000/index.html?team=red` dans 2 ou 3 autres onglets (un onglet = un joueur), idem avec `team=blue`

Dans l'admin, le bouton ⚙️ (ou la touche **C**) ouvre les contrôles : START, lancer les duels, débloquer une équipe, sauter une étape, valider les missions…

## Le jour J : téléphones + vidéoprojecteur

Il faut une petite base de données temps réel (gratuite) et un hébergement (gratuit).

### 1. Firebase (environ 5 minutes)
1. Aller sur https://console.firebase.google.com → **Créer un projet** (Google Analytics inutile).
2. Menu **Build → Realtime Database → Créer une base de données** → région Europe → **mode test**.
3. Onglet **Règles**, coller puis publier :
   ```json
   { "rules": { "games": { ".read": true, ".write": true } } }
   ```
4. **Paramètres du projet (⚙️) → Vos applications → icône `</>` (Web)** → enregistrer l'app → copier l'objet `firebaseConfig`.
5. Le coller dans `js/config.js` à la place de `firebase: null` (il doit contenir `databaseURL`).

> La clé Firebase d'une app web n'est pas un secret : elle peut être dans le dépôt public. Les règles ci-dessus laissent quiconque a l'URL écrire dans `games/`. C'est acceptable pour une partie en classe, mais videz la base après le jeu.

### 2. Hébergement GitHub Pages
Dans le dépôt GitHub : **Settings → Pages → Deploy from a branch** → choisir la branche et `/ (root)`.
L'adresse ressemble à `https://<compte>.github.io/escapegame/`. L'admin est à `…/admin.html`, et ses QR codes pointent automatiquement vers la bonne page joueur.

### 3. En classe
1. Projeter `admin.html` (un ordinateur, plein écran avec F11).
2. Les élèves scannent le QR de leur équipe et entrent leur prénom.
3. Appuyer sur ⚙️ → **START**.
4. Vers **8 min** : ⚔️ raid. Vers **18 min** : 🎤 karaoké (dans ⚙️).
5. Pendant la partie, valider les missions secrètes (pastille rouge sur ⚙️).
6. À la fin : **🎨 Louvre chains** pour revoir en grand les dessins des élèves (succès garanti).

Pour la 2ᵉ partie, utiliser **↺ New game (keep players)**, ou changer `gameId` dans `js/config.js`.

## Tableaux (images)

Les images des tableaux sont chargées depuis Wikimedia Commons sur les téléphones. Pour ne pas dépendre du réseau, déposez vos propres fichiers dans `img/paintings/` sous les noms : `liberty.jpg`, `medusa.jpg`, `sardanapalus.jpg`, `horatii.jpg`, `coronation.jpg`, `monalisa.jpg` (ils sont prioritaires). Si aucune image ne charge, un cadre avec le titre s'affiche.

## Modifier le jeu

**Tous les textes** (intro, indices, réponses, témoins, devinettes, missions, paroles du karaoké, noms d'équipes) sont dans `js/content.js`. Pas besoin de toucher au reste.
La durée et Firebase sont dans `js/config.js`.

| Fichier | Rôle |
|---|---|
| `index.html` + `js/player.js` | application joueur (téléphone) |
| `admin.html` + `js/admin.js` | tableau projeté + contrôles du maître du jeu |
| `js/common.js` | mascotte zombie, sons, actions communes |
| `js/sync.js` | synchronisation (Firebase ou mode local) |
| `vendor/` | Firebase et générateur de QR embarqués (aucun CDN nécessaire) |

## Avant la note : playtest !

La grille demande de **consulter des testeurs**. Faites une partie avec des amis ou une autre classe, chronométrez chaque étape, notez où ils bloquent, et ajustez les indices et les durées dans `content.js`. Mentionnez-le dans la présentation.

Pour l'oral, chaque critère a sa réponse :
- **Engagement** : course, duels en direct, missions secrètes, humour.
- **Environnement** : carte vivante, sons, accents, musique (fanfare, karaoké) et art (Delacroix, Louvre).
- **Logique et structure** : 5 étapes, un inventaire, une méta-énigme finale.
- **Jouabilité** : un téléphone par joueur, indices, déblocage par l'admin, difficulté progressive.
