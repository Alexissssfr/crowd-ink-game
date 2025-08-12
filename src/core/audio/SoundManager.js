/**
 * Gestionnaire de sons pour le jeu
 */
export class SoundManager {
  constructor() {
    this.sounds = {};
    this.isMuted = false;
    this.volume = 0.3;
    this.audioContext = null;
    this.initAudioContext();
  }

  initAudioContext() {
    // Initialiser l'audio context seulement après une interaction utilisateur
    document.addEventListener('click', () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.initSounds();
      }
    }, { once: true });
  }

  initSounds() {
    // Sons de base (utilisant l'API Web Audio pour des sons générés)
    this.createSound('characterMove', this.generateMoveSound());
    this.createSound('characterJump', this.generateJumpSound());
    this.createSound('characterLand', this.generateLandSound());
    this.createSound('lineDraw', this.generateDrawSound());
    this.createSound('goalReach', this.generateGoalSound());
    this.createSound('buttonClick', this.generateClickSound());
    this.createSound('success', this.generateSuccessSound());
    this.createSound('error', this.generateErrorSound());
  }

  createSound(name, audioBuffer) {
    if (!this.audioContext) return;
    this.sounds[name] = { audioContext: this.audioContext, audioBuffer };
  }

  play(soundName) {
    if (this.isMuted || !this.sounds[soundName] || !this.audioContext) return;

    const { audioContext, audioBuffer } = this.sounds[soundName];
    
    // Créer un nouveau buffer source pour chaque lecture
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Appliquer le volume
    gainNode.gain.value = this.volume;
    
    source.start(0);
  }

  // Génération de sons avec l'API Web Audio
  generateMoveSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 4410, 44100); // 0.1 seconde
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.random() * 0.1 * Math.exp(-i / 1000);
    }
    
    return buffer;
  }

  generateJumpSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 4410, 44100);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      const frequency = 200 + (i / 44.1); // Glissando ascendant
      data[i] = Math.sin(2 * Math.PI * frequency * i / 44100) * 0.2 * Math.exp(-i / 2000);
    }
    
    return buffer;
  }

  generateLandSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 4410, 44100);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      const frequency = 150 - (i / 88.2); // Glissando descendant
      data[i] = Math.sin(2 * Math.PI * frequency * i / 44100) * 0.15 * Math.exp(-i / 1500);
    }
    
    return buffer;
  }

  generateDrawSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 2205, 44100); // 0.05 seconde
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.random() * 0.05 * Math.exp(-i / 500);
    }
    
    return buffer;
  }

  generateGoalSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 8820, 44100); // 0.2 seconde
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      const frequency = 400 + Math.sin(i / 100) * 50;
      data[i] = Math.sin(2 * Math.PI * frequency * i / 44100) * 0.3 * Math.exp(-i / 3000);
    }
    
    return buffer;
  }

  generateClickSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 2205, 44100);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.random() * 0.1 * Math.exp(-i / 200);
    }
    
    return buffer;
  }

  generateSuccessSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 13230, 44100); // 0.3 seconde
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      const frequency = 600 + Math.sin(i / 150) * 100;
      data[i] = Math.sin(2 * Math.PI * frequency * i / 44100) * 0.4 * Math.exp(-i / 4000);
    }
    
    return buffer;
  }

  generateErrorSound() {
    if (!this.audioContext) return null;
    const buffer = this.audioContext.createBuffer(1, 8820, 44100);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      const frequency = 200 - (i / 44.1);
      data[i] = Math.sin(2 * Math.PI * frequency * i / 44100) * 0.2 * Math.exp(-i / 2000);
    }
    
    return buffer;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  getMuteState() {
    return this.isMuted;
  }
}
