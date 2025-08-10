/**
 * Gestionnaire des challenges avec génération procédurale
 */
export class ChallengeManager {
  constructor(staticChallenges = []) {
    this.staticChallenges = staticChallenges;
    this.generatedChallenges = [];
    this.difficulty = 1;
    
    // Configuration pour la génération procédurale
    this.generationConfig = {
      baseCharacters: 12,
      maxCharacters: 30,
      baseTime: 60,
      maxTime: 180,
      difficultyScale: 0.2
    };
  }

  /**
   * Obtient un challenge par index
   */
  getChallenge(index) {
    // D'abord les challenges statiques
    if (index < this.staticChallenges.length) {
      return this.staticChallenges[index];
    }
    
    // Puis les challenges générés
    const generatedIndex = index - this.staticChallenges.length;
    
    // Générer au besoin
    while (this.generatedChallenges.length <= generatedIndex) {
      this.generateChallenge();
    }
    
    return this.generatedChallenges[generatedIndex];
  }

  /**
   * Nombre total de challenges disponibles
   */
  getChallengeCount() {
    // Garder toujours quelques challenges d'avance
    const bufferSize = 5;
    return this.staticChallenges.length + this.generatedChallenges.length + bufferSize;
  }

  /**
   * Génère un nouveau challenge procédural
   */
  generateChallenge() {
    const challengeTypes = [
      'gap_crossing',
      'height_climb',
      'obstacle_course',
      'slope_navigation',
      'platform_puzzle'
    ];
    
    const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    const difficulty = this.calculateDifficulty();
    
    let challenge;
    
    switch (type) {
      case 'gap_crossing':
        challenge = this.generateGapCrossing(difficulty);
        break;
      case 'height_climb':
        challenge = this.generateHeightClimb(difficulty);
        break;
      case 'obstacle_course':
        challenge = this.generateObstacleCourse(difficulty);
        break;
      case 'slope_navigation':
        challenge = this.generateSlopeNavigation(difficulty);
        break;
      case 'platform_puzzle':
        challenge = this.generatePlatformPuzzle(difficulty);
        break;
      default:
        challenge = this.generateGapCrossing(difficulty);
    }
    
    this.generatedChallenges.push(challenge);
    return challenge;
  }

  calculateDifficulty() {
    const baseLevel = this.generatedChallenges.length + 1;
    return 1 + baseLevel * this.generationConfig.difficultyScale;
  }

  generateGapCrossing(difficulty) {
    const config = this.generationConfig;
    const numCharacters = Math.floor(config.baseCharacters + difficulty * 3);
    const targetTime = Math.floor(config.baseTime + difficulty * 10);
    
    // Paramètres du gap
    const gapWidth = 200 + difficulty * 30;
    const leftPlatformWidth = 250;
    const rightPlatformWidth = 200;
    
    return {
      name: `Traversée ${Math.floor(gapWidth)}m`,
      description: `Franchissez le grand vide de ${Math.floor(gapWidth)}m`,
      numCharacters,
      targetTime,
      spawn: { x: 120, y: 540 },
      goal: { x: 400 + gapWidth, y: 540, w: 120, h: 60 },
      walkDirection: 1,
      
      build(physics, width, height) {
        const { Bodies } = window.Matter;
        
        // Plateforme de gauche
        const leftPlatform = Bodies.rectangle(200, 600, leftPlatformWidth, 30, {
          isStatic: true,
          render: { fillStyle: '#37474f' }
        });
        
        // Plateforme de droite
        const rightX = 350 + gapWidth;
        const rightPlatform = Bodies.rectangle(rightX, 600, rightPlatformWidth, 30, {
          isStatic: true,
          render: { fillStyle: '#37474f' }
        });
        
        physics.addStaticBody(leftPlatform);
        physics.addStaticBody(rightPlatform);
        
        // Obstacles optionnels pour augmenter la difficulté
        if (difficulty > 2) {
          const pillar = Bodies.rectangle(350 + gapWidth / 2, 520, 20, 160, {
            isStatic: true,
            render: { fillStyle: '#546e7a' }
          });
          physics.addStaticBody(pillar);
        }
        
        physics.createGoalZone(rightX - 60, 540, 120, 60);
      }
    };
  }

  generateHeightClimb(difficulty) {
    const config = this.generationConfig;
    const numCharacters = Math.floor(config.baseCharacters + difficulty * 2);
    const targetTime = Math.floor(config.baseTime + difficulty * 15);
    
    const numPlatforms = Math.floor(3 + difficulty);
    const platformSpacing = 120 + difficulty * 20;
    
    return {
      name: `Ascension ${numPlatforms} étages`,
      description: `Montez vers les hauteurs en ${numPlatforms} étapes`,
      numCharacters,
      targetTime,
      spawn: { x: 120, y: 580 },
      goal: { x: 100 + numPlatforms * platformSpacing, y: 600 - numPlatforms * 80, w: 140, h: 40 },
      walkDirection: 1,
      
      build(physics, width, height) {
        const { Bodies } = window.Matter;
        
        // Plateforme de départ
        const startPlatform = Bodies.rectangle(200, 620, 280, 30, {
          isStatic: true,
          render: { fillStyle: '#37474f' }
        });
        physics.addStaticBody(startPlatform);
        
        // Plateformes en escalier
        for (let i = 1; i <= numPlatforms; i++) {
          const x = 200 + i * platformSpacing;
          const y = 620 - i * 80;
          const width = 160 - i * 5; // Plateformes qui rétrécissent
          
          const platform = Bodies.rectangle(x, y, width, 20, {
            isStatic: true,
            render: { fillStyle: '#455a64' }
          });
          physics.addStaticBody(platform);
        }
        
        const goalX = 100 + numPlatforms * platformSpacing;
        const goalY = 600 - numPlatforms * 80 - 40;
        physics.createGoalZone(goalX, goalY, 140, 40);
      }
    };
  }

  generateObstacleCourse(difficulty) {
    const config = this.generationConfig;
    const numCharacters = Math.floor(config.baseCharacters + difficulty * 4);
    const targetTime = Math.floor(config.baseTime + difficulty * 8);
    
    const numObstacles = Math.floor(4 + difficulty * 2);
    
    return {
      name: `Parcours ${numObstacles} obstacles`,
      description: `Naviguez entre ${numObstacles} obstacles variés`,
      numCharacters,
      targetTime,
      spawn: { x: 120, y: 540 },
      goal: { x: 100 + numObstacles * 140, y: 540, w: 120, h: 60 },
      walkDirection: 1,
      
      build(physics, width, height) {
        const { Bodies } = window.Matter;
        
        // Sol continu
        const ground = Bodies.rectangle(width / 2, 600, width, 30, {
          isStatic: true,
          render: { fillStyle: '#37474f' }
        });
        physics.addStaticBody(ground);
        
        // Obstacles variés
        for (let i = 0; i < numObstacles; i++) {
          const x = 300 + i * 140;
          const obstacleType = Math.floor(Math.random() * 3);
          
          switch (obstacleType) {
            case 0: // Pilier
              const height = 80 + Math.random() * 60;
              const pillar = Bodies.rectangle(x, 600 - height / 2, 24, height, {
                isStatic: true,
                render: { fillStyle: '#546e7a' }
              });
              physics.addStaticBody(pillar);
              break;
              
            case 1: // Plafond bas
              const roof = Bodies.rectangle(x, 520, 100, 20, {
                isStatic: true,
                render: { fillStyle: '#455a64' }
              });
              physics.addStaticBody(roof);
              break;
              
            case 2: // Trou
              const hole1 = Bodies.rectangle(x - 50, 600, 40, 30, {
                isStatic: true,
                render: { fillStyle: '#37474f' }
              });
              const hole2 = Bodies.rectangle(x + 50, 600, 40, 30, {
                isStatic: true,
                render: { fillStyle: '#37474f' }
              });
              physics.addStaticBody(hole1);
              physics.addStaticBody(hole2);
              break;
          }
        }
        
        const goalX = 100 + numObstacles * 140;
        physics.createGoalZone(goalX, 540, 120, 60);
      }
    };
  }

  generateSlopeNavigation(difficulty) {
    const config = this.generationConfig;
    const numCharacters = Math.floor(config.baseCharacters + difficulty * 2);
    const targetTime = Math.floor(config.baseTime + difficulty * 12);
    
    return {
      name: `Navigation en pente`,
      description: `Maîtrisez les montées et descentes`,
      numCharacters,
      targetTime,
      spawn: { x: 120, y: 480 },
      goal: { x: 1000, y: 300, w: 140, h: 40 },
      walkDirection: 1,
      
      build(physics, width, height) {
        const { Bodies, Body } = window.Matter;
        
        // Plateforme de départ
        const start = Bodies.rectangle(200, 520, 240, 20, {
          isStatic: true,
          render: { fillStyle: '#37474f' }
        });
        physics.addStaticBody(start);
        
        // Série de pentes
        const slopes = [
          { x: 400, y: 460, length: 200, angle: -0.2 },
          { x: 650, y: 400, length: 180, angle: 0.3 },
          { x: 850, y: 350, length: 220, angle: -0.15 }
        ];
        
        slopes.forEach(slope => {
          const ramp = Bodies.rectangle(slope.x, slope.y, slope.length, 16, {
            isStatic: true,
            angle: slope.angle,
            render: { fillStyle: '#546e7a' }
          });
          physics.addStaticBody(ramp);
        });
        
        // Plateforme d'arrivée
        const end = Bodies.rectangle(1040, 340, 200, 20, {
          isStatic: true,
          render: { fillStyle: '#37474f' }
        });
        physics.addStaticBody(end);
        
        physics.createGoalZone(1000, 300, 140, 40);
      }
    };
  }

  generatePlatformPuzzle(difficulty) {
    const config = this.generationConfig;
    const numCharacters = Math.floor(config.baseCharacters + difficulty * 3);
    const targetTime = Math.floor(config.baseTime + difficulty * 20);
    
    const numPlatforms = Math.floor(5 + difficulty * 2);
    
    return {
      name: `Puzzle ${numPlatforms} plateformes`,
      description: `Connectez ${numPlatforms} plateformes flottantes`,
      numCharacters,
      targetTime,
      spawn: { x: 120, y: 480 },
      goal: { x: 1000, y: 200, w: 140, h: 40 },
      walkDirection: 1,
      
      build(physics, width, height) {
        const { Bodies } = window.Matter;
        
        // Plateforme de départ
        const start = Bodies.rectangle(200, 520, 180, 20, {
          isStatic: true,
          render: { fillStyle: '#37474f' }
        });
        physics.addStaticBody(start);
        
        // Plateformes dispersées
        const platforms = [];
        for (let i = 0; i < numPlatforms; i++) {
          const x = 350 + (i / numPlatforms) * 600 + (Math.random() - 0.5) * 100;
          const y = 480 - i * 30 + (Math.random() - 0.5) * 80;
          const width = 120 + Math.random() * 60;
          
          const platform = Bodies.rectangle(x, y, width, 18, {
            isStatic: true,
            render: { fillStyle: '#455a64' }
          });
          
          platforms.push(platform);
          physics.addStaticBody(platform);
        }
        
        // Plateforme d'arrivée
        const end = Bodies.rectangle(1040, 240, 180, 20, {
          isStatic: true,
          render: { fillStyle: '#37474f' }
        });
        physics.addStaticBody(end);
        
        physics.createGoalZone(1000, 200, 140, 40);
      }
    };
  }

  /**
   * Obtient tous les challenges pour l'interface
   */
  getAllChallenges() {
    const all = [...this.staticChallenges];
    
    // Ajouter quelques challenges générés pour l'aperçu
    while (all.length < this.staticChallenges.length + 3) {
      all.push(this.generateChallenge());
    }
    
    return all;
  }

  /**
   * Réinitialise la difficulté
   */
  resetDifficulty() {
    this.difficulty = 1;
    this.generatedChallenges = [];
  }

  /**
   * Configuration de la génération
   */
  setGenerationConfig(config) {
    this.generationConfig = { ...this.generationConfig, ...config };
  }
}
