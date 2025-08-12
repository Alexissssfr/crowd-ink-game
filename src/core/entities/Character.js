const { Bodies, Body, Vector } = window.Matter;

/**
 * Personnage avec IA améliorée pour navigation naturelle
 */
export class Character {
  constructor(physics, position, goal, options = {}) {
    this.physics = physics;
    this.goal = goal;
    this.isDead = false;
    this.isInGoal = false;
    this.id = this.generateId();
    this.gameState = options.gameState; // Référence vers GameState
    this.soundManager = options.soundManager; // Gestionnaire de sons

    // Détection mobile pour ajuster la collision
    this.isMobile = this.detectMobileDevice();

    // Configuration
    this.radius = 6;
    this.maxSpeed = 2.5; // Vitesse réduite pour plus de réalisme
    this.moveForce = 0.0015; // Force de mouvement réduite
    this.jumpForce = 0.015;
    this.autoJump = options.autoJump ?? true;

    // État de navigation
    this.direction = options.initialDirection ?? 1; // 1 = droite, -1 = gauche
    this.targetDirection = this.direction;
    this.isGrounded = false;
    this.groundContact = null;
    this.lastGroundedTime = 0;

    // État d'IA
    this.stuckTimer = 0;
    this.stuckThreshold = 90; // frames (~1.5s)
    this.directionChangeDelay = 0;
    this.lastPosition = { ...position };
    this.positionHistory = [];

    // Détection d'environnement
    this.sensorRange = 20;
    this.groundCheckDistance = 8;
    this.wallCheckDistance = 15;

    // Anti-empilement forcé
    this.forceSeparated = false;
    this.separationCooldown = 0;
    this.verticallyBlocked = false;

    // État de gel (phase de préparation)
    this.isFrozen = false;

    // Création du corps physique
    this.createBody(position);
  }

  createBody(position) {
    // FORCER LES CARRÉS POUR TOUS LES APPAREILS (test)
    const size = this.radius * 1.5; // Taille du carré

    console.log(
      `🔲 Création CARRE forcée pour personnage ${this.id} (mobile: ${this.isMobile})`
    );

    // CARRÉS POUR TOUS LES APPAREILS
    this.body = Bodies.rectangle(position.x, position.y, size, size, {
      friction: 0.8,
      frictionAir: 0.02,
      frictionStatic: 0.9,
      restitution: 0.0,
      density: 0.002,
      label: "character",
      render: {
        fillStyle: "#ffd54f",
      },
      // PROPRIÉTÉS SIMPLIFIÉES
      inertia: Infinity,
      inverseInertia: 0,
      // Pas de rotation
      angle: 0,
      angularVelocity: 0,
    });

    this.physics.addDynamicBody(this.body);
  }

  update(deltaTime) {
    if (this.isDead || this.isFrozen) {
      if (this.isFrozen && Math.random() < 0.001) {
        // Log occasionnel pour éviter le spam
        console.log(`🧊 Personnage ${this.id} reste gelé`);
      }
      return;
    }

    // Mise à jour de l'état
    this.updateGroundedState();
    this.updatePositionHistory();

    // Logique de mouvement (seulement si pas gelé)
    this.updateTargetDirection();
    this.handleMovement(deltaTime);
    this.checkStuckState();

    // SUPPRIMÉ : Toutes les fonctions d'attraction
    // Les personnages ne sont plus attirés par quoi que ce soit

    // EMPÊCHER TOUTE TRAVERSÉE DE LIGNES
    this.preventLineTraversal();

    this.checkBounds();

    // Vérification de la zone objectif
    this.checkGoalZone();
  }

  updateGroundedState() {
    const wasGrounded = this.isGrounded;
    this.isGrounded = this.checkGrounded();

    if (this.isGrounded) {
      this.lastGroundedTime = performance.now();
      if (!wasGrounded) {
        // Vient d'atterrir, réduire le timer de blocage
        this.stuckTimer = Math.max(0, this.stuckTimer - 30);
        // Son d'atterrissage
        if (this.soundManager) {
          console.log(`🔊 Personnage ${this.id} ATTERRIT - Son d'atterrissage joué`);
          this.soundManager.playLand();
        }
      }
    } else if (wasGrounded && this.soundManager) {
      // Vient de décoller, son de vol
      console.log(`🔊 Personnage ${this.id} DÉCOLLE - Son de vol joué`);
      this.soundManager.playFly();
    }
  }

  checkGrounded() {
    const position = this.body.position;
    const bodyRadius = this.body.circleRadius || this.radius * 0.8;

    // Vérification multiple pour une détection plus fiable
    const checkPoints = [
      { x: position.x, y: position.y + bodyRadius }, // Centre
      { x: position.x - bodyRadius * 0.5, y: position.y + bodyRadius }, // Gauche
      { x: position.x + bodyRadius * 0.5, y: position.y + bodyRadius }, // Droite
    ];

    let groundFound = false;
    let groundBody = null;

    for (const startPoint of checkPoints) {
      const endPoint = {
        x: startPoint.x,
        y: startPoint.y + this.groundCheckDistance,
      };

      // Détecter uniquement les surfaces solides (pas les personnages)
      const hit = this.physics.raycast(
        startPoint,
        endPoint,
        (body) =>
          body !== this.body &&
          !body.isSensor &&
          body.label !== "character" &&
          (body.label === "drawn-trail" ||
            body.label === "obstacle" ||
            body.label === "world-bound")
      );

      if (hit) {
        groundFound = true;
        groundBody = hit.body;
        break;
      }
    }

    // Vérification supplémentaire pour les pentes
    if (!groundFound) {
      // Vérifier si on est sur une pente en regardant plus loin
      const slopeCheck = this.physics.raycast(
        { x: position.x, y: position.y + bodyRadius },
        { x: position.x, y: position.y + bodyRadius + 20 }, // Distance plus longue
        (body) =>
          body !== this.body &&
          !body.isSensor &&
          body.label !== "character" &&
          (body.label === "drawn-trail" ||
            body.label === "obstacle" ||
            body.label === "world-bound")
      );

      if (slopeCheck) {
        groundFound = true;
        groundBody = slopeCheck.body;
      }
    }

    // Gestion spéciale si sur un autre personnage
    const characterHit = this.physics.raycast(
      { x: position.x, y: position.y + bodyRadius },
      { x: position.x, y: position.y + bodyRadius + this.groundCheckDistance },
      (body) => body !== this.body && body.label === "character"
    );

    if (characterHit) {
      // Force de séparation douce pour éviter l'empilement
      const otherPos = characterHit.body.position;
      const pushDirection = position.x > otherPos.x ? 1 : -1;

      Body.applyForce(this.body, this.body.position, {
        x: pushDirection * 0.001, // Force horizontale très douce
        y: 0, // Jamais de force verticale
      });

      // Considérer comme non-grounded si on est sur un personnage
      // pour encourager le mouvement
      if (!groundFound) {
        this.groundContact = null;
        return false;
      }
    }

    if (groundFound) {
      this.groundContact = groundBody;
      return true;
    }

    this.groundContact = null;
    return false;
  }

  updatePositionHistory() {
    this.positionHistory.push({ ...this.body.position });
    if (this.positionHistory.length > 10) {
      this.positionHistory.shift();
    }
  }

  handleCharacterCollision(otherCharacter) {
    // SUR MOBILE : Collision ultra-simplifiée
    if (this.isMobile) {
      // Seulement une petite force de séparation horizontale
      const myPos = this.body.position;
      const otherPos = otherCharacter.position;
      const pushDirection = myPos.x > otherPos.x ? 1 : -1;

      Body.applyForce(this.body, this.body.position, {
        x: pushDirection * 0.0001, // Force très faible
        y: 0, // Pas de force verticale
      });
      return;
    }

    // SUR DESKTOP : Collision normale
    const myPos = this.body.position;
    const otherPos = otherCharacter.position;

    // Calculer la distance entre les personnages
    const distance = Math.sqrt(
      Math.pow(myPos.x - otherPos.x, 2) + Math.pow(myPos.y - otherPos.y, 2)
    );

    const minDistance = this.radius * 2.2;

    // Si les personnages sont trop proches, les séparer
    if (distance < minDistance) {
      const pushDirection = {
        x: (myPos.x - otherPos.x) / distance,
        y: (myPos.y - otherPos.y) / distance,
      };

      const pushForce = (minDistance - distance) * 0.001;

      // Adapter les forces à la vitesse du jeu
      const timeScale =
        (this.gameState &&
          this.gameState.gameSettings &&
          this.gameState.gameSettings.timeScale) ||
        1.0;
      const forceMultiplier = Math.min(1.0, 1.0 / timeScale);

      // Appliquer la force de séparation
      Body.applyForce(this.body, this.body.position, {
        x: pushDirection.x * pushForce * forceMultiplier,
        y: pushDirection.y * pushForce * forceMultiplier,
      });
    }
  }

  isBlockedByCharacters() {
    const position = this.body.position;
    const bodyRadius = this.body.circleRadius || this.radius * 0.8;

    // Tester s'il y a d'autres personnages devant dans la direction du mouvement
    const testDistance = bodyRadius * 3;
    const hit = this.physics.raycast(
      { x: position.x, y: position.y },
      { x: position.x + this.direction * testDistance, y: position.y },
      (body) => body !== this.body && body.label === "character"
    );

    return hit !== null;
  }

  emergencyStackingCheck() {
    // FONCTION DÉSACTIVÉE - causait des téléportations magiques
    // Les personnages ne doivent JAMAIS être téléportés avec setPosition()
    // Laisser Matter.js gérer les collisions naturellement
    return;
  }

  preventOverstacking() {
    // FONCTION DÉSACTIVÉE - causait des téléportations et comportements erratiques
    // Matter.js gère déjà les collisions entre personnages naturellement
    return;
  }

  handleClosedSpaceCollision(nearbyCharacters) {
    // FONCTION DÉSACTIVÉE - causait des mouvements erratiques
    // Laisser Matter.js gérer les collisions naturellement
    return;
  }

  preventTunneling() {
    // FONCTION DÉSACTIVÉE - causait des téléportations avec setPosition()
    // Matter.js avec les paramètres de précision élevés évite déjà le tunneling
    return;
  }

  calculateNormal(point, body) {
    // Calculer la normale de surface pour repositionner correctement
    const bodyCenter = body.position;
    const dx = point.x - bodyCenter.x;
    const dy = point.y - bodyCenter.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return { x: 0, y: -1 }; // Par défaut vers le haut

    return {
      x: dx / length,
      y: dy / length,
    };
  }

  checkGroundAhead() {
    // FONCTION DÉSACTIVÉE - causait des changements de direction inappropriés
    // Les personnages ne doivent changer de direction QUE face à un vrai mur perpendiculaire
    // ou un obstacle plus grand qu'eux - PAS sur des lignes droites !
    return;
  }

  preventBouncing() {
    const timeScale =
      (this.gameState &&
        this.gameState.gameSettings &&
        this.gameState.gameSettings.timeScale) ||
      1.0;

    const velocity = this.body.velocity;

    // ANTI-REBOND RENFORCÉ pour éviter les traversées
    // Détecter les sautillements verticaux
    if (Math.abs(velocity.y) > 0.5 && !this.isGrounded) {
      // Écraser le mouvement vertical excessif
      Body.setVelocity(this.body, {
        x: velocity.x, // GARDER le mouvement horizontal
        y: velocity.y * 0.05, // ÉCRASER fort le vertical
      });
    }

    // Détecter les rebonds horizontaux (contre les murs)
    if (Math.abs(velocity.x) > 1.5) {
      Body.setVelocity(this.body, {
        x: velocity.x * 0.2, // Réduire drastiquement les rebonds horizontaux
        y: velocity.y,
      });
    }

    // Détecter les explosions totales (vitesses anormales)
    if (Math.abs(velocity.x) > 2.5 || Math.abs(velocity.y) > 2.5) {
      // Écraser complètement en cas d'explosion
      Body.setVelocity(this.body, {
        x: velocity.x * 0.1,
        y: velocity.y * 0.1,
      });
    }

    // Sur mobile, anti-rebond encore plus agressif
    if (this.isMobile) {
      if (Math.abs(velocity.x) > 0.8 || Math.abs(velocity.y) > 0.8) {
        Body.setVelocity(this.body, {
          x: velocity.x * 0.3,
          y: velocity.y * 0.3,
        });
      }
    }
  }

  preventTrailPenetration() {
    const position = this.body.position;
    const velocity = this.body.velocity;
    const bodyRadius = this.body.circleRadius || this.radius * 0.8;

    // Seuil de vitesse pour éviter les faux positifs
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (speed < 0.8) return; // Seuil plus élevé

    // Distance de vérification modérée
    const lookAhead = Math.min(speed * 1.0, 8); // Distance réduite
    const futurePos = {
      x: position.x + (velocity.x / speed) * lookAhead,
      y: position.y + (velocity.y / speed) * lookAhead,
    };

    // Raycast simple
    const hit = this.physics.raycast(
      position,
      futurePos,
      (body) =>
        body !== this.body && body.label === "drawn-trail" && body.isStatic
    );

    if (hit) {
      console.log(`Personnage ${this.id} - Collision détectée, ralentissement`);

      // RALENTISSEMENT simple au lieu d'arrêt brutal
      Body.setVelocity(this.body, {
        x: velocity.x * 0.3, // Ralentissement modéré
        y: velocity.y * 0.7, // Réduction verticale légère
      });
    }
  }

  // NOUVELLE FONCTION : Détection de pente
  detectSlope() {
    const position = this.body.position;
    const bodyRadius = this.body.circleRadius || this.radius * 0.8;

    // Vérifier le sol actuel
    const currentGround = this.physics.raycast(
      { x: position.x, y: position.y },
      { x: position.x, y: position.y + 15 },
      (body) =>
        body !== this.body && body.label === "drawn-trail" && body.isStatic
    );

    // Vérifier le sol devant (plus loin pour mieux détecter les pentes)
    const frontGround = this.physics.raycast(
      { x: position.x + this.direction * bodyRadius * 2, y: position.y },
      { x: position.x + this.direction * bodyRadius * 2, y: position.y + 25 },
      (body) =>
        body !== this.body && body.label === "drawn-trail" && body.isStatic
    );

    // Vérifier aussi le sol un peu plus loin pour détecter les transitions
    const farGround = this.physics.raycast(
      { x: position.x + this.direction * bodyRadius * 3, y: position.y },
      { x: position.x + this.direction * bodyRadius * 3, y: position.y + 30 },
      (body) =>
        body !== this.body && body.label === "drawn-trail" && body.isStatic
    );

    if (currentGround && frontGround) {
      // Calculer la différence de hauteur
      const currentHeight = currentGround.point.y;
      const frontHeight = frontGround.point.y;
      const heightDiff = frontHeight - currentHeight;

      // Si on a aussi le sol plus loin, vérifier s'il y a une transition
      if (farGround) {
        const farHeight = farGround.point.y;
        const farDiff = farHeight - currentHeight;

        console.log(
          `Pente détectée: ${heightDiff.toFixed(2)} / ${farDiff.toFixed(
            2
          )} - Type: ${
            heightDiff < -1 ? "downhill" : heightDiff > 1 ? "uphill" : "flat"
          }`
        );

        // Si la pente change plus loin, c'est une transition
        if (
          (heightDiff > 0 && farDiff < -1) ||
          (heightDiff < 0 && farDiff > 1)
        ) {
          console.log(`Personnage ${this.id} - Transition de pente détectée`);
          return "transition";
        }
      } else {
        console.log(
          `Pente détectée: ${heightDiff.toFixed(2)} - Type: ${
            heightDiff < -1 ? "downhill" : heightDiff > 1 ? "uphill" : "flat"
          }`
        );
      }

      // Détecter le type de pente (seuils TRÈS sensibles)
      if (heightDiff < -0.5) {
        // Seuil plus bas pour détecter plus tôt
        return "downhill"; // Pente descendante
      } else if (heightDiff > 0.5) {
        // Seuil plus bas pour détecter plus tôt
        return "uphill"; // Pente montante
      }
    }

    return "flat"; // Terrain plat
  }

  // SYSTÈME BASIQUE : Marcher sur les lignes par le haut
  handleSlopeMovement() {
    // SYSTÈME SIMPLE : Rester sur la ligne
    if (this.isGrounded) {
      this.stayOnLine();
    }
  }

  // SYSTÈME BASIQUE : Rester sur la ligne
  stayOnLine() {
    const position = this.body.position;
    const bodyRadius = this.body.circleRadius || this.radius * 0.8;

    // Chercher la ligne directement sous le personnage
    const hit = this.physics.raycast(
      { x: position.x, y: position.y },
      { x: position.x, y: position.y + 20 },
      (body) =>
        body !== this.body && body.label === "drawn-trail" && body.isStatic
    );

    if (hit) {
      // Rester sur la ligne
      Body.setPosition(this.body, {
        x: position.x,
        y: hit.point.y - bodyRadius - 1,
      });

      // Vitesse normale
      Body.setVelocity(this.body, {
        x: this.direction * 1.0,
        y: 0,
      });
    }
  }

  // NOUVELLE FONCTION : Empêcher TOUTE traversée de lignes
  preventLineTraversal() {
    const position = this.body.position;
    const velocity = this.body.velocity;
    const bodyRadius = this.body.circleRadius || this.radius * 0.8;

    // VERSION MOBILE-OPTIMISÉE : Plus simple et plus efficace
    if (this.isMobile) {
      this.preventLineTraversalMobile();
      return;
    }

    // Vérifier les 4 directions principales
    const directions = [
      { x: 1, y: 0 }, // Droite
      { x: -1, y: 0 }, // Gauche
      { x: 0, y: 1 }, // Bas
      { x: 0, y: -1 }, // Haut
    ];

    for (const dir of directions) {
      const checkDistance = bodyRadius * 1.5;
      const checkPoint = {
        x: position.x + dir.x * checkDistance,
        y: position.y + dir.y * checkDistance,
      };

      const hit = this.physics.raycast(
        { x: position.x, y: position.y },
        checkPoint,
        (body) =>
          body !== this.body && body.label === "drawn-trail" && body.isStatic
      );

      if (hit) {
        // SOLUTION ROBUSTE : Repositionner ET bloquer
        const distanceToLine = Math.sqrt(
          Math.pow(hit.point.x - position.x, 2) +
            Math.pow(hit.point.y - position.y, 2)
        );

        // Si on est trop proche de la ligne, repositionner
        if (distanceToLine < bodyRadius * 1.2) {
          const pushDistance = bodyRadius * 1.5 - distanceToLine;
          const pushDirection = {
            x: (position.x - hit.point.x) / distanceToLine,
            y: (position.y - hit.point.y) / distanceToLine,
          };

          // Repositionner le personnage
          Body.setPosition(this.body, {
            x: position.x + pushDirection.x * pushDistance,
            y: position.y + pushDirection.y * pushDistance,
          });
        }

        // BLOQUER le mouvement dans cette direction
        if (dir.x !== 0 && Math.sign(velocity.x) === dir.x) {
          Body.setVelocity(this.body, {
            x: 0, // Arrêter le mouvement horizontal
            y: velocity.y,
          });
        }

        if (dir.y !== 0 && Math.sign(velocity.y) === dir.y) {
          Body.setVelocity(this.body, {
            x: velocity.x,
            y: 0, // Arrêter le mouvement vertical
          });
        }

        // FORCER le changement de direction si bloqué (SEULEMENT sur desktop)
        if (
          !this.isMobile &&
          Math.abs(velocity.x) < 0.1 &&
          Math.abs(velocity.y) < 0.1
        ) {
          this.targetDirection *= -1; // Inverser la direction
        }
      }
    }
  }

  // NOUVELLE FONCTION : Version mobile-optimisée
  preventLineTraversalMobile() {
    const position = this.body.position;
    const velocity = this.body.velocity;
    const size = this.radius * 1.5; // Taille du carré

    // SUR MOBILE : Vérification ULTRA-SIMPLIFIÉE
    // Seulement vérifier si on touche une ligne
    const hit = this.physics.raycast(
      { x: position.x, y: position.y },
      { x: position.x + this.direction * size, y: position.y },
      (body) =>
        body !== this.body && body.label === "drawn-trail" && body.isStatic
    );

    if (hit) {
      // SUR MOBILE : Solution ULTRA-SIMPLE
      // Juste arrêter le mouvement horizontal
      Body.setVelocity(this.body, {
        x: 0, // Arrêt complet
        y: velocity.y, // Garder le mouvement vertical
      });
    }
  }

  // NOUVELLE FONCTION : Forcer le personnage à rester sur la surface
  forceStayOnSurface() {
    const position = this.body.position;
    const bodyRadius = this.body.circleRadius || this.radius * 0.8;

    // Trouver la surface la plus proche en dessous
    const surfaceHit = this.physics.raycast(
      { x: position.x, y: position.y },
      { x: position.x, y: position.y + 30 }, // Chercher plus loin
      (body) =>
        body !== this.body && body.label === "drawn-trail" && body.isStatic
    );

    if (surfaceHit) {
      const surfaceY = surfaceHit.point.y;
      const currentY = position.y;
      const distanceToSurface = surfaceY - currentY;

      // Si on est trop haut au-dessus de la surface, forcer la descente
      if (distanceToSurface > bodyRadius + 2) {
        console.log(`Personnage ${this.id} - Forcer descente vers surface`);

        // Repositionner légèrement vers la surface
        Body.setPosition(this.body, {
          x: position.x,
          y: surfaceY - bodyRadius - 1, // Juste au-dessus de la surface
        });

        // Arrêter le mouvement vertical vers le haut
        const velocity = this.body.velocity;
        if (velocity.y < 0) {
          Body.setVelocity(this.body, {
            x: velocity.x,
            y: 0, // Arrêter le mouvement vers le haut
          });
        }
      }
    }
  }

  // SUPPRIMÉ : forceFollowLine - Fonction d'attraction supprimée

  // SUPPRIMÉ : forceDownhillMovement - Fonction d'attraction supprimée

  // SUPPRIMÉ : forceStrictLineFollowing - Fonction d'attraction supprimée

  // SUPPRIMÉ : forceLineFollowingInDirection - Fonction d'attraction supprimée

  preventTrailPenetrationHighSpeed() {
    const position = this.body.position;
    const velocity = this.body.velocity;
    const bodyRadius = this.body.circleRadius || this.radius * 0.8;

    // À haute vitesse, on utilise un seuil plus bas pour détecter plus tôt
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (speed < 0.3) return; // Seuil plus bas pour détection précoce

    // Distance de vérification PLUS LONGUE à haute vitesse pour anticiper
    const lookAhead = Math.min(speed * 2.0, 15); // Distance plus longue
    const futurePos = {
      x: position.x + (velocity.x / speed) * lookAhead,
      y: position.y + (velocity.y / speed) * lookAhead,
    };

    // Raycast avec distance plus longue
    const hit = this.physics.raycast(
      position,
      futurePos,
      (body) =>
        body !== this.body && body.label === "drawn-trail" && body.isStatic
    );

    if (hit) {
      // RÉACTION PLUS DOUCE à haute vitesse pour éviter les arrêts brutaux
      console.log(
        `Personnage ${this.id} - Collision haute vitesse détectée, ralentissement`
      );

      // RALENTISSEMENT PROGRESSIF au lieu d'arrêt brutal
      Body.setVelocity(this.body, {
        x: velocity.x * 0.3, // Ralentissement progressif
        y: velocity.y * 0.7, // Réduction verticale modérée
      });
    }
  }

  detectMobileDevice() {
    // Détection améliorée des appareils mobiles
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 768; // Écrans petits

    // Log pour debug
    console.log(
      `📱 Détection mobile: ${isMobile} (UserAgent: ${navigator.userAgent.substring(
        0,
        50
      )}...)`
    );

    return isMobile;
  }

  // Amélioration spécifique pour mobile
  preventTrailPenetrationMobile() {
    const position = this.body.position;
    const velocity = this.body.velocity;
    const bodyRadius = this.body.circleRadius || this.radius * 0.8;

    // Sur mobile, on vérifie PLUS SOUVENT et PLUS TÔT
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (speed < 0.2) return; // Seuil encore plus bas sur mobile

    // Distance de vérification PLUS LONGUE sur mobile
    const lookAhead = Math.min(speed * 2.5, 20); // Distance encore plus longue
    const futurePos = {
      x: position.x + (velocity.x / speed) * lookAhead,
      y: position.y + (velocity.y / speed) * lookAhead,
    };

    // Vérification MULTIPLE sur mobile pour plus de précision
    const hit1 = this.physics.raycast(
      position,
      futurePos,
      (body) =>
        body !== this.body && body.label === "drawn-trail" && body.isStatic
    );

    // Vérification supplémentaire légèrement décalée
    const offsetPos = {
      x: position.x + velocity.x * 0.5,
      y: position.y + velocity.y * 0.5,
    };
    const hit2 = this.physics.raycast(
      offsetPos,
      futurePos,
      (body) =>
        body !== this.body && body.label === "drawn-trail" && body.isStatic
    );

    if (hit1 || hit2) {
      console.log(
        `📱 Personnage ${this.id} - Collision mobile détectée, arrêt renforcé`
      );

      // ARRÊT PLUS FORT sur mobile pour compenser les problèmes de précision
      Body.setVelocity(this.body, {
        x: velocity.x * 0.05, // Arrêt presque complet
        y: velocity.y * 0.3, // Réduction verticale importante
      });
    }
  }

  updateTargetDirection() {
    // SUR MOBILE : AUCUN changement automatique de direction
    // Les personnages gardent leur direction initiale
    if (this.isMobile) {
      return;
    }

    // LOGIQUE ULTRA-SIMPLE : changement de direction SEULEMENT en cas de blocage réel

    // Délai obligatoire entre changements
    if (this.directionChangeDelay > 0) {
      this.directionChangeDelay--;
      return;
    }

    // UNIQUE CONDITION : vraiment bloqué par un obstacle plus grand
    if (this.isReallyBlocked()) {
      console.log(
        `🚪 Personnage ${this.id} - CHANGEMENT FORCÉ par obstacle plus grand`
      );
      this.targetDirection = -this.targetDirection;
      this.directionChangeDelay = 180; // 3 secondes - délai très long
      return;
    }

    // Sinon : AUCUN changement automatique
    // Les personnages gardent leur direction jusqu'à vraiment bloquer
  }

  isReallyBlocked() {
    const position = this.body.position;
    const bodyRadius = this.body.circleRadius || this.radius * 0.8;
    const velocity = this.body.velocity;

    // RÈGLES STRICTES : changement de direction UNIQUEMENT pour :
    // 1. Trait PERPENDICULAIRE qui bloque complètement
    // 2. Block plus GRAND EN HAUTEUR que le personnage

    // 1. Doit être immobile depuis un moment
    if (Math.abs(velocity.x) > 0.1 || this.stuckTimer < 60) {
      return false;
    }

    // 2. Tests dans la direction du mouvement
    const testDistance = bodyRadius * 1.5;
    const frontX = position.x + this.direction * testDistance;
    const characterHeight = bodyRadius * 2; // Hauteur du personnage

    // Test mur perpendiculaire à la hauteur du personnage
    const wallAtPlayerLevel = this.physics.raycast(
      { x: position.x, y: position.y },
      { x: frontX, y: position.y },
      (body) =>
        body !== this.body && body.label === "drawn-trail" && body.isStatic
    );

    if (wallAtPlayerLevel) {
      // Mesurer la HAUTEUR de l'obstacle
      const obstacleBottom = this.physics.raycast(
        { x: frontX, y: position.y },
        { x: frontX, y: position.y + characterHeight * 2 },
        (body) =>
          body !== this.body && body.label === "drawn-trail" && body.isStatic
      );

      const obstacleTop = this.physics.raycast(
        { x: frontX, y: position.y },
        { x: frontX, y: position.y - characterHeight * 2 },
        (body) =>
          body !== this.body && body.label === "drawn-trail" && body.isStatic
      );

      // Calculer la hauteur de l'obstacle
      const obstacleHeight =
        obstacleBottom && obstacleTop
          ? Math.abs(obstacleBottom.point.y - obstacleTop.point.y)
          : 0;

      // BLOQUÉ seulement si l'obstacle est PLUS GRAND que le personnage
      if (obstacleHeight > characterHeight * 1.2) {
        console.log(
          `🧱 OBSTACLE PLUS GRAND détecté ! Hauteur: ${obstacleHeight.toFixed(
            1
          )} vs Personnage: ${characterHeight.toFixed(1)}`
        );
        return true;
      } else {
        console.log(
          `↗️ Obstacle franchissable, hauteur: ${obstacleHeight.toFixed(1)}`
        );
        return false;
      }
    }

    return false;
  }

  canJumpOverObstacle(direction) {
    if (!this.autoJump || !this.isGrounded) return false;

    const position = this.body.position;

    // Tester si l'obstacle est franchissable d'un saut
    const jumpHeight = this.radius * 3; // Hauteur de saut estimée
    const jumpTest = this.testRay(
      {
        x: position.x + direction * (this.radius + 5),
        y: position.y - jumpHeight,
      },
      {
        x: position.x + direction * (this.radius + 15),
        y: position.y - jumpHeight,
      }
    );

    return !jumpTest; // Pas d'obstacle en hauteur = saut possible
  }

  testRay(start, end) {
    const hit = this.physics.raycast(
      start,
      end,
      (body) =>
        body !== this.body &&
        body.label !== "character" &&
        body.label !== "goal" &&
        !body.isSensor &&
        body.isStatic // Seulement les objets statiques
    );

    return hit !== null;
  }

  handleMovement(deltaTime) {
    // Récupérer la vitesse de temps actuelle
    const timeScale =
      (this.gameState &&
        this.gameState.gameSettings &&
        this.gameState.gameSettings.timeScale) ||
      1.0;

    // Appliquer la direction cible
    this.direction = this.targetDirection;

    // COMPENSATION DE VITESSE SELON LE TIMESCALE
    const currentVelocity = this.body.velocity;

    // Adapter les forces selon la vitesse du jeu
    const forceMultiplier = Math.max(0.1, 1.0 / Math.sqrt(timeScale)); // Réduction progressive
    const speedMultiplier = Math.max(0.3, 1.0 / timeScale); // Limite la vitesse max

    // SOLUTION ULTRA SIMPLE : Mouvement de base
    const adaptedMaxSpeed = this.maxSpeed;
    if (Math.abs(currentVelocity.x) < adaptedMaxSpeed) {
      const force = this.moveForce * this.direction * 0.8; // Force normale
      Body.applyForce(this.body, this.body.position, { x: force, y: 0 });
    }

    // checkGroundAhead() DÉSACTIVÉ - causait des changements de direction inappropriés

    // Auto-saut TRÈS RESTRICTIF - seulement pour de très petits obstacles
    if (
      this.autoJump &&
      this.isGrounded &&
      timeScale <= 1.0 && // SEULEMENT à vitesse normale
      Math.abs(currentVelocity.x) < 0.1 &&
      this.stuckTimer > 120 && // Délai plus long
      this.shouldJump() // Utiliser la nouvelle logique restrictive
    ) {
      this.jump();
    }

    // Assistance pour grimper SEULEMENT à vitesse modérée
    if (timeScale <= 1.3) {
      this.assistClimbing(deltaTime);
    }
  }

  isMovingUphill() {
    if (!this.isGrounded || this.positionHistory.length < 3) return false;

    const current = this.body.position;
    const previous = this.positionHistory[this.positionHistory.length - 3];

    const deltaX = current.x - previous.x;
    const deltaY = current.y - previous.y;

    // Si on monte (deltaY < 0) et qu'on avance dans la bonne direction
    return deltaY < -1 && Math.sign(deltaX) === this.direction;
  }

  shouldJump() {
    // Conditions TRÈS RESTRICTIVES pour déclencher un saut automatique
    const velocity = this.body.velocity;

    // SEULEMENT si vraiment bloqué par un petit obstacle (pas de saut automatique sur les pentes)
    if (Math.abs(velocity.x) < 0.2 && this.hasSmallObstacleAhead()) {
      // Vérifier que c'est vraiment un petit obstacle, pas une pente
      const slopeType = this.detectSlope();
      if (slopeType === "flat") {
        return true;
      }
    }

    // PAS de saut automatique sur les murs - laisser la gravité faire son travail
    return false;
  }

  hasSmallObstacleAhead() {
    const position = this.body.position;
    const checkDistance = this.radius + 8;

    // Test d'un petit obstacle (hauteur du personnage ou moins)
    const hit = this.testRay(
      {
        x: position.x + this.direction * checkDistance,
        y: position.y + this.radius,
      },
      {
        x: position.x + this.direction * checkDistance,
        y: position.y - this.radius,
      }
    );

    return hit;
  }

  jump() {
    if (!this.isGrounded) return;

    // Adapter la force de saut selon la vitesse du jeu
    const timeScale =
      (this.gameState &&
        this.gameState.gameSettings &&
        this.gameState.gameSettings.timeScale) ||
      1.0;

    // SAUT TRÈS FAIBLE - juste pour franchir de petits obstacles
    const jumpMultiplier = Math.max(0.05, 1.0 / Math.sqrt(timeScale));

    const jumpVector = {
      x: this.jumpForce * 0.1 * this.direction * jumpMultiplier, // Force horizontale très faible
      y: -this.jumpForce * 0.3 * jumpMultiplier, // Force verticale réduite
    };

    Body.applyForce(this.body, this.body.position, jumpVector);
    this.isGrounded = false; // Force l'état non-grounded

    // Son de saut
    if (this.soundManager) {
      console.log(`🔊 Personnage ${this.id} SAUTE - Son joué`);
      this.soundManager.playJump();
    }
  }

  assistClimbing(deltaTime) {
    if (!this.isGrounded || this.isInGoal) return; // DÉSACTIVÉ dans la zone verte

    const position = this.body.position;
    const bodyRadius = this.body.circleRadius || this.radius * 0.8;
    const velocity = this.body.velocity;

    // Récupérer le timeScale pour adapter les forces
    const timeScale =
      (this.gameState &&
        this.gameState.gameSettings &&
        this.gameState.gameSettings.timeScale) ||
      1.0;

    // Assistance subtile pour les pentes
    const assistMultiplier = Math.max(0.3, 1.0 / Math.sqrt(timeScale));

    // ASSISTANCE AMÉLIORÉE POUR LES PENTES - plus généreuse
    if (Math.abs(this.direction) > 0) {
      const direction = this.direction;
      const testDistance = bodyRadius + 15;

      // 1. DÉTECTER LA PENTE DEVANT avec tests multiples
      const slopeTest = this.testRay(
        {
          x: position.x + direction * testDistance,
          y: position.y + bodyRadius,
        },
        {
          x: position.x + direction * testDistance,
          y: position.y - bodyRadius * 2,
        }
      );

      if (slopeTest) {
        // 2. ANALYSER LA DIFFICULTÉ DE LA PENTE

        // Test hauteur 1 (pente modérée)
        const heightTest1 = this.testRay(
          { x: position.x + direction * testDistance, y: position.y },
          {
            x: position.x + direction * testDistance,
            y: position.y - bodyRadius,
          }
        );

        // Test hauteur 2 (pente raide)
        const heightTest2 = this.testRay(
          { x: position.x + direction * testDistance, y: position.y },
          {
            x: position.x + direction * testDistance,
            y: position.y - bodyRadius * 2,
          }
        );

        // Calculer l'intensité selon la difficulté
        let climbIntensity = 1.5; // Base plus élevée

        if (heightTest2) {
          climbIntensity = 3.0; // Pente très raide - assistance maximale
        } else if (heightTest1) {
          climbIntensity = 2.2; // Pente modérée - assistance forte
        }

        // 3. ASSISTANCE CONTINUE ET FORTE
        const baseForceX = 0.006 * climbIntensity * assistMultiplier; // Force doublée
        const baseForceY = -0.008 * climbIntensity * assistMultiplier; // Force doublée

        Body.applyForce(this.body, this.body.position, {
          x: direction * baseForceX,
          y: baseForceY,
        });

        // 4. BOOST SUPPLÉMENTAIRE pour les pentes difficiles
        if (Math.abs(velocity.x) < 0.4 && climbIntensity > 2.0) {
          Body.applyForce(this.body, this.body.position, {
            x: direction * baseForceX * 1.5,
            y: baseForceY * 1.2,
          });

          console.log(
            `Personnage ${
              this.id
            } - Assistance pente raide (intensité: ${climbIntensity.toFixed(
              1
            )})`
          );
        }

        // 5. SAUT D'ASSISTANCE pour les très grosses pentes
        if (Math.abs(velocity.x) < 0.2 && climbIntensity > 2.5) {
          Body.applyForce(this.body, this.body.position, {
            x: direction * 0.005 * assistMultiplier,
            y: -0.012 * assistMultiplier, // Saut plus puissant
          });

          console.log(
            `Personnage ${this.id} - Saut d'assistance pour pente très raide`
          );
        }
      }
    }
  }

  checkStuckState() {
    if (!this.isGrounded) {
      this.stuckTimer = 0;
      return;
    }

    const velocity = this.body.velocity;
    const isStuck = Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1;

    if (isStuck) {
      this.stuckTimer++;

      if (this.stuckTimer > this.stuckThreshold) {
        this.handleStuckState();
      }
    } else {
      this.stuckTimer = Math.max(0, this.stuckTimer - 2); // Réduction progressive
    }
  }

  handleStuckState() {
    // SEULEMENT saut, PAS de changement de direction automatique
    if (this.autoJump && this.isGrounded) {
      console.log(`Personnage ${this.id} - Saut pour se débloquer`);
      this.jump();
      this.stuckTimer = 0; // Reset après saut
    }

    // PAS de changement de direction automatique ici
    // La direction ne change que dans updateTargetDirection() avec des règles strictes
  }

  checkBounds() {
    const position = this.body.position;
    const velocity = this.body.velocity;
    const worldWidth = 1200;
    const worldHeight = 800;

    // FORCER les personnages à rester dans les limites - AUCUNE SORTIE POSSIBLE !

    // Limite GAUCHE - mur invisible absolu
    if (position.x < 10) {
      console.log(`🚧 Personnage ${this.id} - RETOUR FORCÉ du bord gauche`);
      // Repositionner immédiatement
      Body.setPosition(this.body, { x: 15, y: position.y });
      // Forcer direction vers la droite
      Body.setVelocity(this.body, {
        x: Math.abs(velocity.x) || 0.5,
        y: velocity.y,
      });
      this.direction = 1;
      this.targetDirection = 1;
      this.directionChangeDelay = 60;
    }

    // Limite DROITE - mur invisible absolu
    else if (position.x > worldWidth - 10) {
      console.log(`🚧 Personnage ${this.id} - RETOUR FORCÉ du bord droit`);
      // Repositionner immédiatement
      Body.setPosition(this.body, { x: worldWidth - 15, y: position.y });
      // Forcer direction vers la gauche
      Body.setVelocity(this.body, {
        x: -Math.abs(velocity.x) || -0.5,
        y: velocity.y,
      });
      this.direction = -1;
      this.targetDirection = -1;
      this.directionChangeDelay = 60;
    }

    // Limite HAUT - empêcher de sortir par le haut
    if (position.y < 10) {
      console.log(`🚧 Personnage ${this.id} - RETOUR FORCÉ du bord haut`);
      Body.setPosition(this.body, { x: position.x, y: 15 });
      Body.setVelocity(this.body, {
        x: velocity.x,
        y: Math.abs(velocity.y) || 0.2,
      });
    }

    // Limite BAS - téléportation d'urgence si trop bas
    if (position.y > worldHeight + 50) {
      console.log(
        `🚧 Personnage ${this.id} - TÉLÉPORTATION D'URGENCE depuis le vide`
      );
      // Téléporter vers une position sûre au centre-haut
      Body.setPosition(this.body, {
        x: worldWidth / 2 + (Math.random() - 0.5) * 100,
        y: 100,
      });
      Body.setVelocity(this.body, { x: 0, y: 0 });
      this.directionChangeDelay = 60;
    }
  }

  checkGoalZone() {
    const position = this.body.position;
    const goal = this.goal;

    const wasInGoal = this.isInGoal;
    const inGoal =
      position.x >= goal.x &&
      position.x <= goal.x + goal.w &&
      position.y >= goal.y &&
      position.y <= goal.y + goal.h;

    // SUPPRIMÉ : Toute attraction vers la zone verte
    // La zone verte n'a AUCUN effet magnétique
    // C'est au joueur de dessiner des traits bleus pour enfermer les personnages

    // Son quand un personnage entre dans la zone
    if (!wasInGoal && inGoal && this.soundManager) {
      console.log(`🔊 Personnage ${this.id} ARRIVE DANS LA ZONE - Son de succès joué`);
      this.soundManager.playSuccess();
    }

    this.isInGoal = inGoal;
  }

  render(renderer) {
    const position = this.body.position;

    // Corps principal
    renderer.drawCircle(position.x, position.y, this.radius, {
      fill: this.isDead ? "#666" : "#ffd54f",
      stroke: this.isInGoal ? "#4caf50" : null,
      strokeWidth: 2,
    });

    // Animation des jambes
    if (!this.isDead) {
      this.renderLegs(renderer, position);
    }

    // Indicateur de direction (debug)
    if (renderer.debugMode) {
      const arrowEnd = {
        x: position.x + this.direction * 15,
        y: position.y - 10,
      };

      renderer.drawLine(position.x, position.y - 10, arrowEnd.x, arrowEnd.y, {
        color: "#ff5722",
        width: 2,
      });
    }
  }

  renderLegs(renderer, position) {
    const velocity = this.body.velocity;
    const walkSpeed = Math.abs(velocity.x);

    if (walkSpeed < 0.1) return; // Pas d'animation si immobile

    // Animation simple des jambes
    const time = performance.now() * 0.01;
    const legPhase = Math.sin(time * walkSpeed * 2) * 3;
    const legLength = 8;
    const legSpread = 3;

    const leg1End = {
      x: position.x - legSpread + legPhase,
      y: position.y + this.radius + legLength,
    };

    const leg2End = {
      x: position.x + legSpread - legPhase,
      y: position.y + this.radius + legLength,
    };

    renderer.drawLine(
      position.x - legSpread,
      position.y + this.radius - 2,
      leg1End.x,
      leg1End.y,
      { color: "#ffecb3", width: 2 }
    );

    renderer.drawLine(
      position.x + legSpread,
      position.y + this.radius - 2,
      leg2End.x,
      leg2End.y,
      { color: "#ffecb3", width: 2 }
    );
  }

  generateId() {
    return `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters pour l'état
  getPosition() {
    return { ...this.body.position };
  }

  getVelocity() {
    return { ...this.body.velocity };
  }

  isAlive() {
    return !this.isDead;
  }

  isInGoalZone() {
    return this.isInGoal;
  }

  // Destruction propre
  freeze() {
    this.isFrozen = true;
    // Arrêter tout mouvement et physique
    Body.setVelocity(this.body, { x: 0, y: 0 });
    Body.setAngularVelocity(this.body, 0);
    // Figer complètement en rendant statique temporairement
    Body.setStatic(this.body, true);
    console.log(`❄️ Personnage ${this.id} GELÉ ET STATIQUE`);
  }

  unfreeze() {
    this.isFrozen = false;
    // Rendre dynamique à nouveau
    Body.setStatic(this.body, false);
    console.log(
      `🔥 Personnage ${this.id} DÉGELÉ ET DYNAMIQUE - peut bouger maintenant`
    );
  }

  destroy() {
    if (this.body) {
      const { World } = window.Matter;
      World.remove(this.physics.world, this.body);
      this.body = null;
    }
  }
}
