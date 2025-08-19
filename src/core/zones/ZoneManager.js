/**
 * Gestionnaire des zones avec zone intermédiaire obligatoire
 */
export class ZoneManager {
  constructor() {
    this.checkpointZone = null;
    this.finalZone = null;
    this.isCheckpointReached = false;
    this.isCheckpointValidated = false; // Nouveau : zone intermédiaire validée
    this.soundManager = null;
  }

  // Initialiser les zones pour un challenge
  initZones(checkpointZone, finalZone, soundManager = null) {
    this.checkpointZone = checkpointZone;
    this.finalZone = finalZone;
    this.isCheckpointReached = false;
    this.isCheckpointValidated = false; // Réinitialiser
    this.soundManager = soundManager;

    console.log(
      "🎯 Zones initialisées:",
      checkpointZone ? "Avec checkpoint obligatoire" : "Sans checkpoint"
    );
  }

  // Vérifier si un personnage touche une zone
  checkZoneContact(character) {
    if (!this.checkpointZone) {
      // Pas de zone de passage, vérifier seulement la zone finale
      return this.checkFinalZone(character);
    }

    // Vérifier d'abord la zone de passage (obligatoire)
    if (!this.isCheckpointValidated) {
      if (this.isCharacterInZone(character, this.checkpointZone)) {
        if (!this.isCheckpointReached) {
          this.isCheckpointReached = true;
          this.isCheckpointValidated = true; // Validation immédiate !
          console.log("✅ Zone intermédiaire validée ! (Premier personnage)");

          // Jouer le son de checkpoint une seule fois
          if (
            this.soundManager &&
            typeof this.soundManager.playZoneActivated === "function"
          ) {
            this.soundManager.playZoneActivated();
          }
        }
        return { type: "checkpoint", success: true, validated: true };
      }
      return { type: "checkpoint", success: false, validated: false };
    }

    // Zone de passage validée, vérifier la zone finale
    return this.checkFinalZone(character);
  }

  // Valider la zone intermédiaire (appelé quand le chrono de validation se termine)
  validateCheckpoint() {
    if (
      this.checkpointZone &&
      this.isCheckpointReached &&
      !this.isCheckpointValidated
    ) {
      this.isCheckpointValidated = true;
      console.log(
        "🎉 Zone intermédiaire validée ! La zone objectif peut maintenant être activée."
      );
      return true;
    }
    return false;
  }

  // Vérifier si la zone intermédiaire est validée
  getCheckpointValidated() {
    return this.isCheckpointValidated;
  }

  // Vérifier si la zone intermédiaire a été atteinte (même si pas encore validée)
  isCheckpointReached() {
    return this.isCheckpointReached;
  }

  // Vérifier la zone finale (seulement si la zone intermédiaire est validée)
  checkFinalZone(character) {
    if (!this.isCheckpointValidated) {
      // Zone intermédiaire pas encore validée, ne pas permettre l'accès à la zone finale
      return {
        type: "final",
        success: false,
        reason: "checkpoint_not_validated",
      };
    }

    if (this.isCharacterInZone(character, this.finalZone)) {
      return { type: "final", success: true };
    }
    return { type: "final", success: false };
  }

  // Vérifier si un personnage est dans une zone
  isCharacterInZone(character, zone) {
    if (!zone || !character) return false;

    const charX = character.body.position.x;
    const charY = character.body.position.y;

    return (
      charX >= zone.x &&
      charX <= zone.x + zone.w &&
      charY >= zone.y &&
      charY <= zone.y + zone.h
    );
  }

  // Obtenir l'état des zones pour le rendu
  getZoneStates() {
    return {
      checkpoint: this.checkpointZone,
      final: this.finalZone,
      isCheckpointReached: this.isCheckpointReached,
      isCheckpointValidated: this.isCheckpointValidated,
    };
  }

  // Réinitialiser
  reset() {
    this.checkpointZone = null;
    this.finalZone = null;
    this.isCheckpointReached = false;
    this.isCheckpointValidated = false;
  }
}
