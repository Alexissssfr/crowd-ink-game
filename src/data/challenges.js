const { Bodies, Body } = window.Matter;

/**
 * Collection de challenges avec terrains et mécaniques variés
 */
export const challenges = [
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
