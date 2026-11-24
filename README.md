# 🧟 The March of the Dead — escape game (cours d'anglais)

Paris tombe aux mains des **zombies à képi**. Deux équipes de 6 mènent chacune leur cortège de **République** jusqu'au **bunker de l'Élysée** avant la fin du chrono (30 min).
Chaque joueur a **son propre téléphone** et des **indices différents** : on est obligé de se parler (en anglais).
Le tableau projeté (page admin) montre la carte de Paris, les deux cortèges en direct, le chrono, et accueille les **duels synchronisés**.

## Le parcours

| # | Lieu | Épreuve | Mécanique | Réponse |
|---|------|---------|-----------|---------|
| 1 | République | 🔒 **The Locked Banner** | 6 devinettes anglaises classiques réparties sur les téléphones (*What has a neck but no head?*…). Les premières lettres des réponses ouvrent le cadenas | `BANNER` |
| 2 | Châtelet | 📻 **The Zombie Radio** | Message codé en emojis ; chaque joueur a un morceau de la clé (🧟 = T…). Le message décodé donne le code du métro, écrit en toutes lettres en anglais | `9185` |
| ⚔️ | Le Marais | **BRAV-M Raid** (duel) | Façon Fruit Ninja sur les 12 téléphones en même temps : on tranche les zombies (+1), pas les touristes (−3). Scores en direct au tableau | — |
| 3 | Pont Neuf | 🤲 **Six… Seven!** | L'équipe appelle le juge depuis un téléphone, se lève et fait le geste six-seven devant le tableau ; le prof clique ✅ ou ❌ | — |
| 4 | Louvre | 🎨 **Artists Only** | Pictionary : un joueur dessine un mot simple, les autres voient le dessin en direct et devinent en anglais. 2 dessins à trouver, dont une œuvre (*Mona Lisa* / *The Scream*) | — |
| 🎤 | Opéra Garnier | **Karaoke Duel** (duel) | *Jingle Bells* avec 4 mots manquants à retrouver sur les téléphones ; correction automatique au tableau, puis tout le monde chante sur la musique et le prof désigne le gagnant | — |
| 5 | Élysée | 🪖 **The Zombie General** | Le code du bunker (4 chiffres) se déduit des cartes récoltées à chaque étape (inventaire 🎒) | `6973` |

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
6. Pont Neuf : quand une équipe appelle le juge, un grand écran s'affiche au tableau → ✅ ou ❌.
7. À la fin : **🎨 Louvre drawings** pour revoir en grand les dessins des élèves.

Pour la 2ᵉ partie, utiliser **↺ New game (keep players)**, ou changer `gameId` dans `js/config.js`.

## Changer la chanson du karaoké

*Jingle Bells* est libre de droits, c'est pourquoi c'est la chanson par défaut. Pour un autre classique, dans `js/content.js` → `karaoke` :
- remplacez `song`, `lines` (les paroles, avec `{b1}`, `{b2}`… à la place des mots à faire trouver) et `blanks` (les bonnes réponses) ;
- mettez dans `youtube` un lien vers la musique : le bouton du tableau ouvrira ce lien au lieu de jouer la mélodie intégrée.

## Modifier le jeu

**Tous les textes** (intro, indices, réponses, devinettes, message codé, mots à dessiner, missions, paroles du karaoké, noms d'équipes) sont dans `js/content.js`. Pas besoin de toucher au reste.
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
- **Environnement** : carte vivante qui se fait envahir, sons, musique (karaoké) et art (Louvre, Mona Lisa, The Scream).
- **Logique et structure** : 5 étapes, un inventaire, une méta-énigme finale.
- **Jouabilité** : un téléphone par joueur, indices, déblocage par l'admin, difficulté progressive.
