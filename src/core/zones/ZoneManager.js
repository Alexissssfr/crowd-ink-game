/**
 * Gestionnaire simple des zones de passage
 */
export class ZoneManager {
  constructor() {
    this.checkpointZone = null;
    this.finalZone = null;
    this.isCheckpointReached = false;
  }

  // Initialiser les zones pour un challenge
  initZones(checkpointZone, finalZone) {
    this.checkpointZone = checkpointZone;
    this.finalZone = finalZone;
    this.isCheckpointReached = false;
    
    console.log('🎯 Zones initialisées:', checkpointZone ? 'Avec checkpoint' : 'Sans checkpoint');
  }

  // Vérifier si un personnage touche une zone
  checkZoneContact(character) {
    if (!this.checkpointZone) {
      // Pas de zone de passage, vérifier seulement la zone finale
      return this.checkFinalZone(character);
    }

    // Vérifier d'abord la zone de passage
    if (!this.isCheckpointReached) {
      if (this.isCharacterInZone(character, this.checkpointZone)) {
        this.isCheckpointReached = true;
        console.log('✅ Zone de passage atteinte !');
        return { type: 'checkpoint', success: true };
      }
      return { type: 'checkpoint', success: false };
    }

    // Zone de passage atteinte, vérifier la zone finale
    return this.checkFinalZone(character);
  }

  // Vérifier la zone finale
  checkFinalZone(character) {
    if (this.isCharacterInZone(character, this.finalZone)) {
      return { type: 'final', success: true };
    }
    return { type: 'final', success: false };
  }

  // Vérifier si un personnage est dans une zone
  isCharacterInZone(character, zone) {
    if (!zone || !character) return false;
    
    const charX = character.body.position.x;
    const charY = character.body.position.y;
    
    return charX >= zone.x && 
           charX <= zone.x + zone.w && 
           charY >= zone.y && 
           charY <= zone.y + zone.h;
  }

  // Obtenir l'état des zones pour le rendu
  getZoneStates() {
    return {
      checkpoint: this.checkpointZone,
      final: this.finalZone,
      isCheckpointReached: this.isCheckpointReached
    };
  }

  // Réinitialiser
  reset() {
    this.checkpointZone = null;
    this.finalZone = null;
    this.isCheckpointReached = false;
  }
}
