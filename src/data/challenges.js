const { Bodies, Body } = window.Matter;

/**
 * Collection de challenges avec terrains et mécaniques variés
 */
// Challenge de test avec zone de passage
const checkpointChallenge = {
  name: "Zone de Passage",
  description: "Atteignez d'abord la zone orange, puis la zone verte !",
  numCharacters: 8,
  targetTime: 60,
  spawn: { x: 100, y: 500 },
  checkpointZone: { x: 600, y: 400, w: 120, h: 60 }, // Zone de passage orange
  goal: { x: 1000, y: 500, w: 120, h: 60 }, // Zone finale verte
  walkDirection: 1,
  build(physics, width, height) {
    // Plateformes
    const startPlatform = Bodies.rectangle(200, 550, 300, 30, {
      isStatic: true,
      render: { fillStyle: "#37474f" },
    });

    const middlePlatform = Bodies.rectangle(600, 450, 300, 30, {
      isStatic: true,
      render: { fillStyle: "#455a64" },
    });

    const endPlatform = Bodies.rectangle(1000, 580, 300, 30, {
      isStatic: true,
      render: { fillStyle: "#37474f" },
    });

    physics.addStaticBody(startPlatform);
    physics.addStaticBody(middlePlatform);
    physics.addStaticBody(endPlatform);
  },
};

export const challenges = [
  checkpointChallenge, // Ajouter le challenge avec zone de passage en premier
  {
    name: 'Premier Pont',
    description: 'Tracez un pont simple pour franchir le trou',
    numCharacters: 12,
    targetTime: 45,
    spawn: { x: 100, y: 500 }, // Plus haut pour voir les jambes
    goal: { x: 1000, y: 520, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Plateformes de départ et d'arrivée
      const startPlatform = Bodies.rectangle(200, 550, 300, 30, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      const endPlatform = Bodies.rectangle(1000, 580, 300, 30, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      physics.addStaticBody(startPlatform);
      physics.addStaticBody(endPlatform);
      physics.createGoalZone(1000, 520, 120, 60);
    }
  },

  {
    name: 'Escalier de Fortune',
    description: 'Créez des marches pour monter',
    numCharacters: 16,
    targetTime: 60,
    spawn: { x: 120, y: 560 },
    goal: { x: 980, y: 220, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Sol de départ
      const ground = Bodies.rectangle(200, 600, 280, 30, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      // Plateformes en escalier
      const platforms = [
        Bodies.rectangle(420, 520, 180, 20, {
          isStatic: true,
          render: { fillStyle: '#455a64' }
        }),
        Bodies.rectangle(620, 420, 180, 20, {
          isStatic: true,
          render: { fillStyle: '#455a64' }
        }),
        Bodies.rectangle(820, 320, 180, 20, {
          isStatic: true,
          render: { fillStyle: '#455a64' }
        }),
        Bodies.rectangle(1020, 260, 200, 20, {
          isStatic: true,
          render: { fillStyle: '#37474f' }
        })
      ];
      
      physics.addStaticBody(ground);
      platforms.forEach(platform => physics.addStaticBody(platform));
      physics.createGoalZone(980, 220, 140, 40);
    }
  },

  {
    name: 'Canyon Perdu',
    description: 'Traversez le grand canyon',
    numCharacters: 18,
    targetTime: 75,
    spawn: { x: 140, y: 540 },
    goal: { x: 1020, y: 540, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      const leftCliff = Bodies.rectangle(220, 600, 300, 40, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      const rightCliff = Bodies.rectangle(980, 600, 300, 40, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      // Petit pilier au milieu pour aider
      const pillar = Bodies.rectangle(600, 550, 40, 120, {
        isStatic: true,
        render: { fillStyle: '#546e7a' }
      });
      
      physics.addStaticBody(leftCliff);
      physics.addStaticBody(rightCliff);
      physics.addStaticBody(pillar);
      physics.createGoalZone(1020, 540, 120, 60);
    }
  },

  {
    name: 'Chute Libre',
    description: 'Guidez la chute depuis les hauteurs',
    numCharacters: 14,
    targetTime: 50,
    spawn: { x: 160, y: 120 },
    goal: { x: 980, y: 560, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Plateforme de départ en hauteur
      const startPlatform = Bodies.rectangle(200, 160, 240, 20, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      // Plateformes intermédiaires
      const midPlatforms = [
        Bodies.rectangle(450, 280, 160, 18, {
          isStatic: true,
          render: { fillStyle: '#455a64' }
        }),
        Bodies.rectangle(680, 420, 160, 18, {
          isStatic: true,
          render: { fillStyle: '#455a64' }
        })
      ];
      
      // Sol d'arrivée
      const endGround = Bodies.rectangle(1020, 600, 280, 30, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      physics.addStaticBody(startPlatform);
      midPlatforms.forEach(platform => physics.addStaticBody(platform));
      physics.addStaticBody(endGround);
      physics.createGoalZone(980, 560, 140, 40);
    }
  },

  {
    name: 'Forêt de Piliers',
    description: 'Naviguez entre les obstacles',
    numCharacters: 20,
    targetTime: 65,
    spawn: { x: 120, y: 540 },
    goal: { x: 1040, y: 540, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Sol continu
      const ground = Bodies.rectangle(600, 600, 1000, 30, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      // Série de piliers
      const pillars = [];
      for (let i = 0; i < 8; i++) {
        const x = 320 + i * 100;
        const height = 120 + (i % 3) * 40; // Hauteurs variées
        
        pillars.push(Bodies.rectangle(x, 600 - height / 2, 24, height, {
          isStatic: true,
          render: { fillStyle: '#546e7a' }
        }));
      }
      
      physics.addStaticBody(ground);
      pillars.forEach(pillar => physics.addStaticBody(pillar));
      physics.createGoalZone(1040, 540, 120, 60);
    }
  },

  {
    name: 'Plateforme Mobile',
    description: 'Utilisez la plateforme qui bouge',
    numCharacters: 16,
    targetTime: 80,
    spawn: { x: 140, y: 520 },
    goal: { x: 1000, y: 320, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Plateformes fixes
      const startPlatform = Bodies.rectangle(220, 580, 280, 24, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      const endPlatform = Bodies.rectangle(1040, 360, 240, 24, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      // Plateforme mobile
      const movingPlatform = Bodies.rectangle(600, 450, 200, 20, {
        isStatic: true,
        render: { fillStyle: '#42a5f5' }
      });
      
      // Animation de la plateforme
      let time = 0;
      movingPlatform._update = () => {
        time += 0.02;
        const x = 600 + Math.sin(time) * 180;
        const y = 450 + Math.sin(time * 0.7) * 60;
        Body.setPosition(movingPlatform, { x, y });
      };
      
      physics.addStaticBody(startPlatform);
      physics.addStaticBody(endPlatform);
      physics.addStaticBody(movingPlatform);
      physics.createGoalZone(1000, 320, 140, 40);
    }
  },

  {
    name: 'Tunnel Étroit',
    description: 'Passez sous les obstacles',
    numCharacters: 15,
    targetTime: 55,
    spawn: { x: 120, y: 540 },
    goal: { x: 1020, y: 540, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Sol
      const ground = Bodies.rectangle(600, 600, 1000, 30, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      // Plafonds bas
      const roofs = [
        Bodies.rectangle(400, 520, 240, 20, {
          isStatic: true,
          render: { fillStyle: '#455a64' }
        }),
        Bodies.rectangle(700, 500, 200, 20, {
          isStatic: true,
          render: { fillStyle: '#455a64' }
        }),
        Bodies.rectangle(900, 530, 180, 20, {
          isStatic: true,
          render: { fillStyle: '#455a64' }
        })
      ];
      
      physics.addStaticBody(ground);
      roofs.forEach(roof => physics.addStaticBody(roof));
      physics.createGoalZone(1020, 540, 120, 60);
    }
  },

  {
    name: 'Rampe Extrême',
    description: 'Montée raide vers le sommet',
    numCharacters: 18,
    targetTime: 70,
    spawn: { x: 140, y: 560 },
    goal: { x: 980, y: 180, w: 160, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Plateforme de départ
      const start = Bodies.rectangle(240, 600, 320, 28, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      // Grande rampe inclinée
      const ramp = Bodies.rectangle(650, 400, 500, 24, {
        isStatic: true,
        angle: -0.3, // ~17 degrés
        render: { fillStyle: '#546e7a' }
      });
      
      // Plateforme d'arrivée
      const end = Bodies.rectangle(1020, 220, 240, 24, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      physics.addStaticBody(start);
      physics.addStaticBody(ramp);
      physics.addStaticBody(end);
      physics.createGoalZone(980, 180, 160, 40);
    }
  },

  {
    name: 'Îles Flottantes',
    description: 'Sautez d\'île en île',
    numCharacters: 22,
    targetTime: 90,
    spawn: { x: 140, y: 480 },
    goal: { x: 980, y: 280, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Série d'îles à différentes hauteurs
      const islands = [
        { x: 200, y: 520, w: 160, h: 18 },
        { x: 380, y: 460, w: 140, h: 18 },
        { x: 540, y: 400, w: 120, h: 18 },
        { x: 700, y: 350, w: 130, h: 18 },
        { x: 860, y: 300, w: 150, h: 18 },
        { x: 1020, y: 320, w: 180, h: 18 }
      ];
      
      islands.forEach(island => {
        const body = Bodies.rectangle(island.x, island.y, island.w, island.h, {
          isStatic: true,
          render: { fillStyle: '#455a64' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(980, 280, 140, 40);
    }
  },

  {
    name: 'Labyrinthe Vertical',
    description: 'Trouvez le chemin dans le dédale',
    numCharacters: 20,
    targetTime: 100,
    spawn: { x: 120, y: 540 },
    goal: { x: 1000, y: 160, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Structure de labyrinthe simplifié
      const walls = [
        // Murs verticaux
        { x: 300, y: 450, w: 20, h: 200 },
        { x: 500, y: 380, w: 20, h: 160 },
        { x: 700, y: 320, w: 20, h: 240 },
        { x: 900, y: 280, w: 20, h: 180 },
        
        // Plateformes horizontales
        { x: 400, y: 500, w: 180, h: 18 },
        { x: 600, y: 420, w: 180, h: 18 },
        { x: 800, y: 360, w: 180, h: 18 },
        { x: 1000, y: 240, w: 180, h: 18 }
      ];
      
      // Sol de base
      const ground = Bodies.rectangle(200, 600, 300, 30, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      physics.addStaticBody(ground);
      
      walls.forEach(wall => {
        const body = Bodies.rectangle(wall.x, wall.y, wall.w, wall.h, {
          isStatic: true,
          render: { fillStyle: '#546e7a' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1000, 160, 140, 40);
    }
  },

  {
    name: 'Pont de Cordes',
    description: 'Créez un pont suspendu pour traverser',
    numCharacters: 16,
    targetTime: 85,
    spawn: { x: 120, y: 480 },
    goal: { x: 1040, y: 480, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Plateformes de départ et d'arrivée
      const startPlatform = Bodies.rectangle(200, 520, 200, 20, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      const endPlatform = Bodies.rectangle(1040, 520, 200, 20, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      // Piliers de support
      const leftPillar = Bodies.rectangle(400, 450, 30, 120, {
        isStatic: true,
        render: { fillStyle: '#8d6e63' }
      });
      
      const rightPillar = Bodies.rectangle(840, 450, 30, 120, {
        isStatic: true,
        render: { fillStyle: '#8d6e63' }
      });
      
      physics.addStaticBody(startPlatform);
      physics.addStaticBody(endPlatform);
      physics.addStaticBody(leftPillar);
      physics.addStaticBody(rightPillar);
      physics.createGoalZone(1040, 480, 120, 60);
    }
  },

  {
    name: 'Spirale Ascendante',
    description: 'Suivez la spirale vers le sommet',
    numCharacters: 18,
    targetTime: 95,
    spawn: { x: 140, y: 560 },
    goal: { x: 600, y: 140, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Centre de la spirale
      const centerX = 600;
      const centerY = 600;
      
      // Créer les segments de la spirale
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const radius = 80 + i * 40;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY - Math.sin(angle) * radius;
        
        const segment = Bodies.rectangle(x, y, 120, 16, {
          isStatic: true,
          angle: angle + Math.PI / 2,
          render: { fillStyle: '#455a64' }
        });
        
        physics.addStaticBody(segment);
      }
      
      // Plateforme d'arrivée au centre
      const endPlatform = Bodies.rectangle(600, 160, 180, 20, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      physics.addStaticBody(endPlatform);
      physics.createGoalZone(600, 140, 140, 40);
    }
  },

  {
    name: 'Cascade de Plateformes',
    description: 'Descendez en cascade de plateforme en plateforme',
    numCharacters: 20,
    targetTime: 75,
    spawn: { x: 160, y: 120 },
    goal: { x: 980, y: 560, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Série de plateformes en cascade
      const platforms = [
        { x: 200, y: 160, w: 180, h: 16 },
        { x: 380, y: 240, w: 160, h: 16 },
        { x: 540, y: 320, w: 140, h: 16 },
        { x: 680, y: 400, w: 120, h: 16 },
        { x: 800, y: 480, w: 100, h: 16 },
        { x: 900, y: 560, w: 120, h: 16 }
      ];
      
      platforms.forEach((platform, index) => {
        const body = Bodies.rectangle(platform.x, platform.y, platform.w, platform.h, {
          isStatic: true,
          render: { fillStyle: index % 2 === 0 ? '#455a64' : '#546e7a' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(980, 560, 140, 40);
    }
  },

  {
    name: 'Maze Runner',
    description: 'Trouvez la sortie du labyrinthe horizontal',
    numCharacters: 16,
    targetTime: 110,
    spawn: { x: 120, y: 540 },
    goal: { x: 1040, y: 540, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Sol de base
      const ground = Bodies.rectangle(600, 600, 1000, 30, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      // Murs du labyrinthe
      const walls = [
        // Couloir 1
        { x: 300, y: 520, w: 20, h: 120 },
        { x: 500, y: 480, w: 20, h: 200 },
        { x: 700, y: 520, w: 20, h: 120 },
        { x: 900, y: 480, w: 20, h: 200 },
        
        // Couloir 2
        { x: 400, y: 480, w: 180, h: 20 },
        { x: 600, y: 520, w: 180, h: 20 },
        { x: 800, y: 480, w: 180, h: 20 }
      ];
      
      physics.addStaticBody(ground);
      walls.forEach(wall => {
        const body = Bodies.rectangle(wall.x, wall.y, wall.w, wall.h, {
          isStatic: true,
          render: { fillStyle: '#546e7a' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 540, 120, 60);
    }
  },

  {
    name: 'Toboggan Géant',
    description: 'Glissez sur le toboggan vers la zone d\'arrivée',
    numCharacters: 14,
    targetTime: 60,
    spawn: { x: 140, y: 120 },
    goal: { x: 980, y: 560, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Toboggan incliné
      const toboggan = Bodies.rectangle(600, 350, 800, 20, {
        isStatic: true,
        angle: -0.4, // ~23 degrés
        render: { fillStyle: '#42a5f5' }
      });
      
      // Plateforme de départ
      const startPlatform = Bodies.rectangle(200, 160, 200, 20, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      // Zone d'arrivée
      const endPlatform = Bodies.rectangle(1020, 580, 200, 20, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      physics.addStaticBody(toboggan);
      physics.addStaticBody(startPlatform);
      physics.addStaticBody(endPlatform);
      physics.createGoalZone(980, 560, 140, 40);
    }
  },

  {
    name: 'Parcours d\'Obstacles',
    description: 'Surmontez tous les obstacles du parcours',
    numCharacters: 22,
    targetTime: 120,
    spawn: { x: 120, y: 540 },
    goal: { x: 1040, y: 540, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Sol de base
      const ground = Bodies.rectangle(600, 600, 1000, 30, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      // Série d'obstacles variés
      const obstacles = [
        // Mur bas
        { x: 300, y: 520, w: 20, h: 80 },
        // Mur moyen
        { x: 450, y: 500, w: 20, h: 120 },
        // Mur haut
        { x: 600, y: 480, w: 20, h: 160 },
        // Tunnel
        { x: 750, y: 520, w: 20, h: 80 },
        // Dernier obstacle
        { x: 900, y: 500, w: 20, h: 120 }
      ];
      
      physics.addStaticBody(ground);
      obstacles.forEach(obstacle => {
        const body = Bodies.rectangle(obstacle.x, obstacle.y, obstacle.w, obstacle.h, {
          isStatic: true,
          render: { fillStyle: '#ff5722' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 540, 120, 60);
    }
  },

  {
    name: 'Ascenseur Spatial',
    description: 'Montez dans l\'ascenseur vers les étoiles',
    numCharacters: 16,
    targetTime: 80,
    spawn: { x: 140, y: 560 },
    goal: { x: 600, y: 120, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Plateformes d'étages
      const floors = [
        { x: 200, y: 580, w: 200, h: 20 }, // Rez-de-chaussée
        { x: 400, y: 480, w: 200, h: 20 }, // 1er étage
        { x: 600, y: 380, w: 200, h: 20 }, // 2ème étage
        { x: 800, y: 280, w: 200, h: 20 }, // 3ème étage
        { x: 600, y: 180, w: 200, h: 20 }  // Sommet
      ];
      
      floors.forEach((floor, index) => {
        const body = Bodies.rectangle(floor.x, floor.y, floor.w, floor.h, {
          isStatic: true,
          render: { fillStyle: index % 2 === 0 ? '#37474f' : '#455a64' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(600, 120, 140, 40);
    }
  },

  {
    name: 'Pont de Glace',
    description: 'Traversez le pont de glace fragile',
    numCharacters: 12,
    targetTime: 70,
    spawn: { x: 120, y: 480 },
    goal: { x: 1040, y: 480, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Plateformes de départ et d'arrivée
      const startPlatform = Bodies.rectangle(200, 520, 200, 20, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      const endPlatform = Bodies.rectangle(1040, 520, 200, 20, {
        isStatic: true,
        render: { fillStyle: '#37474f' }
      });
      
      // Pont de glace (segments séparés pour plus de défi)
      const iceSegments = [
        { x: 350, y: 480, w: 80, h: 12 },
        { x: 450, y: 480, w: 80, h: 12 },
        { x: 550, y: 480, w: 80, h: 12 },
        { x: 650, y: 480, w: 80, h: 12 },
        { x: 750, y: 480, w: 80, h: 12 },
        { x: 850, y: 480, w: 80, h: 12 }
      ];
      
      physics.addStaticBody(startPlatform);
      physics.addStaticBody(endPlatform);
      
      iceSegments.forEach(segment => {
        const body = Bodies.rectangle(segment.x, segment.y, segment.w, segment.h, {
          isStatic: true,
          render: { fillStyle: '#81c784' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 480, 120, 60);
    }
  },

  {
    name: 'Volcan en Éruption',
    description: 'Évitez les rochers et atteignez le sommet',
    numCharacters: 18,
    targetTime: 90,
    spawn: { x: 140, y: 560 },
    goal: { x: 600, y: 140, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Base du volcan
      const volcanoBase = Bodies.rectangle(600, 580, 400, 40, {
        isStatic: true,
        render: { fillStyle: '#8d6e63' }
      });
      
      // Pente du volcan
      const volcanoSlope = Bodies.rectangle(600, 400, 300, 20, {
        isStatic: true,
        angle: -0.3,
        render: { fillStyle: '#a1887f' }
      });
      
      // Sommet du volcan
      const volcanoTop = Bodies.rectangle(600, 180, 200, 20, {
        isStatic: true,
        render: { fillStyle: '#6d4c41' }
      });
      
      // Rochers d'obstacles
      const rocks = [
        { x: 450, y: 520, w: 40, h: 40 },
        { x: 750, y: 480, w: 35, h: 35 },
        { x: 550, y: 420, w: 45, h: 45 },
        { x: 650, y: 360, w: 30, h: 30 }
      ];
      
      physics.addStaticBody(volcanoBase);
      physics.addStaticBody(volcanoSlope);
      physics.addStaticBody(volcanoTop);
      
      rocks.forEach(rock => {
        const body = Bodies.rectangle(rock.x, rock.y, rock.w, rock.h, {
          isStatic: true,
          render: { fillStyle: '#5d4037' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(600, 140, 140, 40);
    }
  },

  {
    name: 'Circuit de Course',
    description: 'Complétez le circuit de course complet',
    numCharacters: 24,
    targetTime: 150,
    spawn: { x: 120, y: 540 },
    goal: { x: 120, y: 540, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Circuit en forme de 8
      const circuit = [
        // Partie gauche du 8
        { x: 200, y: 400, w: 200, h: 20, angle: 0 },
        { x: 200, y: 300, w: 20, h: 200, angle: 0 },
        { x: 200, y: 200, w: 200, h: 20, angle: 0 },
        { x: 400, y: 300, w: 20, h: 200, angle: 0 },
        
        // Partie droite du 8
        { x: 600, y: 400, w: 200, h: 20, angle: 0 },
        { x: 600, y: 300, w: 20, h: 200, angle: 0 },
        { x: 600, y: 200, w: 200, h: 20, angle: 0 },
        { x: 800, y: 300, w: 20, h: 200, angle: 0 },
        
        // Connexion centrale
        { x: 500, y: 300, w: 200, h: 20, angle: 0 }
      ];
      
      circuit.forEach(segment => {
        const body = Bodies.rectangle(segment.x, segment.y, segment.w, segment.h, {
          isStatic: true,
          angle: segment.angle,
          render: { fillStyle: '#ff9800' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(120, 540, 120, 60);
    }
  },

  {
    name: 'Pyramide Égyptienne',
    description: 'Montez les marches de la pyramide mystérieuse',
    numCharacters: 20,
    targetTime: 100,
    spawn: { x: 140, y: 560 },
    goal: { x: 600, y: 120, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Base de la pyramide
      const base = Bodies.rectangle(600, 580, 400, 40, {
        isStatic: true,
        render: { fillStyle: '#ff9800' }
      });
      
      // Marches de la pyramide
      const steps = [
        { x: 600, y: 520, w: 320, h: 20 },
        { x: 600, y: 460, w: 240, h: 20 },
        { x: 600, y: 400, w: 160, h: 20 },
        { x: 600, y: 340, w: 80, h: 20 }
      ];
      
      physics.addStaticBody(base);
      steps.forEach((step, index) => {
        const body = Bodies.rectangle(step.x, step.y, step.w, step.h, {
          isStatic: true,
          render: { fillStyle: index % 2 === 0 ? '#ff9800' : '#f57c00' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(600, 120, 140, 40);
    }
  },

  {
    name: 'Château Fort',
    description: 'Assiégez le château et atteignez la tour',
    numCharacters: 18,
    targetTime: 120,
    spawn: { x: 120, y: 540 },
    goal: { x: 1000, y: 160, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Remparts du château
      const walls = [
        { x: 300, y: 500, w: 20, h: 200 },
        { x: 500, y: 480, w: 20, h: 240 },
        { x: 700, y: 460, w: 20, h: 280 },
        { x: 900, y: 440, w: 20, h: 320 }
      ];
      
      // Plateformes d'accès
      const platforms = [
        { x: 400, y: 520, w: 180, h: 20 },
        { x: 600, y: 500, w: 180, h: 20 },
        { x: 800, y: 480, w: 180, h: 20 },
        { x: 1000, y: 200, w: 180, h: 20 }
      ];
      
      walls.forEach(wall => {
        const body = Bodies.rectangle(wall.x, wall.y, wall.w, wall.h, {
          isStatic: true,
          render: { fillStyle: '#8d6e63' }
        });
        physics.addStaticBody(body);
      });
      
      platforms.forEach(platform => {
        const body = Bodies.rectangle(platform.x, platform.y, platform.w, platform.h, {
          isStatic: true,
          render: { fillStyle: '#a1887f' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1000, 160, 140, 40);
    }
  },

  {
    name: 'Station Spatiale',
    description: 'Naviguez dans la station spatiale en apesanteur',
    numCharacters: 16,
    targetTime: 90,
    spawn: { x: 140, y: 560 },
    goal: { x: 1040, y: 160, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Modules de la station
      const modules = [
        { x: 300, y: 500, w: 120, h: 80 },
        { x: 500, y: 400, w: 120, h: 80 },
        { x: 700, y: 300, w: 120, h: 80 },
        { x: 900, y: 200, w: 120, h: 80 }
      ];
      
      // Passerelles de connexion
      const bridges = [
        { x: 420, y: 460, w: 160, h: 20 },
        { x: 620, y: 360, w: 160, h: 20 },
        { x: 820, y: 260, w: 160, h: 20 }
      ];
      
      modules.forEach(module => {
        const body = Bodies.rectangle(module.x, module.y, module.w, module.h, {
          isStatic: true,
          render: { fillStyle: '#3f51b5' }
        });
        physics.addStaticBody(body);
      });
      
      bridges.forEach(bridge => {
        const body = Bodies.rectangle(bridge.x, bridge.y, bridge.w, bridge.h, {
          isStatic: true,
          render: { fillStyle: '#7986cb' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 160, 140, 40);
    }
  },

  {
    name: 'Forêt Enchantée',
    description: 'Traversez la forêt magique et ses arbres géants',
    numCharacters: 22,
    targetTime: 110,
    spawn: { x: 120, y: 540 },
    goal: { x: 1040, y: 540, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Sol de la forêt
      const ground = Bodies.rectangle(600, 600, 1000, 30, {
        isStatic: true,
        render: { fillStyle: '#4caf50' }
      });
      
      // Arbres géants
      const trees = [
        { x: 300, y: 450, w: 40, h: 200 },
        { x: 500, y: 420, w: 40, h: 240 },
        { x: 700, y: 480, w: 40, h: 160 },
        { x: 900, y: 460, w: 40, h: 180 }
      ];
      
      // Ponts entre les arbres
      const bridges = [
        { x: 400, y: 480, w: 180, h: 20 },
        { x: 600, y: 450, w: 180, h: 20 },
        { x: 800, y: 470, w: 180, h: 20 }
      ];
      
      physics.addStaticBody(ground);
      
      trees.forEach(tree => {
        const body = Bodies.rectangle(tree.x, tree.y, tree.w, tree.h, {
          isStatic: true,
          render: { fillStyle: '#8d6e63' }
        });
        physics.addStaticBody(body);
      });
      
      bridges.forEach(bridge => {
        const body = Bodies.rectangle(bridge.x, bridge.y, bridge.w, bridge.h, {
          isStatic: true,
          render: { fillStyle: '#a5d6a7' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 540, 120, 60);
    }
  },

  {
    name: 'Canyon du Temps',
    description: 'Traversez le canyon aux couleurs du temps',
    numCharacters: 18,
    targetTime: 85,
    spawn: { x: 140, y: 480 },
    goal: { x: 1040, y: 480, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Falaises du canyon
      const cliffs = [
        { x: 200, y: 600, w: 300, h: 40 },
        { x: 900, y: 600, w: 300, h: 40 }
      ];
      
      // Piliers de pierre colorés
      const pillars = [
        { x: 400, y: 520, w: 30, h: 120, color: '#ff5722' },
        { x: 600, y: 500, w: 30, h: 160, color: '#ff9800' },
        { x: 800, y: 480, w: 30, h: 200, color: '#ffc107' }
      ];
      
      cliffs.forEach(cliff => {
        const body = Bodies.rectangle(cliff.x, cliff.y, cliff.w, cliff.h, {
          isStatic: true,
          render: { fillStyle: '#795548' }
        });
        physics.addStaticBody(body);
      });
      
      pillars.forEach(pillar => {
        const body = Bodies.rectangle(pillar.x, pillar.y, pillar.w, pillar.h, {
          isStatic: true,
          render: { fillStyle: pillar.color }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 480, 120, 60);
    }
  },

  {
    name: 'Aqueduc Romain',
    description: 'Suivez l\'aqueduc antique vers la cité',
    numCharacters: 16,
    targetTime: 95,
    spawn: { x: 120, y: 480 },
    goal: { x: 1040, y: 280, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Arches de l'aqueduc
      const arches = [
        { x: 300, y: 500, w: 80, h: 160 },
        { x: 500, y: 450, w: 80, h: 200 },
        { x: 700, y: 400, w: 80, h: 240 },
        { x: 900, y: 350, w: 80, h: 280 }
      ];
      
      // Ponts de connexion
      const bridges = [
        { x: 400, y: 480, w: 180, h: 20 },
        { x: 600, y: 430, w: 180, h: 20 },
        { x: 800, y: 380, w: 180, h: 20 }
      ];
      
      arches.forEach(arch => {
        const body = Bodies.rectangle(arch.x, arch.y, arch.w, arch.h, {
          isStatic: true,
          render: { fillStyle: '#8d6e63' }
        });
        physics.addStaticBody(body);
      });
      
      bridges.forEach(bridge => {
        const body = Bodies.rectangle(bridge.x, bridge.y, bridge.w, bridge.h, {
          isStatic: true,
          render: { fillStyle: '#a1887f' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 280, 120, 60);
    }
  },

  {
    name: 'Montagne Russe',
    description: 'Surfez sur les vagues de la montagne russe',
    numCharacters: 14,
    targetTime: 70,
    spawn: { x: 140, y: 120 },
    goal: { x: 1040, y: 560, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Rails de la montagne russe
      const tracks = [
        { x: 300, y: 200, w: 200, h: 20, angle: -0.2 },
        { x: 500, y: 300, w: 200, h: 20, angle: 0.3 },
        { x: 700, y: 200, w: 200, h: 20, angle: -0.4 },
        { x: 900, y: 400, w: 200, h: 20, angle: 0.5 }
      ];
      
      // Plateformes de support
      const supports = [
        { x: 400, y: 280, w: 20, h: 120 },
        { x: 600, y: 380, w: 20, h: 120 },
        { x: 800, y: 280, w: 20, h: 120 }
      ];
      
      tracks.forEach(track => {
        const body = Bodies.rectangle(track.x, track.y, track.w, track.h, {
          isStatic: true,
          angle: track.angle,
          render: { fillStyle: '#e91e63' }
        });
        physics.addStaticBody(body);
      });
      
      supports.forEach(support => {
        const body = Bodies.rectangle(support.x, support.y, support.w, support.h, {
          isStatic: true,
          render: { fillStyle: '#9c27b0' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 560, 120, 60);
    }
  },

  {
    name: 'Labyrinthe de Glace',
    description: 'Naviguez dans le labyrinthe glacé',
    numCharacters: 18,
    targetTime: 130,
    spawn: { x: 120, y: 540 },
    goal: { x: 1040, y: 160, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Sol glacé
      const iceGround = Bodies.rectangle(600, 600, 1000, 30, {
        isStatic: true,
        render: { fillStyle: '#81c784' }
      });
      
      // Murs de glace
      const iceWalls = [
        { x: 300, y: 520, w: 20, h: 120 },
        { x: 500, y: 480, w: 20, h: 200 },
        { x: 700, y: 440, w: 20, h: 280 },
        { x: 900, y: 400, w: 20, h: 360 },
        { x: 400, y: 480, w: 180, h: 20 },
        { x: 600, y: 440, w: 180, h: 20 },
        { x: 800, y: 400, w: 180, h: 20 },
        { x: 1000, y: 240, w: 180, h: 20 }
      ];
      
      physics.addStaticBody(iceGround);
      
      iceWalls.forEach(wall => {
        const body = Bodies.rectangle(wall.x, wall.y, wall.w, wall.h, {
          isStatic: true,
          render: { fillStyle: '#4fc3f7' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 160, 140, 40);
    }
  },

  {
    name: 'Temple Maya',
    description: 'Montez les marches du temple mystérieux',
    numCharacters: 20,
    targetTime: 105,
    spawn: { x: 140, y: 560 },
    goal: { x: 600, y: 120, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Base du temple
      const base = Bodies.rectangle(600, 580, 500, 40, {
        isStatic: true,
        render: { fillStyle: '#ff9800' }
      });
      
      // Marches du temple
      const steps = [
        { x: 600, y: 520, w: 400, h: 20 },
        { x: 600, y: 460, w: 300, h: 20 },
        { x: 600, y: 400, w: 200, h: 20 },
        { x: 600, y: 340, w: 100, h: 20 }
      ];
      
      // Pyramide centrale
      const pyramid = Bodies.rectangle(600, 280, 80, 80, {
        isStatic: true,
        render: { fillStyle: '#f57c00' }
      });
      
      physics.addStaticBody(base);
      
      steps.forEach((step, index) => {
        const body = Bodies.rectangle(step.x, step.y, step.w, step.h, {
          isStatic: true,
          render: { fillStyle: index % 2 === 0 ? '#ff9800' : '#f57c00' }
        });
        physics.addStaticBody(body);
      });
      
      physics.addStaticBody(pyramid);
      physics.createGoalZone(600, 120, 140, 40);
    }
  },

  {
    name: 'Circuit de Formule 1',
    description: 'Parcourez le circuit de course professionnel',
    numCharacters: 24,
    targetTime: 160,
    spawn: { x: 120, y: 540 },
    goal: { x: 120, y: 540, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Circuit complexe avec virages
      const circuit = [
        // Ligne droite de départ
        { x: 200, y: 500, w: 200, h: 20, angle: 0 },
        // Premier virage
        { x: 400, y: 400, w: 20, h: 200, angle: 0 },
        { x: 400, y: 300, w: 200, h: 20, angle: 0 },
        // Deuxième virage
        { x: 600, y: 300, w: 20, h: 200, angle: 0 },
        { x: 600, y: 500, w: 200, h: 20, angle: 0 },
        // Troisième virage
        { x: 800, y: 500, w: 20, h: 200, angle: 0 },
        { x: 800, y: 300, w: 200, h: 20, angle: 0 },
        // Retour
        { x: 1000, y: 300, w: 20, h: 200, angle: 0 },
        { x: 1000, y: 500, w: 200, h: 20, angle: 0 },
        // Ligne droite d'arrivée
        { x: 200, y: 500, w: 200, h: 20, angle: 0 }
      ];
      
      circuit.forEach(segment => {
        const body = Bodies.rectangle(segment.x, segment.y, segment.w, segment.h, {
          isStatic: true,
          angle: segment.angle,
          render: { fillStyle: '#f44336' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(120, 540, 120, 60);
    }
  },

  {
    name: 'Grotte de Cristal',
    description: 'Explorez la grotte aux cristaux lumineux',
    numCharacters: 16,
    targetTime: 95,
    spawn: { x: 120, y: 540 },
    goal: { x: 1040, y: 540, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Sol de la grotte
      const caveFloor = Bodies.rectangle(600, 600, 1000, 30, {
        isStatic: true,
        render: { fillStyle: '#424242' }
      });
      
      // Cristaux géants
      const crystals = [
        { x: 300, y: 480, w: 30, h: 160, color: '#e1bee7' },
        { x: 500, y: 460, w: 30, h: 200, color: '#c8e6c9' },
        { x: 700, y: 500, w: 30, h: 120, color: '#bbdefb' },
        { x: 900, y: 470, w: 30, h: 180, color: '#fff9c4' }
      ];
      
      // Passages entre cristaux
      const passages = [
        { x: 400, y: 520, w: 180, h: 20 },
        { x: 600, y: 500, w: 180, h: 20 },
        { x: 800, y: 520, w: 180, h: 20 }
      ];
      
      physics.addStaticBody(caveFloor);
      
      crystals.forEach(crystal => {
        const body = Bodies.rectangle(crystal.x, crystal.y, crystal.w, crystal.h, {
          isStatic: true,
          render: { fillStyle: crystal.color }
        });
        physics.addStaticBody(body);
      });
      
      passages.forEach(passage => {
        const body = Bodies.rectangle(passage.x, passage.y, passage.w, passage.h, {
          isStatic: true,
          render: { fillStyle: '#757575' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 540, 120, 60);
    }
  },

  {
    name: 'Ascenseur à Bulles',
    description: 'Montez dans les bulles flottantes',
    numCharacters: 14,
    targetTime: 80,
    spawn: { x: 140, y: 560 },
    goal: { x: 600, y: 120, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Bulles flottantes
      const bubbles = [
        { x: 300, y: 480, w: 100, h: 100 },
        { x: 500, y: 380, w: 100, h: 100 },
        { x: 700, y: 280, w: 100, h: 100 },
        { x: 600, y: 180, w: 100, h: 100 }
      ];
      
      // Passerelles entre bulles
      const bridges = [
        { x: 400, y: 480, w: 180, h: 20 },
        { x: 600, y: 380, w: 180, h: 20 },
        { x: 700, y: 280, w: 180, h: 20 }
      ];
      
      bubbles.forEach(bubble => {
        const body = Bodies.rectangle(bubble.x, bubble.y, bubble.w, bubble.h, {
          isStatic: true,
          render: { fillStyle: '#e3f2fd' }
        });
        physics.addStaticBody(body);
      });
      
      bridges.forEach(bridge => {
        const body = Bodies.rectangle(bridge.x, bridge.y, bridge.w, bridge.h, {
          isStatic: true,
          render: { fillStyle: '#bbdefb' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(600, 120, 140, 40);
    }
  },

  {
    name: 'Parc d\'Attractions',
    description: 'Visitez tous les manèges du parc',
    numCharacters: 22,
    targetTime: 140,
    spawn: { x: 120, y: 540 },
    goal: { x: 1040, y: 540, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Sol du parc
      const parkGround = Bodies.rectangle(600, 600, 1000, 30, {
        isStatic: true,
        render: { fillStyle: '#4caf50' }
      });
      
      // Manèges
      const rides = [
        { x: 300, y: 480, w: 80, h: 80, color: '#ff5722' },
        { x: 500, y: 460, w: 80, h: 80, color: '#ff9800' },
        { x: 700, y: 480, w: 80, h: 80, color: '#ffc107' },
        { x: 900, y: 460, w: 80, h: 80, color: '#4caf50' }
      ];
      
      // Chemins entre manèges
      const paths = [
        { x: 400, y: 520, w: 180, h: 20 },
        { x: 600, y: 500, w: 180, h: 20 },
        { x: 800, y: 520, w: 180, h: 20 }
      ];
      
      physics.addStaticBody(parkGround);
      
      rides.forEach(ride => {
        const body = Bodies.rectangle(ride.x, ride.y, ride.w, ride.h, {
          isStatic: true,
          render: { fillStyle: ride.color }
        });
        physics.addStaticBody(body);
      });
      
      paths.forEach(path => {
        const body = Bodies.rectangle(path.x, path.y, path.w, path.h, {
          isStatic: true,
          render: { fillStyle: '#8bc34a' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 540, 120, 60);
    }
  },

  {
    name: 'Ville Futuriste',
    description: 'Naviguez dans la ville du futur',
    numCharacters: 20,
    targetTime: 125,
    spawn: { x: 120, y: 540 },
    goal: { x: 1040, y: 160, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Gratte-ciels
      const skyscrapers = [
        { x: 300, y: 450, w: 60, h: 200 },
        { x: 500, y: 400, w: 60, h: 280 },
        { x: 700, y: 420, w: 60, h: 240 },
        { x: 900, y: 380, w: 60, h: 320 }
      ];
      
      // Passerelles aériennes
      const skybridges = [
        { x: 400, y: 480, w: 180, h: 20 },
        { x: 600, y: 430, w: 180, h: 20 },
        { x: 800, y: 450, w: 180, h: 20 },
        { x: 1000, y: 240, w: 180, h: 20 }
      ];
      
      skyscrapers.forEach(building => {
        const body = Bodies.rectangle(building.x, building.y, building.w, building.h, {
          isStatic: true,
          render: { fillStyle: '#607d8b' }
        });
        physics.addStaticBody(body);
      });
      
      skybridges.forEach(bridge => {
        const body = Bodies.rectangle(bridge.x, bridge.y, bridge.w, bridge.h, {
          isStatic: true,
          render: { fillStyle: '#90a4ae' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 160, 140, 40);
    }
  },

  {
    name: 'Île Déserte',
    description: 'Explorez l\'île déserte et ses secrets',
    numCharacters: 18,
    targetTime: 115,
    spawn: { x: 140, y: 560 },
    goal: { x: 1040, y: 280, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Îles flottantes
      const islands = [
        { x: 200, y: 520, w: 160, h: 20 },
        { x: 400, y: 460, w: 140, h: 20 },
        { x: 600, y: 400, w: 120, h: 20 },
        { x: 800, y: 340, w: 100, h: 20 },
        { x: 1000, y: 320, w: 120, h: 20 }
      ];
      
      // Palmiers
      const palmTrees = [
        { x: 300, y: 480, w: 20, h: 80 },
        { x: 500, y: 420, w: 20, h: 80 },
        { x: 700, y: 360, w: 20, h: 80 },
        { x: 900, y: 300, w: 20, h: 80 }
      ];
      
      islands.forEach(island => {
        const body = Bodies.rectangle(island.x, island.y, island.w, island.h, {
          isStatic: true,
          render: { fillStyle: '#8bc34a' }
        });
        physics.addStaticBody(body);
      });
      
      palmTrees.forEach(tree => {
        const body = Bodies.rectangle(tree.x, tree.y, tree.w, tree.h, {
          isStatic: true,
          render: { fillStyle: '#4caf50' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(1040, 280, 140, 40);
    }
  },

  {
    name: 'Mine de Diamants',
    description: 'Descendez dans la mine aux diamants précieux',
    numCharacters: 16,
    targetTime: 100,
    spawn: { x: 140, y: 120 },
    goal: { x: 980, y: 560, w: 140, h: 40 },
    walkDirection: 1,
    build(physics, width, height) {
      // Galeries de la mine
      const galleries = [
        { x: 300, y: 200, w: 200, h: 20 },
        { x: 500, y: 280, w: 200, h: 20 },
        { x: 700, y: 360, w: 200, h: 20 },
        { x: 900, y: 440, w: 200, h: 20 }
      ];
      
      // Diamants brillants
      const diamonds = [
        { x: 400, y: 160, w: 30, h: 30 },
        { x: 600, y: 240, w: 30, h: 30 },
        { x: 800, y: 320, w: 30, h: 30 },
        { x: 1000, y: 400, w: 30, h: 30 }
      ];
      
      // Échelles de descente
      const ladders = [
        { x: 450, y: 240, w: 20, h: 80 },
        { x: 650, y: 320, w: 20, h: 80 },
        { x: 850, y: 400, w: 20, h: 80 }
      ];
      
      galleries.forEach(gallery => {
        const body = Bodies.rectangle(gallery.x, gallery.y, gallery.w, gallery.h, {
          isStatic: true,
          render: { fillStyle: '#424242' }
        });
        physics.addStaticBody(body);
      });
      
      diamonds.forEach(diamond => {
        const body = Bodies.rectangle(diamond.x, diamond.y, diamond.w, diamond.h, {
          isStatic: true,
          render: { fillStyle: '#e1f5fe' }
        });
        physics.addStaticBody(body);
      });
      
      ladders.forEach(ladder => {
        const body = Bodies.rectangle(ladder.x, ladder.y, ladder.w, ladder.h, {
          isStatic: true,
          render: { fillStyle: '#8d6e63' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(980, 560, 140, 40);
    }
  },

  {
    name: 'Circuit de Karting',
    description: 'Parcourez le circuit de karting coloré',
    numCharacters: 20,
    targetTime: 135,
    spawn: { x: 120, y: 540 },
    goal: { x: 120, y: 540, w: 120, h: 60 },
    walkDirection: 1,
    build(physics, width, height) {
      // Circuit de karting avec virages serrés
      const track = [
        // Ligne droite de départ
        { x: 200, y: 500, w: 150, h: 20, angle: 0 },
        // Premier virage à droite
        { x: 350, y: 450, w: 20, h: 100, angle: 0 },
        { x: 350, y: 400, w: 100, h: 20, angle: 0 },
        // Deuxième virage à gauche
        { x: 450, y: 400, w: 20, h: 100, angle: 0 },
        { x: 450, y: 500, w: 100, h: 20, angle: 0 },
        // Troisième virage à droite
        { x: 550, y: 500, w: 20, h: 100, angle: 0 },
        { x: 550, y: 450, w: 100, h: 20, angle: 0 },
        // Quatrième virage à gauche
        { x: 650, y: 450, w: 20, h: 100, angle: 0 },
        { x: 650, y: 550, w: 100, h: 20, angle: 0 },
        // Cinquième virage à droite
        { x: 750, y: 550, w: 20, h: 100, angle: 0 },
        { x: 750, y: 500, w: 100, h: 20, angle: 0 },
        // Sixième virage à gauche
        { x: 850, y: 500, w: 20, h: 100, angle: 0 },
        { x: 850, y: 600, w: 100, h: 20, angle: 0 },
        // Retour vers la ligne d'arrivée
        { x: 200, y: 600, w: 750, h: 20, angle: 0 }
      ];
      
      track.forEach(segment => {
        const body = Bodies.rectangle(segment.x, segment.y, segment.w, segment.h, {
          isStatic: true,
          angle: segment.angle,
          render: { fillStyle: '#9c27b0' }
        });
        physics.addStaticBody(body);
      });
      
      physics.createGoalZone(120, 540, 120, 60);
    }
  }
];

// Fonction utilitaire pour créer une plateforme mobile
export function createMovingPlatform(physics, x, y, width, height, motionType = 'horizontal', speed = 0.02, amplitude = 100) {
  const platform = Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    render: { fillStyle: '#42a5f5' }
  });
  
  let time = 0;
  const originalX = x;
  const originalY = y;
  
  platform._update = () => {
    time += speed;
    
    switch (motionType) {
      case 'horizontal':
        Body.setPosition(platform, { 
          x: originalX + Math.sin(time) * amplitude, 
          y: originalY 
        });
        break;
      case 'vertical':
        Body.setPosition(platform, { 
          x: originalX, 
          y: originalY + Math.sin(time) * amplitude 
        });
        break;
      case 'circular':
        Body.setPosition(platform, { 
          x: originalX + Math.cos(time) * amplitude, 
          y: originalY + Math.sin(time) * amplitude 
        });
        break;
      case 'pendulum':
        const angle = Math.sin(time) * 0.5; // ±30 degrés
        Body.setAngle(platform, angle);
        break;
    }
  };
  
  physics.addStaticBody(platform);
  return platform;
}
