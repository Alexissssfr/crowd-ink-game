/**
 * Gestionnaire de sons simple et efficace
 */
export class SoundManager {
  constructor() {
    this.isMuted = false;
    this.volume = 0.8;
    this.audioContext = null;

    // Initialiser l'audio context après interaction utilisateur
    this.initAudioOnInteraction();
  }

  initAudioOnInteraction() {
    const initAudio = () => {
      if (!this.audioContext) {
        try {
          this.audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          console.log("🎵 Audio context créé après interaction");

          // Test immédiat
          this.playTone(440, 0.1, 0.3);
        } catch (e) {
          console.log("❌ Erreur création audio context:", e);
        }
      }
    };

    // Initialiser au premier clic ou touch
    document.addEventListener("click", initAudio, { once: true });
    document.addEventListener("touchstart", initAudio, { once: true });
    document.addEventListener("keydown", initAudio, { once: true });

    console.log(
      "🎵 En attente d'interaction utilisateur pour initialiser l'audio"
    );
  }

  // Son simple avec fréquence et durée
  playTone(frequency, duration = 0.1, volume = 0.3) {
    if (this.isMuted) {
      console.log('🔇 Audio muet, son ignoré');
      return;
    }
    
    if (!this.audioContext) {
      console.log('❌ Audio context non initialisé, tentative d\'initialisation...');
      this.initAudioOnInteraction();
      return;
    }

    try {
      // Vérifier l'état de l'audio context
      if (this.audioContext.state === 'suspended') {
        console.log('⏸️ Audio context suspendu, tentative de reprise...');
        this.audioContext.resume();
      }

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

      console.log(`🎵 Son joué avec succès: ${frequency}Hz, ${duration}s, volume: ${volume * this.volume}`);
    } catch (e) {
      console.log("❌ Erreur lecture son:", e);
      console.log('État audio context:', this.audioContext?.state);
    }
  }

  // Sons spécifiques
  playJump() {
    this.playTone(300, 0.15, 0.4);
  }

  playFly() {
    this.playTone(200, 0.08, 0.2);
  }

  playLand() {
    this.playTone(150, 0.12, 0.3);
  }

  playSuccess() {
    this.playTone(600, 0.2, 0.5);
    setTimeout(() => this.playTone(800, 0.2, 0.5), 100);
  }

  playCountdown() {
    this.playTone(800, 0.1, 0.4);
  }

  playTimerBeep() {
    this.playTone(500, 0.08, 0.3); // Bip court et aigu pour le chrono
  }

  playGameOver() {
    this.playTone(200, 0.3, 0.4);
  }

  // Son pour le dessin (comme avant)
  playDraw() {
    this.playTone(400, 0.1, 0.5); // Plus fort et plus long
  }

  // Test audio fort
  testAudio() {
    console.log('🔊 Test audio fort...');
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
