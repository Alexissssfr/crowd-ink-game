import { PhysicsEngine } from "./physics/PhysicsEngine.js";
import { Renderer } from "./rendering/Renderer.js";
import { InputManager } from "./input/InputManager.js";
import { UIManager } from "./ui/UIManager.js";
import { CharacterManager } from "./entities/CharacterManager.js";
import { DrawingSystem } from "./drawing/DrawingSystem.js";
import { ChallengeManager } from "./challenges/ChallengeManager.js";
import { GameState } from "./state/GameState.js";
import { SoundManager } from "./audio/SoundManager.js";
import { ZoneManager } from "./zones/ZoneManager.js";
import { challenges } from "../data/challenges.js";

/**
 * Classe principale du jeu - Point d'entrée et orchestrateur
 */
export class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");

    // Configuration du canvas
    this.setupCanvas();

    // Gestionnaires principaux
    this.state = new GameState();
    this.physics = new PhysicsEngine();
    this.renderer = new Renderer(this.canvas, this.ctx);
    this.input = new InputManager(this.canvas);
    this.ui = new UIManager();
    this.soundManager = new SoundManager();
    this.zoneManager = new ZoneManager();
    this.characters = new CharacterManager(
      this.physics,
      this.state,
      this.soundManager
    );
    this.drawing = new DrawingSystem(this.physics, this.state);
    this.challengeManager = new ChallengeManager(challenges);

    // Passer les gestionnaires à l'UI et au GameState
    this.ui.soundManager = this.soundManager;
    this.ui.zoneManager = this.zoneManager;

    // S'assurer que le GameState est initialisé avant d'appeler setSoundManager
    if (this.state && typeof this.state.setSoundManager === "function") {
      this.state.setSoundManager(this.soundManager);
    } else {
      console.warn("⚠️ GameState ou setSoundManager non disponible");
    }

    // Rendre le zoneManager accessible globalement pour les personnages
    window.zoneManager = this.zoneManager;

    // Liaison des événements
    this.bindEvents();

    // État initial
    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.timeStep = 1 / 60; // 60 FPS fixe pour la physique
    this.lastCountdownSecond = 0;
  }

  setupCanvas() {
    this.canvas.width = 1200;
    this.canvas.height = 700;

    // Ajustement responsive
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  resizeCanvas() {
    const container = document.getElementById("game-container");
    const rect = container.getBoundingClientRect();
    const aspect = this.canvas.width / this.canvas.height;

    let width = rect.width * 0.95;
    let height = width / aspect;

    if (height > rect.height * 0.85) {
      height = rect.height * 0.85;
      width = height * aspect;
    }

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  bindEvents() {
    // Événements de dessin (toujours actifs)
    this.input.onDrawStart = (point) => {
      this.drawing.startStroke(point);
      if (this.soundManager && typeof this.soundManager.playDraw === 'function') {
        this.soundManager.playDraw();
      }
    };
    this.input.onDrawMove = (point) => this.drawing.continueStroke(point);
    this.input.onDrawEnd = () => {
      this.drawing.finishStroke();
      // Pas de son à la fin du dessin pour éviter la répétition
    };
    this.input.onErase = (point) => this.drawing.eraseAt(point);

    // Événements de validation
    this.input.onDoubleClick = () => this.validateScore();

    // Événements UI
    this.ui.onStartGame = (settings) => {
      this.startChallenge(settings);
    };
    this.ui.onReset = () => {
      this.resetChallenge();
    };
    this.ui.onNext = () => {
      this.nextChallenge();
    };
    this.ui.onValidate = () => {
      this.validateScore();
    };
    this.ui.onSpeedChange = (speed) => {
      this.setGameSpeed(speed);
    };
    this.ui.onChallengeSelect = (index) => {
      this.loadChallenge(index);
    };

    // Populer la liste des challenges dans l'UI
    this.ui.populateChallengeList(this.challengeManager.getAllChallenges());

    // Raccourcis clavier
    document.addEventListener("keydown", (e) => {
      if (e.code === "KeyR") {
        this.resetChallenge();
      } else if (e.code === "KeyN") {
        this.nextChallenge();
      } else if (e.code === "KeyT") {
        // Test audio avec la touche T
        console.log("🔊 Test audio avec la touche T");
        this.soundManager.testAudio();
      }
    });
  }

  start() {
    // S'assurer que le soundManager est connecté au GameState
    if (this.state && typeof this.state.setSoundManager === 'function') {
      this.state.setSoundManager(this.soundManager);
      console.log("✅ SoundManager connecté au GameState");
      
      // Vérifier que le soundManager est bien initialisé
      if (this.soundManager) {
        console.log("🔊 SoundManager disponible:", {
          hasPlayTimerBeep: typeof this.soundManager.playTimerBeep === 'function',
          hasPlaySuccess: typeof this.soundManager.playSuccess === 'function',
          hasPlayTone: typeof this.soundManager.playTone === 'function'
        });
      }
    }

    // Charger le premier challenge par défaut
    this.loadChallenge(0);

    // Permettre le dessin même avant de cliquer "Démarrer"
    this.state.isPlaying = true;

    // Afficher le panneau de démarrage
    this.ui.showStartPanel();

    // Démarrer la boucle de rendu
    this.lastTime = performance.now();
    this.gameLoop();
  }

  startChallenge(settings) {
    console.log("🚀 startChallenge() appelée avec settings:", settings);
    this.state.gameSettings = settings;

    // Son de lancement du jeu
    if (this.soundManager && typeof this.soundManager.playGameStart === 'function') {
      this.soundManager.playGameStart();
    }

    // D'abord fermer le panneau de préparation
    console.log("📋 Tentative de fermeture du panneau...");
    this.ui.hideStartPanel();

    // CRITIQUE : Démarrer le jeu AVANT la phase de préparation pour que update() fonctionne
    this.isRunning = true;
    this.isPaused = false;
    console.log("✅ Jeu activé (isRunning = true)");

    // IMPORTANT : Lancer la phase de préparation MAINTENANT
    console.log(
      `🎨 Démarrage phase de préparation de ${settings.prepTime}s...`
    );
    this.state.startPreparationPhase(settings.prepTime);

    // Son de début de préparation
    if (this.soundManager && typeof this.soundManager.playPreparationStart === 'function') {
      this.soundManager.playPreparationStart();
    }

    // Charger le challenge (personnages créés gelés)
    console.log("🏗️ Chargement du challenge...");
    this.loadChallenge(this.state.currentChallengeIndex);

    // GELER IMMÉDIATEMENT après création
    console.log("❄️ Gel forcé de tous les personnages...");
    this.characters.freezeCharacters();

    this.ui.updateSpeedControl(settings.speed, settings.lockSpeed);
    this.ui.showPreparationCountdown(settings.prepTime);

    console.log(
      "✅ Séquence terminée : personnages gelés, phase de préparation active"
    );
  }

  loadChallenge(index) {
    const challenge = this.challengeManager.getChallenge(index);
    if (!challenge) return;

    this.state.currentChallengeIndex = index;
    this.state.currentChallenge = challenge;
    this.state.resetForNewChallenge();

    // Reconstruire le monde physique
    this.physics.reset();
    this.physics.createWorldBounds(this.canvas.width, this.canvas.height);

    // Initialiser les zones (checkpoint + finale)
    if (challenge.checkpointZone) {
      this.zoneManager.initZones(
        challenge.checkpointZone,
        challenge.goal,
        this.soundManager
      );
    } else {
      this.zoneManager.initZones(null, challenge.goal, this.soundManager);
    }

    challenge.build(this.physics, this.canvas.width, this.canvas.height);

    // Recréer les personnages
    this.characters.spawnCharacters(challenge);

    // Réinitialiser le système de dessin
    this.drawing.reset();

    // Mettre à jour l'UI
    this.ui.updateChallengeInfo(challenge, index + 1);
    this.ui.updateGameStats(this.state);
  }

  gameLoop() {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // Log occasionnel pour debug chrono
    if (Math.random() < 0.01) {
      console.log(
        `🔄 gameLoop - isRunning: ${this.isRunning}, isPaused: ${
          this.isPaused
        }, deltaTime: ${deltaTime.toFixed(3)}`
      );
    }

    if (this.isRunning && !this.isPaused) {
      this.accumulator += deltaTime;

      // Step physique fixe
      while (this.accumulator >= this.timeStep) {
        if (Math.random() < 0.02) {
          // Log occasionnel
          console.log(
            `🎯 Appel update(${
              this.timeStep
            }) - accumulator: ${this.accumulator.toFixed(3)}`
          );
        }
        this.update(this.timeStep);
        this.accumulator -= this.timeStep;
      }

      // Mettre à jour le temps de jeu
      this.state.updateTime(deltaTime);
    }

    // Rendu (toujours actif pour les menus)
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime) {
    // Gestion de la phase de préparation
    if (this.state.isPreparationPhase) {
      // Log pour vérifier que le décompte fonctionne
      if (Math.random() < 0.1) {
        // Log fréquent au début pour debug
        console.log(
          `⏰ DÉCOMPTE ACTIF - deltaTime: ${deltaTime}, restant: ${(
            this.state.preparationTimeRemaining / 1000
          ).toFixed(1)}s`
        );
      }
      this.state.preparationTimeRemaining -= deltaTime * 1000;

      // Mettre à jour l'affichage du compte à rebours
      const timeLeft = Math.max(0, this.state.preparationTimeRemaining / 1000);
      this.ui.showPreparationCountdown(timeLeft);

      // Son de countdown pour chaque seconde
      const currentSecond = Math.ceil(timeLeft);
      if (
        currentSecond !== this.lastCountdownSecond &&
        currentSecond > 0 &&
        currentSecond <= 3
      ) {
        if (this.soundManager && typeof this.soundManager.playPreparationBeep === 'function') {
          this.soundManager.playPreparationBeep();
        }
        this.lastCountdownSecond = currentSecond;
      }

      // Log du temps restant (occasionnel)
      if (Math.random() < 0.02) {
        // ~1 fois toutes les 50 frames
        console.log(`⏰ Temps de préparation restant: ${timeLeft.toFixed(1)}s`);
      }

      // Fin de la phase de préparation
      if (this.state.preparationTimeRemaining <= 0) {
        console.log("⏰ TEMPS DE PRÉPARATION ÉCOULÉ !");
        console.log(
          `🔍 Avant endPreparationPhase: isPreparationPhase = ${this.state.isPreparationPhase}`
        );
        this.state.endPreparationPhase();
        console.log(
          `🔍 Après endPreparationPhase: isPreparationPhase = ${this.state.isPreparationPhase}`
        );
        this.characters.unfreezeCharacters();
        console.log("🚀 Les personnages commencent à bouger !");
        if (this.soundManager && typeof this.soundManager.playPreparationEnd === 'function') {
          this.soundManager.playPreparationEnd();
        }
      }
    }

    // Échelle de temps pour la vitesse de jeu
    const scaledDelta = deltaTime * this.state.gameSettings.timeScale;

    // Mise à jour de l'état du jeu (chronos)
    this.state.updateTime(deltaTime);

    // Mise à jour des systèmes
    this.physics.update(scaledDelta);

    // Les personnages ne bougent PAS pendant la phase de préparation
    if (!this.state.isPreparationPhase) {
      this.characters.update(scaledDelta);
    } else if (Math.random() < 0.01) {
      // Log occasionnel
      console.log("⏸️ Personnages en pause pendant la préparation");
    }

    this.drawing.update(scaledDelta);

    // Vérification des conditions de fin
    this.checkEndConditions();

    // Mise à jour de l'UI
    this.ui.updateGameStats(this.state);
  }

  render() {
    this.renderer.clear();

    // Rendu du monde
    this.renderer.renderBackground();

    // Rendu des zones
    if (this.zoneManager.getZoneStates().checkpoint) {
      // Mode avec zone de passage
      this.renderer.renderZoneManager(this.zoneManager);
    } else {
      // Mode normal
      this.renderer.renderGoalZone(this.state.currentChallenge?.goal);
    }
    this.renderer.renderStaticBodies(this.physics.getBodies());

    // Rendu du système de dessin
    this.drawing.render(this.renderer);

    // Rendu des personnages
    this.characters.render(this.renderer);

    // Debug si nécessaire
    if (this.state.debug) {
      this.renderer.renderDebug(this.physics, this.characters);
    }
  }

  checkEndConditions() {
    const charactersInGoal = this.characters.countCharactersInGoal(
      this.state.currentChallenge.goal
    );
    this.state.savedCount = charactersInGoal;

    // Fin immédiate si tous morts
    if (this.characters.areAllDead()) {
      this.soundManager.playGameOver();
      this.endChallenge(false);
      return;
    }

    // Logique de validation avec délai - SEULEMENT si personnages restent dans zone
    if (charactersInGoal > 0) {
      if (!this.state.validationStarted) {
        // Obtenir les détails pour un log plus précis
        const goalDetails = this.characters.getGoalDetails(
          this.state.currentChallenge.goal
        );
        console.log(
          `🎯 Début du décompte: ${goalDetails.inGoal} personnage(s) dans la zone verte`
        );
        console.log(
          `📍 Positions:`,
          goalDetails.details
            .map((d) => `(${d.position.x},${d.position.y})`)
            .join(", ")
        );
        console.log(
          `⏰ Validation démarrée, durée: ${
            this.state.validationDuration / 1000
          }s`
        );

        // Son d'activation de la zone verte (premier personnage qui entre)
        if (this.soundManager && typeof this.soundManager.playZoneActivated === 'function') {
          this.soundManager.playZoneActivated();
        }
        
        // Son de début de chrono de validation
        if (this.soundManager && typeof this.soundManager.playTimerStart === 'function') {
          this.soundManager.playTimerStart();
        }
        
        // Test audio pour vérifier que les sons fonctionnent
        console.log("🔊 Test audio du chrono - Vérification SoundManager:", {
          hasAudioContext: !!this.soundManager.audioContext,
          audioContextState: this.soundManager.audioContext?.state,
          hasPlayTimerBeep: typeof this.soundManager.playTimerBeep === 'function',
          hasPlayTimerEnd: typeof this.soundManager.playTimerEnd === 'function'
        });
        
        // Test immédiat d'un bip
        if (this.soundManager && typeof this.soundManager.playTimerBeep === 'function') {
          console.log("🔊 Test immédiat d'un bip de chrono...");
          this.soundManager.playTimerBeep();
        }

        this.state.startValidation();
      }
      // Continuer le décompte seulement si il y a encore des personnages
    } else {
      // Plus de personnages dans la zone = arrêter le décompte
      if (this.state.validationStarted) {
        console.log(
          "⏹️ Décompte arrêté: plus de personnages dans la zone verte"
        );
        this.state.resetValidation();
      }
    }

    // Fin automatique SEULEMENT après délai complet ET si personnages toujours présents
    if (
      this.state.validationStarted &&
      this.state.getValidationProgress() >= 1 &&
      charactersInGoal > 0
    ) {
      const goalDetails = this.characters.getGoalDetails(
        this.state.currentChallenge.goal
      );
      console.log(
        `✅ Validation automatique: ${goalDetails.inGoal} personnage(s) sauvé(s)`
      );
      console.log(
        `🎉 Positions finales:`,
        goalDetails.details
          .map((d) => `(${d.position.x},${d.position.y})`)
          .join(", ")
      );
      this.endChallenge(true);
    }
  }

  validateScore() {
    if (!this.isRunning || this.isPaused) return;

    const charactersInGoal = this.characters.countCharactersInGoal(
      this.state.currentChallenge.goal
    );
    const goalDetails = this.characters.getGoalDetails(
      this.state.currentChallenge.goal
    );

    this.state.savedCount = charactersInGoal;
    console.log(
      `🖱️ Validation manuelle: ${goalDetails.inGoal} personnage(s) sauvé(s)`
    );
    console.log(
      `📍 Positions au moment de la validation:`,
      goalDetails.details
        .map((d) => `(${d.position.x},${d.position.y})`)
        .join(", ")
    );

    this.endChallenge(charactersInGoal > 0);
  }

  endChallenge(won) {
    this.isRunning = false;
    this.state.endTime = performance.now();

    // Son de victoire ou de game over
    if (won) {
      if (this.soundManager && typeof this.soundManager.playVictory === 'function') {
        this.soundManager.playVictory();
      }
    } else {
      if (this.soundManager && typeof this.soundManager.playGameOver === 'function') {
        this.soundManager.playGameOver();
      }
    }

    const score = this.calculateScore(won);
    this.ui.showGameStatus(won, {
      saved: this.state.savedCount,
      total: this.state.currentChallenge.numCharacters,
      score: score,
      time: this.state.getElapsedTime(),
      inkUsed: this.state.getInkUsedPercentage(),
      inkMax: this.state.inkMax,
      inkRemaining: this.state.inkRemaining,
    });
  }

  calculateScore(won) {
    if (!won) return { points: 0, stars: 0 };

    const challenge = this.state.currentChallenge;
    const saveRatio = this.state.savedCount / challenge.numCharacters;
    const inkRatio = 1 - this.state.getInkUsedPercentage() / 100;
    const timeBonus = Math.max(
      0.5,
      Math.min(1.5, 60 / Math.max(30, this.state.getElapsedTime()))
    );

    let multiplier = 1;
    if (!this.state.gameSettings.autoJump) multiplier *= 1.2;
    if (this.state.gameSettings.lockSpeed) multiplier *= 1.1;

    const points = Math.round(
      (saveRatio * 1000 + inkRatio * 500) * timeBonus * multiplier
    );

    let stars = 1;
    if (saveRatio >= 0.6 && inkRatio >= 0.3) stars = 2;
    if (saveRatio >= 0.8 && inkRatio >= 0.5) stars = 3;

    return { points, stars };
  }

  togglePause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
    this.ui.updatePauseState(this.isPaused);
  }

  resetChallenge() {
    console.log("🔄 RESET COMPLET de la partie...");

    // Arrêter complètement le jeu
    this.isRunning = false;
    this.isPaused = false;

    // Réinitialiser complètement l'état
    this.state.reset();

    // Réinitialiser le système de dessin AVANT de recharger
    this.drawing.reset();

    // Réinitialiser la physique
    this.physics.reset();

    // Recharger le challenge depuis le début
    this.loadChallenge(this.state.currentChallengeIndex);

    // Remettre les personnages immobiles (ils sont créés par loadChallenge)
    this.characters.freezeCharacters();

    // Remettre l'interface en mode préparation
    console.log("🔄 Affichage du panneau de préparation...");
    this.ui.showStartPanel();

    console.log("✅ Reset terminé - Prêt pour un nouveau départ !");
  }

  nextChallenge() {
    const nextIndex =
      (this.state.currentChallengeIndex + 1) %
      this.challengeManager.getChallengeCount();
    this.loadChallenge(nextIndex);
    this.ui.showStartPanel();
  }

  setGameSpeed(speed) {
    if (this.state.gameSettings.lockSpeed && this.isRunning) return;
    this.state.gameSettings.timeScale = speed;
    this.ui.updateSpeedDisplay(speed);
  }
}

// Initialisation du jeu
function initGame() {
  const canvas = document.getElementById("game-canvas");

  if (!canvas) {
    console.error("Canvas game-canvas non trouvé !");
    return;
  }

  const game = new Game();
  game.start();
}

// Attendre que le DOM soit prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}
