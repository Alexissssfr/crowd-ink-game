/**
 * Gestionnaire de sons pour le jeu
 */
export class SoundManager {
  constructor() {
    this.sounds = {};
    this.isMuted = false;
    this.volume = 0.7;
    this.audioContext = null;

    // Initialiser l'audio context après une interaction utilisateur
    this.initAudioContext();
  }

  initAudioContext() {
    const initAudio = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        this.initSounds();
        console.log("🎵 Audio context initialisé");
      }
    };

    // Initialiser au premier clic
    document.addEventListener("click", initAudio, { once: true });
    document.addEventListener("touchstart", initAudio, { once: true });
  }

  initSounds() {
    console.log('🎵 Initialisation des sons...');
    // Sons pour les personnages - sons générés programmatiquement
    this.sounds.jump = this.createJumpSound();
    this.sounds.fly = this.createFlySound();
    this.sounds.land = this.createLandSound();
    this.sounds.success = this.createSuccessSound();
    this.sounds.countdown = this.createCountdownSound();
    this.sounds.gameOver = this.createGameOverSound();
    console.log('🎵 Sons initialisés:', Object.keys(this.sounds));
  }

  // Génération de sons avec Web Audio API
  createJumpSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 4410, 44100); // 0.1 seconde
    const data = buffer.getChannelData(0);

    // Son de saut : glissando ascendant
    for (let i = 0; i < buffer.length; i++) {
      const frequency = 200 + i / 44.1; // De 200Hz à 300Hz
      data[i] =
        Math.sin((2 * Math.PI * frequency * i) / 44100) *
        0.3 *
        Math.exp(-i / 2000);
    }

    return buffer;
  }

  createFlySound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 2205, 44100); // 0.05 seconde
    const data = buffer.getChannelData(0);

    // Son de vol : bruit blanc léger
    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() - 0.5) * 0.1 * Math.exp(-i / 500);
    }

    return buffer;
  }

  createLandSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 4410, 44100); // 0.1 seconde
    const data = buffer.getChannelData(0);

    // Son d'atterrissage : glissando descendant
    for (let i = 0; i < buffer.length; i++) {
      const frequency = 150 - i / 88.2; // De 150Hz à 100Hz
      data[i] =
        Math.sin((2 * Math.PI * frequency * i) / 44100) *
        0.2 *
        Math.exp(-i / 1500);
    }

    return buffer;
  }

  createSuccessSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 8820, 44100); // 0.2 seconde
    const data = buffer.getChannelData(0);

    // Son de succès : accord joyeux
    for (let i = 0; i < buffer.length; i++) {
      const freq1 = 400 + Math.sin(i / 100) * 50;
      const freq2 = 600 + Math.sin(i / 150) * 100;
      data[i] =
        (Math.sin((2 * Math.PI * freq1 * i) / 44100) +
          Math.sin((2 * Math.PI * freq2 * i) / 44100)) *
        0.2 *
        Math.exp(-i / 3000);
    }

    return buffer;
  }

  createCountdownSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 2205, 44100); // 0.05 seconde
    const data = buffer.getChannelData(0);

    // Son de countdown : bip court
    for (let i = 0; i < buffer.length; i++) {
      const frequency = 800;
      data[i] =
        Math.sin((2 * Math.PI * frequency * i) / 44100) *
        0.4 *
        Math.exp(-i / 200);
    }

    return buffer;
  }

  createGameOverSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 8820, 44100); // 0.2 seconde
    const data = buffer.getChannelData(0);

    // Son de game over : glissando descendant triste
    for (let i = 0; i < buffer.length; i++) {
      const frequency = 300 - i / 44.1;
      data[i] =
        Math.sin((2 * Math.PI * frequency * i) / 44100) *
        0.3 *
        Math.exp(-i / 2000);
    }

    return buffer;
  }

  play(soundName) {
    if (this.isMuted || !this.sounds[soundName] || !this.audioContext) return;

    try {
      const buffer = this.sounds[soundName];
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Appliquer le volume
      gainNode.gain.value = this.volume;

      source.start(0);
      console.log(`🎵 Son ${soundName} joué avec succès`);
    } catch (e) {
      console.log("Erreur lors de la lecture audio:", e);
    }
  }

  playJump() {
    console.log("🎵 SoundManager: Jouer son de saut");
    this.play("jump");
  }

  playFly() {
    console.log("🎵 SoundManager: Jouer son de vol");
    this.play("fly");
  }

  playLand() {
    console.log("🎵 SoundManager: Jouer son d'atterrissage");
    this.play("land");
  }

  playSuccess() {
    console.log("🎵 SoundManager: Jouer son de succès");
    this.play("success");
  }

  playCountdown() {
    console.log("🎵 SoundManager: Jouer son de countdown");
    this.play("countdown");
  }

  playGameOver() {
    console.log("🎵 SoundManager: Jouer son de game over");
    this.play("gameOver");
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    // Le volume sera appliqué lors de la prochaine lecture
  }

  getMuteState() {
    return this.isMuted;
  }
}
