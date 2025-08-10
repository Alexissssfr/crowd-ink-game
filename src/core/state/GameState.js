/**
 * État global du jeu - gestion centralisée de toutes les données
 */
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    // État du challenge
    this.currentChallengeIndex = 0;
    this.currentChallenge = null;
    this.totalCharacters = 0;
    this.savedCount = 0;

    // État du jeu
    this.isPlaying = false;
    this.isPaused = false;
    this.startTime = null;
    this.endTime = null;
    this.elapsedMs = 0;

    // Système d'encre
    this.inkMax = 4000;
    this.inkRemaining = this.inkMax;

    // Paramètres de jeu
    this.gameSettings = {
      speed: 1.0,
      timeScale: 1.0,
      autoJump: true,
      lockSpeed: false,
    };

    // Validation du score
    this.validationStarted = false;
    this.validationTime = 0;
    this.validationDuration = 8000; // 8 secondes de délai

    // Debug
    this.debug = false;

    // Délai de préparation
    this.preparationTime = 2000; // 2 secondes
    this.preparationStarted = false;

    // Phase de tracé personnalisée
    this.isDrawingPhase = false;
    this.drawingTimeRemaining = 0;
    this.drawingTimeStart = null;

    // Phase de préparation
    this.isPreparationPhase = false;
    this.preparationTimeRemaining = 0;
  }

  resetForNewChallenge() {
    this.savedCount = 0;
    this.inkRemaining = this.inkMax;
    this.startTime = null;
    this.endTime = null;
    this.elapsedMs = 0;
    this.validationStarted = false;
    this.validationTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.preparationStarted = false;
  }

  // Gestion du temps
  updateTime(deltaTime) {
    // Log occasionnel pour debug
    if (Math.random() < 0.01) {
      console.log(
        `⏰ updateTime - isPlaying: ${this.isPlaying}, isPaused: ${
          this.isPaused
        }, deltaTime: ${deltaTime.toFixed(3)}, elapsedMs: ${this.elapsedMs}`
      );
    }

    if (this.isPlaying && !this.isPaused) {
      this.elapsedMs += deltaTime * 1000;

      // Mise à jour du chrono de validation
      if (this.validationStarted) {
        this.validationTime += deltaTime * 1000;
        // Log occasionnel pour le chrono de validation
        if (Math.random() < 0.02) {
          const progress = (
            (this.validationTime / this.validationDuration) *
            100
          ).toFixed(1);
          console.log(
            `📊 Validation: ${progress}% (${this.validationTime.toFixed(
              0
            )}ms / ${this.validationDuration}ms)`
          );
        }
      }
    }
  }

  getElapsedTime() {
    return this.elapsedMs / 1000;
  }

  getFormattedTime() {
    const totalSeconds = Math.floor(this.elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  // Gestion de l'encre
  canSpendInk(amount) {
    return this.inkRemaining >= amount;
  }

  spendInk(amount) {
    this.inkRemaining = Math.max(0, this.inkRemaining - amount);
  }

  getInkPercentage() {
    return (this.inkRemaining / this.inkMax) * 100;
  }

  getInkUsedPercentage() {
    return ((this.inkMax - this.inkRemaining) / this.inkMax) * 100;
  }

  // État de jeu
  startGame() {
    this.isPlaying = true;
    this.isPaused = false;
    this.startTime = performance.now();
    this.preparationStarted = true;
    console.log("⏰ Période de préparation démarrée (2s)");
  }

  startPreparationPhase(timeInSeconds) {
    this.isPreparationPhase = true;
    this.preparationTimeRemaining = timeInSeconds * 1000; // Convertir en ms
    this.startTime = performance.now(); // Démarrer le chrono total dès maintenant
    this.isPlaying = true;
    console.log(
      `🎨 Phase de préparation lancée pour ${timeInSeconds}s (${this.preparationTimeRemaining}ms)`
    );
    console.log(`📊 isPreparationPhase: ${this.isPreparationPhase}`);
  }

  endPreparationPhase() {
    this.isPreparationPhase = false;
    this.preparationTimeRemaining = 0;
    // S'assurer que le jeu continue à tourner
    this.isPlaying = true;
    this.isPaused = false;
    console.log(
      "✅ Phase de préparation terminée - Les personnages peuvent bouger !"
    );
    console.log(
      `🔍 État après préparation: isPlaying=${this.isPlaying}, isPaused=${this.isPaused}`
    );
  }

  // FONCTION SUPPRIMÉE - utiliser updateTime() à la place
  // Cette fonction créait un conflit avec updateTime()

  pauseGame() {
    this.isPaused = true;
  }

  resumeGame() {
    this.isPaused = false;
  }

  endGame() {
    this.isPlaying = false;
    this.endTime = performance.now();
  }

  isPlayingNow() {
    return this.isPlaying && !this.isPaused;
  }

  isPreparationPeriod() {
    if (!this.preparationStarted) return false;
    return this.elapsedMs < this.preparationTime;
  }

  canCharactersMove() {
    return this.isPlayingNow() && !this.isPreparationPeriod();
  }

  getPreparationTimeLeft() {
    if (!this.isPreparationPeriod()) return 0;
    return Math.max(0, this.preparationTime - this.elapsedMs);
  }

  // Validation du score
  startValidation() {
    this.validationStarted = true;
    this.validationTime = 0;
  }

  resetValidation() {
    this.validationStarted = false;
    this.validationTime = 0;
  }

  getValidationProgress() {
    if (!this.validationStarted) return 0;
    return Math.min(1, this.validationTime / this.validationDuration);
  }

  isValidationComplete() {
    return (
      this.validationStarted && this.validationTime >= this.validationDuration
    );
  }

  // Statistiques du jeu
  getGameStats() {
    return {
      challengeIndex: this.currentChallengeIndex,
      challengeName: this.currentChallenge?.name || "Inconnu",
      totalCharacters: this.totalCharacters,
      savedCount: this.savedCount,
      elapsedTime: this.getElapsedTime(),
      formattedTime: this.getFormattedTime(),
      inkPercentage: this.getInkPercentage(),
      inkUsedPercentage: this.getInkUsedPercentage(),
      inkRemaining: Math.round(this.inkRemaining),
      inkMax: this.inkMax,
      validationProgress: this.getValidationProgress(),
      isValidating: this.validationStarted,
      isPreparationPeriod: this.isPreparationPeriod(),
      preparationTimeLeft: this.getPreparationTimeLeft(),
    };
  }

  // Score et performance
  calculateScore() {
    if (!this.currentChallenge) return { points: 0, stars: 0 };

    const saveRatio =
      this.totalCharacters > 0 ? this.savedCount / this.totalCharacters : 0;
    const inkRatio = this.getInkPercentage() / 100;
    const timeBonus = this.calculateTimeBonus();
    const difficultyMultiplier = this.calculateDifficultyMultiplier();

    const basePoints = saveRatio * 1000 + inkRatio * 500;
    const points = Math.round(basePoints * timeBonus * difficultyMultiplier);

    const stars = this.calculateStars(saveRatio, inkRatio, timeBonus);

    return { points, stars };
  }

  calculateTimeBonus() {
    const timeSeconds = this.getElapsedTime();
    const targetTime = this.currentChallenge?.targetTime || 60;

    // Bonus décroissant avec le temps
    return Math.max(
      0.5,
      Math.min(1.5, targetTime / Math.max(timeSeconds, targetTime / 2))
    );
  }

  calculateDifficultyMultiplier() {
    let multiplier = 1.0;

    if (!this.gameSettings.autoJump) multiplier *= 1.2;
    if (this.gameSettings.lockSpeed) multiplier *= 1.1;
    if (this.gameSettings.timeScale > 1.0)
      multiplier *= 1.0 + (this.gameSettings.timeScale - 1.0) * 0.1;

    return multiplier;
  }

  calculateStars(saveRatio, inkRatio, timeBonus) {
    let stars = 1;

    if (saveRatio >= 0.6 && inkRatio >= 0.3) stars = 2;
    if (saveRatio >= 0.8 && inkRatio >= 0.5 && timeBonus >= 1.0) stars = 3;

    return stars;
  }

  // Sauvegarde/chargement des préférences
  savePreferences() {
    const prefs = {
      gameSettings: this.gameSettings,
      debug: this.debug,
    };

    try {
      localStorage.setItem("crowdInk_preferences", JSON.stringify(prefs));
    } catch (e) {
      console.warn("Impossible de sauvegarder les préférences:", e);
    }
  }

  loadPreferences() {
    try {
      const saved = localStorage.getItem("crowdInk_preferences");
      if (saved) {
        const prefs = JSON.parse(saved);
        if (prefs.gameSettings) {
          this.gameSettings = { ...this.gameSettings, ...prefs.gameSettings };
        }
        if (typeof prefs.debug === "boolean") {
          this.debug = prefs.debug;
        }
      }
    } catch (e) {
      console.warn("Impossible de charger les préférences:", e);
    }
  }

  // Historique des scores (local)
  saveScore(challengeIndex, score, stats) {
    try {
      const key = "crowdInk_scores";
      const saved = localStorage.getItem(key);
      const scores = saved ? JSON.parse(saved) : {};

      if (!scores[challengeIndex]) {
        scores[challengeIndex] = [];
      }

      scores[challengeIndex].push({
        score,
        stats,
        timestamp: Date.now(),
      });

      // Garder seulement les 10 meilleurs scores par challenge
      scores[challengeIndex].sort((a, b) => b.score.points - a.score.points);
      scores[challengeIndex] = scores[challengeIndex].slice(0, 10);

      localStorage.setItem(key, JSON.stringify(scores));
    } catch (e) {
      console.warn("Impossible de sauvegarder le score:", e);
    }
  }

  getBestScore(challengeIndex) {
    try {
      const saved = localStorage.getItem("crowdInk_scores");
      if (!saved) return null;

      const scores = JSON.parse(saved);
      const challengeScores = scores[challengeIndex];

      if (!challengeScores || challengeScores.length === 0) return null;

      return challengeScores[0]; // Premier = meilleur score
    } catch (e) {
      console.warn("Impossible de charger le meilleur score:", e);
      return null;
    }
  }

  // Debug et utilitaires
  toggleDebug() {
    this.debug = !this.debug;
    this.savePreferences();
  }

  exportState() {
    return {
      currentChallengeIndex: this.currentChallengeIndex,
      gameSettings: this.gameSettings,
      stats: this.getGameStats(),
    };
  }

  importState(state) {
    if (state.currentChallengeIndex !== undefined) {
      this.currentChallengeIndex = state.currentChallengeIndex;
    }
    if (state.gameSettings) {
      this.gameSettings = { ...this.gameSettings, ...state.gameSettings };
    }
  }
}
