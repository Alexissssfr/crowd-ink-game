import { Character } from "./Character.js";

/**
 * Gestionnaire des personnages avec logique de groupe
 */
export class CharacterManager {
  constructor(physics, gameState, soundManager) {
    this.physics = physics;
    this.gameState = gameState;
    this.soundManager = soundManager;
    this.characters = new Map();
    this.spawnConfig = null;
  }

  /**
   * Génère les personnages pour un challenge
   */
  spawnCharacters(challenge) {
    this.clear();
    this.spawnConfig = challenge;

    const { spawn, numCharacters, walkDirection } = challenge;
    const autoJump = this.gameState.gameSettings?.autoJump ?? true;

    // Disposition en grille pour éviter les chevauchements
    const gridWidth = 8;
    const spacing = 12;
    const startY = spawn.y - 20; // Un peu au-dessus du point de spawn

    for (let i = 0; i < numCharacters; i++) {
      const row = Math.floor(i / gridWidth);
      const col = i % gridWidth;

      const x = spawn.x + col * spacing + ((row % 2) * spacing) / 2; // Décalage alterné
      const y = startY - (row * spacing) / 2;

      const character = new Character(this.physics, { x, y }, challenge.goal, {
        initialDirection: walkDirection,
        autoJump: autoJump,
        gameState: this.gameState,
        soundManager: this.soundManager,
      });

      this.characters.set(character.id, character);
    }

    this.gameState.totalCharacters = numCharacters;
  }

  /**
   * Met à jour tous les personnages
   */
  update(deltaTime) {
    for (const character of this.characters.values()) {
      character.update(deltaTime);

      // Nettoyer les personnages morts depuis longtemps
      if (character.isDead && this.shouldRemoveDeadCharacter(character)) {
        this.removeCharacter(character.id);
      }
    }
  }

  /**
   * Gèle tous les personnages (phase de préparation)
   */
  freezeCharacters() {
    let count = 0;
    for (const character of this.characters.values()) {
      character.freeze();
      count++;
    }
    console.log(`❄️ TOUS LES ${count} personnages sont gelés`);
  }

  /**
   * Dégèle tous les personnages (fin de préparation)
   */
  unfreezeCharacters() {
    let count = 0;
    for (const character of this.characters.values()) {
      character.unfreeze();
      count++;
    }
    console.log(`🔥 TOUS LES ${count} personnages sont libres de bouger`);
  }

  shouldRemoveDeadCharacter(character) {
    // Garder les personnages morts visibles un moment
    const position = character.getPosition();
    return position.y > 1000; // Très loin hors écran
  }

  /**
   * Rendu de tous les personnages
   */
  render(renderer) {
    // Rendu par ordre de profondeur (y croissant)
    const sortedCharacters = Array.from(this.characters.values()).sort(
      (a, b) => a.getPosition().y - b.getPosition().y
    );

    for (const character of sortedCharacters) {
      character.render(renderer);
    }

    // Statistiques de rendu si mode debug
    if (renderer.debugMode) {
      this.renderDebugInfo(renderer);
    }
  }

  renderDebugInfo(renderer) {
    const alive = this.getAliveCount();
    const inGoal = this.countCharactersInGoal(this.spawnConfig?.goal);
    const total = this.characters.size;

    renderer.drawText(
      10,
      30,
      `Personnages: ${alive}/${total} (${inGoal} dans objectif)`,
      {
        color: "#fff",
        size: 14,
      }
    );
  }

  /**
   * Compte les personnages dans la zone objectif EN TEMPS RÉEL
   */
  countCharactersInGoal(goal) {
    if (!goal) return 0;

    let count = 0;
    for (const character of this.characters.values()) {
      if (!character.isAlive()) continue;

      // Vérification en temps réel de la position
      const position = character.body.position;
      const inGoal =
        position.x >= goal.x &&
        position.x <= goal.x + goal.w &&
        position.y >= goal.y &&
        position.y <= goal.y + goal.h;

      if (inGoal) {
        count++;
      }
    }
    return count;
  }

  /**
   * Vérifie si tous les personnages sont morts
   */
  areAllDead() {
    for (const character of this.characters.values()) {
      if (character.isAlive()) {
        return false;
      }
    }
    return true;
  }

  /**
   * Compte les personnages vivants
   */
  getAliveCount() {
    let count = 0;
    for (const character of this.characters.values()) {
      if (character.isAlive()) {
        count++;
      }
    }
    return count;
  }

  /**
   * Obtient tous les personnages vivants
   */
  getAliveCharacters() {
    const alive = [];
    for (const character of this.characters.values()) {
      if (character.isAlive()) {
        alive.push(character);
      }
    }
    return alive;
  }

  /**
   * Obtient les personnages dans une zone
   */
  getCharactersInArea(x, y, width, height) {
    const inArea = [];
    for (const character of this.characters.values()) {
      if (!character.isAlive()) continue;

      const pos = character.getPosition();
      if (
        pos.x >= x &&
        pos.x <= x + width &&
        pos.y >= y &&
        pos.y <= y + height
      ) {
        inArea.push(character);
      }
    }
    return inArea;
  }

  /**
   * Force tous les personnages à changer de direction
   */
  reverseAllDirections() {
    for (const character of this.characters.values()) {
      if (character.isAlive()) {
        character.direction = -character.direction;
        character.targetDirection = character.direction;
      }
    }
  }

  /**
   * Active/désactive l'auto-saut pour tous
   */
  setAutoJump(enabled) {
    for (const character of this.characters.values()) {
      character.autoJump = enabled;
    }
  }

  /**
   * Fait sauter tous les personnages
   */
  makeAllJump() {
    for (const character of this.characters.values()) {
      if (character.isAlive() && character.isGrounded) {
        character.jump();
      }
    }
  }

  /**
   * Supprime un personnage
   */
  removeCharacter(characterId) {
    const character = this.characters.get(characterId);
    if (character) {
      character.destroy();
      this.characters.delete(characterId);
    }
  }

  /**
   * Vide tous les personnages
   */
  clear() {
    for (const character of this.characters.values()) {
      character.destroy();
    }
    this.characters.clear();
  }

  /**
   * Obtient des détails précis sur les personnages dans la zone
   */
  getGoalDetails(goal) {
    if (!goal) return { inGoal: 0, details: [] };

    const details = [];
    let count = 0;

    for (const character of this.characters.values()) {
      if (!character.isAlive()) continue;

      const position = character.body.position;
      const inGoal =
        position.x >= goal.x &&
        position.x <= goal.x + goal.w &&
        position.y >= goal.y &&
        position.y <= goal.y + goal.h;

      if (inGoal) {
        count++;
        details.push({
          id: character.id,
          position: { x: Math.round(position.x), y: Math.round(position.y) },
        });
      }
    }

    return { inGoal: count, details };
  }

  /**
   * Statistiques pour l'interface
   */
  getStats() {
    const total = this.characters.size;
    const alive = this.getAliveCount();
    const inGoal = this.countCharactersInGoal(this.spawnConfig?.goal);
    const dead = total - alive;

    return {
      total,
      alive,
      dead,
      inGoal,
      remaining: alive - inGoal,
    };
  }

  /**
   * État de fin de jeu
   */
  getEndGameState() {
    const stats = this.getStats();

    if (stats.alive === 0) {
      return "all_dead";
    }

    if (stats.inGoal > 0) {
      return "success";
    }

    return "playing";
  }

  /**
   * Debug: obtient la position moyenne des personnages
   */
  getAveragePosition() {
    const alive = this.getAliveCharacters();
    if (alive.length === 0) return null;

    let sumX = 0,
      sumY = 0;
    for (const character of alive) {
      const pos = character.getPosition();
      sumX += pos.x;
      sumY += pos.y;
    }

    return {
      x: sumX / alive.length,
      y: sumY / alive.length,
    };
  }
}
