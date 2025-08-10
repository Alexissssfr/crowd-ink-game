/**
 * Gestionnaire d'interface utilisateur avec animations et feedback
 */
export class UIManager {
  constructor() {
    this.elements = this.gatherElements();
    this.state = {
      currentScreen: "start", // start, game, gameOver, levelSelect
      isAnimating: false,
    };

    // Callbacks à définir par le jeu
    this.onStartGame = null;
    this.onPause = null;
    this.onReset = null;
    this.onNext = null;
    this.onValidate = null;
    this.onSpeedChange = null;
    this.onChallengeSelect = null;

    this.bindEvents();
    this.setupAnimations();
  }

  gatherElements() {
    const elements = {
      // HUD de jeu
      gameHud: document.getElementById("game-hud"),
      inkFill: document.getElementById("ink-fill"),
      inkText: document.getElementById("ink-text"),
      savedText: document.getElementById("saved-text"),
      timeText: document.getElementById("time-text"),
      levelText: document.getElementById("level-text"),

      // Contrôles
      btnReset: document.getElementById("btn-reset"),
      btnNext: document.getElementById("btn-next"),
      btnValidate: document.getElementById("btn-validate"),

      // Vitesse
      speedSlider: document.getElementById("speed-slider"),
      speedText: document.getElementById("speed-text"),

      // Statut de jeu
      gameStatus: document.getElementById("game-status"),
      statusTitle: document.getElementById("status-title"),
      statusMessage: document.getElementById("status-message"),
      statusScore: document.getElementById("status-score"),
      statusRestart: document.getElementById("status-restart"),
      statusNext: document.getElementById("status-next"),
      statusSelect: document.getElementById("status-select"),

      // Panneau de démarrage
      startPanel: document.getElementById("start-panel"),
      prepTime: document.getElementById("prep-time"),
      prepTimeText: document.getElementById("prep-time-text"),
      startSpeed: document.getElementById("start-speed"),
      startSpeedText: document.getElementById("start-speed-text"),
      autoJump: document.getElementById("auto-jump"),
      lockSpeed: document.getElementById("lock-speed"),
      startGame: document.getElementById("start-game"),

      // Sélecteur de challenges
      challengeSelector: document.getElementById("challenge-selector"),
      challengeList: document.getElementById("challenge-list"),
      closeSelector: document.getElementById("close-selector"),
    };

    // Vérification des éléments critiques
    if (!elements.startGame) {
      console.warn("❌ Element start-game non trouvé dans le DOM");
    }
    if (!elements.startPanel) {
      console.warn("❌ Element start-panel non trouvé dans le DOM");
    } else {
      console.log("✅ Element start-panel trouvé:", elements.startPanel);
    }

    return elements;
  }

  bindEvents() {
    // Contrôles principaux
    this.elements.btnReset?.addEventListener("click", () => this.handleReset());
    this.elements.btnNext?.addEventListener("click", () => this.handleNext());
    this.elements.btnValidate?.addEventListener("click", () =>
      this.handleValidate()
    );

    // Contrôle de vitesse
    this.elements.speedSlider?.addEventListener("input", (e) => {
      this.handleSpeedChange(parseFloat(e.target.value));
    });

    // Panneau de démarrage
    this.elements.prepTime?.addEventListener("input", (e) => {
      this.updatePrepTimeDisplay(parseFloat(e.target.value));
    });

    this.elements.startSpeed?.addEventListener("input", (e) => {
      this.updateStartSpeedDisplay(parseFloat(e.target.value));
    });

    this.elements.startGame?.addEventListener("click", () => {
      this.handleStartGame();
    });

    // Statut de fin
    this.elements.statusRestart?.addEventListener("click", () => {
      this.hideGameStatus();
      this.handleReset();
    });

    this.elements.statusNext?.addEventListener("click", () => {
      this.hideGameStatus();
      this.handleNext();
    });

    this.elements.statusSelect?.addEventListener("click", () => {
      this.hideGameStatus();
      this.showChallengeSelector();
    });

    // Sélecteur de challenges
    this.elements.closeSelector?.addEventListener("click", () => {
      this.hideChallengeSelector();
    });
  }

  setupAnimations() {
    // Configuration des animations CSS
    if (this.elements.gameHud) {
      this.elements.gameHud.style.transition =
        "transform 0.3s ease, opacity 0.3s ease";
    }

    if (this.elements.gameStatus) {
      this.elements.gameStatus.style.transition =
        "opacity 0.4s ease, transform 0.4s ease";
    }
  }

  // Gestion des écrans
  showStartPanel() {
    console.log("🎬 showStartPanel() appelée");
    console.log(
      "📋 État actuel du startPanel:",
      this.elements.startPanel?.style.display,
      this.elements.startPanel?.style.visibility
    );

    this.state.currentScreen = "start";
    this.setElementVisible(this.elements.startPanel, true);
    this.setElementVisible(this.elements.gameHud, false);

    console.log(
      "📋 État après setElementVisible:",
      this.elements.startPanel?.style.display,
      this.elements.startPanel?.style.visibility
    );

    this.animateIn(this.elements.startPanel);

    // Réinitialiser les valeurs par défaut du panneau
    this.resetStartPanelValues();

    console.log("✅ showStartPanel() terminée");
  }

  resetStartPanelValues() {
    // Remettre les valeurs par défaut
    if (this.elements.prepTime) {
      this.elements.prepTime.value = 2; // 2 secondes par défaut
      this.updatePrepTimeDisplay(2);
    }

    if (this.elements.startSpeed) {
      this.elements.startSpeed.value = 1; // Vitesse normale par défaut
      this.updateStartSpeedDisplay(1);
    }

    console.log("🔄 Valeurs du panneau de préparation réinitialisées");
  }

  hideStartPanel() {
    console.log("🚪 hideStartPanel() appelée");
    console.log("startPanel element:", this.elements.startPanel);

    if (this.elements.startPanel) {
      // Force la fermeture avec plusieurs méthodes
      this.elements.startPanel.style.display = "none";
      this.elements.startPanel.classList.add("hidden");
      this.elements.startPanel.style.visibility = "hidden";
      this.elements.startPanel.style.opacity = "0";
      console.log("🔒 Panneau forcé à se cacher avec tous les styles");
    }

    this.setElementVisible(this.elements.gameHud, true);
    this.state.currentScreen = "game";
    console.log("✅ startPanel devrait être caché maintenant");
  }

  showGameStatus(won, stats) {
    this.state.currentScreen = "gameOver";

    // Mettre à jour le contenu
    if (this.elements.statusTitle) {
      this.elements.statusTitle.textContent = won ? "🎉 Bravo !" : "😔 Échec";
    }

    if (this.elements.statusMessage) {
      const inkUsed = Math.round(stats.inkMax - stats.inkRemaining);
      const inkPercentage = Math.round(stats.inkUsed);
      this.elements.statusMessage.textContent = `${stats.saved}/${stats.total} personnages sauvés • Encre: ${inkUsed}/${stats.inkMax} (${inkPercentage}%)`;
    }

    if (this.elements.statusScore) {
      const stars =
        "★".repeat(stats.score.stars) + "☆".repeat(3 - stats.score.stars);
      this.elements.statusScore.textContent = `Score: ${
        stats.score.points
      } • ${stars} • Temps: ${this.formatTime(stats.time)}`;
    }

    // État des boutons
    if (this.elements.statusNext) {
      this.elements.statusNext.disabled = !won;
      this.elements.statusNext.style.opacity = won ? "1" : "0.5";
    }

    // Masquer le message de validation quand on affiche le score final
    this.hideValidationProgress();

    this.setElementVisible(this.elements.gameStatus, true);
    this.animateIn(this.elements.gameStatus);
  }

  hideGameStatus() {
    this.setElementVisible(this.elements.gameStatus, false);
    this.state.currentScreen = "game";
  }

  showChallengeSelector() {
    this.state.currentScreen = "levelSelect";
    this.setElementVisible(this.elements.challengeSelector, true);
    this.animateIn(this.elements.challengeSelector);
  }

  hideChallengeSelector() {
    this.setElementVisible(this.elements.challengeSelector, false);
    this.showStartPanel();
  }

  // Mise à jour des données
  updateGameStats(gameState) {
    const stats = gameState.getGameStats();

    // Barre d'encre avec animation
    if (this.elements.inkFill) {
      const percentage = stats.inkPercentage;
      this.animateBarFill(this.elements.inkFill, percentage);

      // Changement de couleur selon le niveau
      const color = this.getInkBarColor(percentage);
      this.elements.inkFill.style.background = color;
    }

    if (this.elements.inkText) {
      const inkUsed = stats.inkMax - stats.inkRemaining;
      this.elements.inkText.textContent = `${inkUsed}/${stats.inkMax}`;
    }

    // Personnages sauvés
    if (this.elements.savedText) {
      const newText = `${stats.savedCount}/${stats.totalCharacters}`;
      this.animateTextChange(this.elements.savedText, newText);
    }

    // Temps avec mise à jour fluide
    if (this.elements.timeText) {
      this.elements.timeText.textContent = stats.formattedTime;
    }

    // Indicateur de validation avec décompte plus long
    if (stats.isValidating) {
      this.showValidationProgress(stats.validationProgress);
    } else {
      this.hideValidationProgress();
    }

    // Affichage du temps de préparation
    if (stats.isPreparationPeriod) {
      this.showPreparationTime(stats.preparationTimeLeft);
    } else {
      this.hidePreparationTime();
    }
  }

  updateChallengeInfo(challenge, challengeNumber) {
    if (this.elements.levelText) {
      this.animateTextChange(
        this.elements.levelText,
        challengeNumber.toString()
      );
    }

    // Mettre à jour le titre du document
    document.title = `Crowd Ink - ${challenge.name}`;
  }

  updateSpeedControl(speed, locked) {
    if (this.elements.speedSlider) {
      this.elements.speedSlider.value = speed.toString();
      this.elements.speedSlider.disabled = locked;
      this.elements.speedSlider.style.opacity = locked ? "0.5" : "1";
    }

    this.updateSpeedDisplay(speed);
  }

  updateSpeedDisplay(speed) {
    if (this.elements.speedText) {
      this.elements.speedText.textContent = `${speed.toFixed(1)}x`;
    }
  }

  showPreparationCountdown(time) {
    // Afficher le compte à rebours de préparation de façon visible
    if (this.elements.timeText) {
      if (time > 0) {
        this.elements.timeText.textContent = `🎨 Tracez maintenant ! ${time.toFixed(
          1
        )}s`;
        this.elements.timeText.style.color = "#4CAF50";
        this.elements.timeText.style.fontWeight = "bold";
      } else {
        this.elements.timeText.textContent = `🚀 C'est parti !`;
        this.elements.timeText.style.color = "#2196F3";
      }
    }
  }

  updatePrepTimeDisplay(time) {
    if (this.elements.prepTimeText) {
      this.elements.prepTimeText.textContent = `${time.toFixed(1)}s`;
    }
  }

  updateStartSpeedDisplay(speed) {
    if (this.elements.startSpeedText) {
      this.elements.startSpeedText.textContent = `${speed.toFixed(1)}x`;
    }
  }

  updatePauseState(isPaused) {
    if (this.elements.btnPause) {
      this.elements.btnPause.textContent = isPaused ? "▶" : "⏸";
      this.elements.btnPause.title = isPaused ? "Reprendre" : "Pause";
    }

    // Effet visuel sur le HUD
    if (this.elements.gameHud) {
      this.elements.gameHud.style.opacity = isPaused ? "0.7" : "1";
    }
  }

  // Sélecteur de challenges
  populateChallengeList(challenges) {
    if (!this.elements.challengeList) return;

    this.elements.challengeList.innerHTML = "";

    challenges.forEach((challenge, index) => {
      const card = document.createElement("div");
      card.className = "challenge-card";
      card.innerHTML = `
        <h3>${challenge.name}</h3>
        <p>${
          challenge.description || `${challenge.numCharacters} personnages`
        }</p>
      `;

      card.addEventListener("click", () => {
        this.hideChallengeSelector();
        if (this.onChallengeSelect) {
          this.onChallengeSelect(index);
        }
      });

      this.elements.challengeList.appendChild(card);
    });
  }

  // Animations et effets
  animateBarFill(element, percentage) {
    if (!element) return;

    const currentWidth = parseFloat(element.style.width) || 0;
    const targetWidth = Math.max(0, Math.min(100, percentage));

    if (Math.abs(currentWidth - targetWidth) > 0.1) {
      element.style.transition = "width 0.3s ease";
      element.style.width = `${targetWidth}%`;
    }
  }

  animateTextChange(element, newText) {
    if (!element || element.textContent === newText) return;

    element.style.transition = "transform 0.2s ease";
    element.style.transform = "scale(1.1)";

    setTimeout(() => {
      element.textContent = newText;
      element.style.transform = "scale(1)";
    }, 100);
  }

  animateIn(element) {
    if (!element) return;

    element.style.opacity = "0";
    element.style.transform = "scale(0.9) translateY(20px)";

    setTimeout(() => {
      element.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      element.style.opacity = "1";
      element.style.transform = "scale(1) translateY(0)";
    }, 50);
  }

  showValidationProgress(progress) {
    // Créer ou mettre à jour l'indicateur de validation
    let indicator = document.getElementById("validation-indicator");

    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "validation-indicator";
      indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-size: 18px;
        font-weight: bold;
        z-index: 1001;
        pointer-events: none;
      `;
      document.body.appendChild(indicator);
    }

    const seconds = Math.ceil((1 - progress) * 8);

    // Masquer le message dès que le temps atteint 0
    if (seconds <= 0) {
      indicator.style.display = "none";
    } else {
      indicator.textContent = `⏱️ Personnages dans la zone - Validation dans ${seconds}s`;
      indicator.style.display = "block";
    }
  }

  hideValidationProgress() {
    const indicator = document.getElementById("validation-indicator");
    if (indicator) {
      indicator.style.display = "none";
    }
  }

  showPreparationTime(timeLeft) {
    let indicator = document.getElementById("preparation-indicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "preparation-indicator";
      indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 152, 0, 0.9);
        color: white;
        padding: 20px 40px;
        border-radius: 12px;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 2px solid #ff9800;
      `;
      document.body.appendChild(indicator);
    }

    const seconds = Math.ceil(timeLeft / 1000);
    indicator.textContent = `⏳ Préparation: ${seconds}s`;
    indicator.style.display = "block";
  }

  hidePreparationTime() {
    const indicator = document.getElementById("preparation-indicator");
    if (indicator) {
      indicator.style.display = "none";
    }
  }

  getInkBarColor(percentage) {
    if (percentage > 50) {
      return "linear-gradient(90deg, #42a5f5, #26c6da)";
    } else if (percentage > 20) {
      return "linear-gradient(90deg, #ff9800, #ffb74d)";
    } else {
      return "linear-gradient(90deg, #f44336, #e57373)";
    }
  }

  // Gestionnaires d'événements
  handleReset() {
    if (this.onReset) this.onReset();
  }

  handleNext() {
    if (this.onNext) this.onNext();
  }

  handleValidate() {
    if (this.onValidate) this.onValidate();
  }

  handleSpeedChange(speed) {
    this.updateSpeedDisplay(speed);
    if (this.onSpeedChange) this.onSpeedChange(speed);
  }

  handleStartGame() {
    const settings = {
      prepTime: parseFloat(this.elements.prepTime?.value || 2),
      speed: parseFloat(this.elements.startSpeed?.value || 1),
      autoJump: this.elements.autoJump?.checked || false,
      lockSpeed: this.elements.lockSpeed?.checked || false,
      timeScale: parseFloat(this.elements.startSpeed?.value || 1),
    };

    if (this.onStartGame) {
      this.onStartGame(settings);
    }
  }

  // Utilitaires
  setElementVisible(element, visible) {
    if (!element) {
      console.warn("⚠️ setElementVisible: element est null");
      return;
    }

    console.log(
      `🔧 setElementVisible: ${element.id || "unknown"} -> ${
        visible ? "visible" : "hidden"
      }`
    );

    if (visible) {
      element.classList.remove("hidden");
      element.style.display = "flex"; // Force l'affichage
      element.style.visibility = "visible";
      element.style.opacity = "1";
      console.log(
        `✅ Élément ${element.id} forcé visible:`,
        element.style.display,
        element.style.visibility,
        element.style.opacity
      );
    } else {
      element.classList.add("hidden");
      element.style.display = "none";
      element.style.visibility = "hidden";
      element.style.opacity = "0";
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  // Feedback utilisateur
  showToast(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${
        type === "success"
          ? "#4caf50"
          : type === "error"
          ? "#f44336"
          : "#2196f3"
      };
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      z-index: 1002;
      animation: slideUp 0.3s ease;
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideDown 0.3s ease forwards";
      setTimeout(() => document.body.removeChild(toast), 300);
    }, duration);
  }

  // Nettoyage
  destroy() {
    // Retirer les event listeners et nettoyer
    const indicator = document.getElementById("validation-indicator");
    if (indicator) {
      document.body.removeChild(indicator);
    }
  }
}
