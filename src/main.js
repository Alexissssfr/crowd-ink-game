import { Game } from "./modules/game.js";
import { levels } from "./data/challenges.js";
import { SoundManager } from "./core/audio/SoundManager.js";

class GameApp {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.soundManager = new SoundManager();
    this.game = null;
    this.init();
  }

  init() {
    // Initialiser le jeu
    this.game = new Game(this.canvas, this.getHudElements(), levels);

    // Passer le gestionnaire de sons au jeu
    this.game.soundManager = this.soundManager;

    // Initialiser les contrôles
    this.initControls();

    // Démarrer le jeu
    this.game.start();
  }

  getHudElements() {
    return {
      inkFill: document.getElementById("inkFill"),
      inkText: document.getElementById("inkText"),
      savedText: document.getElementById("savedText"),
      timeText: document.getElementById("timeText"),
      levelText: document.getElementById("levelText"),
      speedSlider: document.getElementById("speedSlider"),
      speedValue: document.getElementById("speedValue"),
      resetBtn: document.getElementById("resetBtn"),
      validateBtn: document.getElementById("validateBtn"),
      soundBtn: document.getElementById("soundBtn"),
      soundIcon: document.getElementById("soundIcon"),
      message: document.getElementById("message"),
    };
  }

  initControls() {
    const hud = this.getHudElements();

    // Bouton Reset
    hud.resetBtn.addEventListener("click", () => {
      this.soundManager.play("buttonClick");
      this.game.resetLevel();
    });

    // Bouton Valider
    hud.validateBtn.addEventListener("click", () => {
      this.soundManager.play("buttonClick");
      this.game.requestValidation();
    });

    // Ajouter un bouton Suivant
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary';
    nextBtn.innerHTML = '<span>➡️</span> Suivant';
    nextBtn.addEventListener('click', () => {
      this.soundManager.play("buttonClick");
      this.game.nextLevel();
    });
    hud.resetBtn.parentNode.insertBefore(nextBtn, hud.resetBtn.nextSibling);

    // Slider de vitesse
    hud.speedSlider.addEventListener("input", (e) => {
      const speed = parseFloat(e.target.value);
      this.game.setTimeScale(speed);
      hud.speedValue.textContent = speed.toFixed(1) + "x";
      this.soundManager.play("buttonClick");
    });

    // Bouton Son
    hud.soundBtn.addEventListener("click", () => {
      const isMuted = this.soundManager.toggleMute();
      hud.soundIcon.textContent = isMuted ? "🔇" : "🔊";
      this.soundManager.play("buttonClick");
    });

    // Raccourcis clavier
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "r":
        case "R":
          this.soundManager.play("buttonClick");
          this.game.resetLevel();
          break;
        case " ":
          e.preventDefault();
          this.soundManager.play("buttonClick");
          this.game.togglePause();
          break;
        case "v":
        case "V":
          this.soundManager.play("buttonClick");
          this.game.requestValidation();
          break;
      }
    });

    // Mise à jour de l'interface
    this.updateHud = () => {
      // Encre
      const inkPercent = (this.game.inkRemaining / this.game.inkMax) * 100;
      hud.inkFill.style.width = inkPercent + "%";
      hud.inkText.textContent = `${this.game.inkRemaining}/${this.game.inkMax}`;

      // Personnages sauvés
      hud.savedText.textContent = `${this.game.savedCount}/${this.game.totalCharacters}`;

      // Temps
      const timeMs = this.game.elapsedMs;
      const minutes = Math.floor(timeMs / 60000);
      const seconds = Math.floor((timeMs % 60000) / 1000);
      hud.timeText.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      // Niveau
      hud.levelText.textContent = this.game.currentLevelIndex + 1;

      // Vitesse
      hud.speedSlider.value = this.game.timeScale;
      hud.speedValue.textContent = this.game.timeScale.toFixed(1) + "x";
    };

    // Mise à jour périodique
    setInterval(() => {
      this.updateHud();
    }, 100);
  }

  showMessage(text, duration = 3000) {
    const message = document.getElementById("message");
    message.textContent = text;
    message.style.display = "block";

    setTimeout(() => {
      message.style.display = "none";
    }, duration);
  }
}

// Démarrer l'application quand la page est chargée
document.addEventListener("DOMContentLoaded", () => {
  new GameApp();
});
