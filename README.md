# 🎮 Crowd Ink - Jeu de Physique et Dessin

Un jeu web innovant où vous guidez une foule de personnages vers l'objectif en dessinant des structures physiques avec votre souris.

## 🚀 Fonctionnalités

### Mécaniques de jeu

- **Dessin physique** : Tracez des ponts, rampes et plateformes qui deviennent de vrais objets physiques
- **IA de foule** : Personnages intelligents qui naviguent, sautent et s'adaptent aux obstacles
- **Système d'encre** : Ressource limitée pour encourager la créativité et l'efficacité
- **Validation flexible** : Délai de grâce et validation manuelle par double-clic

### Interface moderne

- **HUD animé** : Statistiques en temps réel avec animations fluides
- **Contrôles intuitifs** : Clic gauche pour dessiner, clic droit pour effacer
- **Panneau de configuration** : Vitesse de jeu, auto-saut, verrouillage des contrôles
- **Feedback visuel** : Effets de validation, progression, états de jeu

### Challenges variés

- **10 challenges statiques** : Conçus à la main avec mécaniques uniques
- **Génération procédurale** : Défis infinis avec difficulté progressive
- **Types variés** : Traversées, escalades, parcours d'obstacles, navigation en pente

## 🎯 Comment jouer

1. **Démarrer** : Configurez vos préférences et cliquez "Commencer le Challenge"
2. **Dessiner** : Clic gauche maintenu pour tracer des structures
3. **Effacer** : Clic droit pour supprimer des zones
4. **Valider** : Double-clic pour terminer et calculer le score
5. **Objectif** : Amenez un maximum de personnages dans la zone verte

### Contrôles

- **Souris** : Dessin et effacement
- **Espace** : Pause/Reprendre
- **R** : Recommencer le challenge
- **N** : Challenge suivant
- **Double-clic** : Validation manuelle du score

## 🏗️ Architecture technique

### Structure modulaire

```
src/
├── core/
│   ├── Game.js              # Point d'entrée principal
│   ├── physics/
│   │   └── PhysicsEngine.js # Moteur physique optimisé
│   ├── entities/
│   │   ├── Character.js     # IA de personnage améliorée
│   │   └── CharacterManager.js
│   ├── drawing/
│   │   └── DrawingSystem.js # Système de dessin avancé
│   ├── rendering/
│   │   └── Renderer.js      # Moteur de rendu 2D
│   ├── input/
│   │   └── InputManager.js  # Gestion des entrées
│   ├── ui/
│   │   └── UIManager.js     # Interface utilisateur
│   ├── state/
│   │   └── GameState.js     # État global du jeu
│   └── challenges/
│       └── ChallengeManager.js # Gestion des défis
├── data/
│   └── challenges.js        # Définition des challenges
└── styles/
    └── main.css            # Styles modernes
```

### Technologies utilisées

- **Matter.js** : Moteur physique 2D
- **HTML5 Canvas** : Rendu graphique optimisé
- **ES6 Modules** : Architecture modulaire propre
- **CSS Grid/Flexbox** : Interface responsive
- **PWA** : Application web progressive

## 🎨 Fonctionnalités avancées

### Système de dessin

- **Lissage adaptatif** : Traits fluides avec algorithme Douglas-Peucker
- **Fusion intelligente** : Connexion automatique de traits proches
- **Optimisations spatiales** : Grille pour recherches rapides
- **Effets visuels** : Aperçu en temps réel, animations

### IA des personnages

- **Navigation naturelle** : Logique de chute réaliste, pas de demi-tours artificiels
- **Détection d'obstacles** : Raycast pour murs, falaises, pentes
- **Auto-saut intelligent** : Franchissement automatique d'obstacles raisonnables
- **Assistance pente** : Force supplémentaire pour monter les inclinaisons

### Moteur physique optimisé

- **Step fixe 60 FPS** : Simulation stable et prévisible
- **Chaînes de segments** : Traits comme vrais objets physiques
- **Cache d'optimisation** : Performances sur gros niveaux
- **Détection de collision** : AABB et raycast précis

## 🎪 Défis et variété

### Challenges statiques

1. **Premier Pont** - Introduction au dessin
2. **Escalier de Fortune** - Navigation verticale
3. **Canyon Perdu** - Traversée longue distance
4. **Chute Libre** - Guidage de la chute
5. **Forêt de Piliers** - Navigation entre obstacles
6. **Plateforme Mobile** - Timing et mouvement
7. **Tunnel Étroit** - Passages restreints
8. **Rampe Extrême** - Montées difficiles
9. **Îles Flottantes** - Saut de précision
10. **Labyrinthe Vertical** - Puzzle complexe

### Génération procédurale

- **Types** : Traversées, escalades, parcours, pentes, puzzles
- **Difficulté progressive** : Plus de personnages, obstacles complexes
- **Variété infinie** : Nouveaux défis à chaque partie

## 🏆 Système de score

### Calcul du score

- **Ratio de sauvetage** : Personnages sauvés / total (×1000 pts)
- **Efficacité d'encre** : Encre restante (×500 pts)
- **Bonus de temps** : Rapidité vs temps cible
- **Multiplicateur difficulté** : Bonus pour défis supplémentaires

### Système d'étoiles

- ⭐ **1 étoile** : Challenge réussi
- ⭐⭐ **2 étoiles** : 60%+ sauvés, 30%+ encre restante
- ⭐⭐⭐ **3 étoiles** : 80%+ sauvés, 50%+ encre, bonus temps

## 🚀 Démarrage rapide

1. **Cloner le projet**

```bash
git clone [url-du-repo]
cd projetnovateur
```

2. **Lancer le serveur local**

```bash
python3 -m http.server 5173
# ou
npm run dev
```

3. **Ouvrir dans le navigateur**

```
http://localhost:5173
```

## 🔧 Configuration

### Paramètres de jeu

- **Vitesse** : 0.5x à 2.0x (affecte le score)
- **Auto-saut** : Assistance pour franchir obstacles
- **Verrouillage vitesse** : Empêche changement en cours de jeu

### Paramètres avancés (dans le code)

```javascript
// DrawingSystem
config: {
  minPointDistance: 3,      // Distance minimale entre points
  trailThickness: 8,        // Épaisseur des traits
  inkCostPerPixel: 1,       // Coût d'encre par pixel
}

// Character
maxSpeed: 2.8,              // Vitesse maximale
jumpForce: 0.012,           // Force de saut
autoJump: true              // Saut automatique
```

## 📱 Support mobile

Le jeu supporte les écrans tactiles :

- **Touch** : Dessin au doigt
- **Responsive** : Interface adaptative
- **PWA** : Installation comme app native

## 🐛 Debug

Appuyez sur `D` pour activer le mode debug :

- Affichage FPS et statistiques
- Rayons de détection des personnages
- Grille de référence
- Informations de collision

## 🎮 Améliorations futures

- **Mode multijoueur** : Collaboration en temps réel
- **Éditeur de niveaux** : Création communautaire
- **Classements en ligne** : Compétition globale
- **Nouveaux outils** : Gomme, formes prédéfinies
- **Effets spéciaux** : Particules, shaders WebGL

---

**Développé avec ❤️ pour démontrer une architecture de jeu web moderne et performante.**


