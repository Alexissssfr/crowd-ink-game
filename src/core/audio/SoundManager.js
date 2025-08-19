/**
 * Gestionnaire de sons simple et efficace
 */
export class SoundManager {
  constructor() {
    this.isMuted = false;
    this.volume = 0.8;
    this.audioContext = null;
    this.isInitialized = false; // Nouveau drapeau pour suivre l'initialisation
  }

  // Nouvelle méthode pour s'assurer que l'audio context est initialisé
  ensureAudioContextInitialized() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        this.isInitialized = true;
        console.log("🎵 Audio context créé après interaction");

        // Jouer un son silencieux pour "déverrouiller" le contexte audio sur iOS/Safari
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start(0);
        oscillator.stop(0);
      } catch (e) {
        console.log("❌ Erreur création audio context:", e);
      }
    }

    // Reprendre si suspendu (par exemple, après un changement d'onglet)
    if (this.audioContext && this.audioContext.state === "suspended") {
      console.log("⏸️ Audio context suspendu, tentative de reprise...");
      this.audioContext
        .resume()
        .catch((e) => console.log("Erreur reprise audio context:", e));
    }
  }

  // Son simple avec fréquence et durée
  playTone(frequency, duration = 0.1, volume = 0.3) {
    if (this.isMuted) {
      console.log("🔇 Audio muet, son ignoré");
      return;
    }

    // S'assurer que l'audio context est initialisé et repris
    this.ensureAudioContextInitialized();

    if (!this.audioContext) {
      // Si l'initialisation a échoué
      console.log("❌ Audio context non disponible pour playTone");
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(
        frequency,
        this.audioContext.currentTime
      );
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(
        volume * this.volume,
        this.audioContext.currentTime
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      console.log(
        `🎵 Son joué avec succès: ${frequency}Hz, ${duration}s, volume: ${
          volume * this.volume
        }`
      );
    } catch (e) {
      console.log("❌ Erreur lecture son:", e);
      console.log("État audio context:", this.audioContext?.state);
    }
  }

  // Sons de mouvement des personnages
  playJump() {
    this.playTone(300, 0.15, 0.4);
  }

  playFly() {
    this.playTone(200, 0.08, 0.2);
  }

  playLand() {
    this.playTone(150, 0.12, 0.3);
  }

  // Son de victoire (challenge réussi)
  playVictory() {
    this.playTone(523, 0.2, 0.6); // Do
    setTimeout(() => this.playTone(659, 0.2, 0.6), 150); // Mi
    setTimeout(() => this.playTone(784, 0.3, 0.6), 300); // Sol
    setTimeout(() => this.playTone(1047, 0.4, 0.6), 450); // Do aigu
  }

  // Son d'activation de la zone verte (premier personnage qui entre)
  playZoneActivated() {
    this.playTone(440, 0.15, 0.5); // La
    setTimeout(() => this.playTone(554, 0.15, 0.5), 100); // Do#
  }

  // Son de début de chrono de validation (quand le chrono de 5s commence)
  playTimerStart() {
    this.playTone(600, 0.2, 0.5);
    setTimeout(() => this.playTone(800, 0.2, 0.5), 150);
  }

  // Bips du chrono de validation (5, 4, 3, 2, 1, 0)
  playTimerBeep() {
    this.playTone(800, 0.15, 0.6); // Plus aigu, plus long et plus fort
  }

  // Son spécial pour la fin du chrono (0 seconde restante)
  playTimerEnd() {
    this.playTone(1000, 0.2, 0.7); // Son plus aigu et plus long pour la fin
    setTimeout(() => this.playTone(600, 0.2, 0.7), 100); // Deuxième note
  }

  // Son de lancement du jeu (quand on clique "Commencer le Challenge")
  playGameStart() {
    this.playTone(400, 0.1, 0.5);
    setTimeout(() => this.playTone(600, 0.1, 0.5), 100);
    setTimeout(() => this.playTone(800, 0.2, 0.5), 200);
  }

  // Son de début de préparation (quand la phase de préparation commence)
  playPreparationStart() {
    this.playTone(300, 0.15, 0.4);
    setTimeout(() => this.playTone(500, 0.15, 0.4), 150);
  }

  // Bips du chrono de préparation (3, 2, 1, GO!)
  playPreparationBeep() {
    this.playTone(800, 0.1, 0.4);
  }

  // Son de fin de préparation (GO!)
  playPreparationEnd() {
    this.playTone(600, 0.1, 0.5);
    setTimeout(() => this.playTone(800, 0.1, 0.5), 100);
    setTimeout(() => this.playTone(1000, 0.2, 0.5), 200);
  }

  // Son de game over (challenge échoué)
  playGameOver() {
    this.playTone(200, 0.3, 0.4);
    setTimeout(() => this.playTone(150, 0.3, 0.4), 200);
  }

  // Son de surligneur pour le dessin (quand on trace des traits)
  playDraw() {
    // Son de surligneur : fréquence plus basse, durée courte, avec un léger effet de "frottement"
    this.playTone(250, 0.08, 0.3);
  }

  // Son de surligneur amélioré (plus réaliste)
  playHighlighter() {
    console.log("🎨 playHighlighter() appelée");
    // Son de surligneur avec une fréquence caractéristique et un effet de "glissement"
    this.playTone(180, 0.06, 0.25);
  }

  // Son d'effacement (quand on efface avec le double-tap)
  playErase() {
    // Son d'effacement : fréquence plus basse, durée courte
    this.playTone(120, 0.08, 0.2);
  }

  // Son de succès (générique - pour compatibilité)
  playSuccess() {
    this.playVictory();
  }

  // Son de countdown (générique - pour compatibilité)
  playCountdown() {
    this.playPreparationBeep();
  }

  // Test audio fort
  testAudio() {
    console.log("🔊 Test audio fort...");
    this.playTone(440, 0.5, 0.8); // Son de test plus fort
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    console.log(this.isMuted ? "🔇 Audio muet" : "🔊 Audio activé");
    return this.isMuted;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Volume: ${this.volume}`);
  }

  getMuteState() {
    return this.isMuted;
  }
}
