/**
 * Gestionnaire de sons simple et efficace
 */
export class SoundManager {
  constructor() {
    this.isMuted = false;
    this.volume = 0.8;
    this.audioContext = null;
    
    // Initialiser l'audio context
    this.initAudio();
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('🎵 Audio context créé');
    } catch (e) {
      console.log('❌ Erreur création audio context:', e);
    }
  }

  // Son simple avec fréquence et durée
  playTone(frequency, duration = 0.1, volume = 0.3) {
    if (this.isMuted || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume * this.volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      console.log(`🎵 Son joué: ${frequency}Hz, ${duration}s`);
    } catch (e) {
      console.log('❌ Erreur lecture son:', e);
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

  playGameOver() {
    this.playTone(200, 0.3, 0.4);
  }

  // Son pour le dessin (comme avant)
  playDraw() {
    this.playTone(400, 0.05, 0.2);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    console.log(this.isMuted ? '🔇 Audio muet' : '🔊 Audio activé');
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
