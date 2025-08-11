const {
  Engine,
  Render,
  World,
  Bodies,
  Body,
  Events,
  Composite,
  Constraint,
  Vector,
} = window.Matter;

/**
 * Moteur physique optimisé avec gestion améliorée des traits
 */
export class PhysicsEngine {
  constructor() {
    this.engine = Engine.create({
      gravity: { x: 0, y: 0.8 }, // Gravité légèrement réduite
      timing: { timeScale: 1 },
    });

    this.world = this.engine.world;
    this.drawnBodies = new Map(); // ID -> Body pour la gestion des traits
    this.staticBodies = [];

    // Configuration optimisée
    this.setupEngine();
  }

  setupEngine() {
    // Configuration ULTRA PRÉCISE pour éviter les traversées
    this.engine.positionIterations = 20; // Précision maximale
    this.engine.velocityIterations = 15; // Plus d'itérations pour la stabilité
    this.engine.constraintIterations = 8; // Stabilité renforcée

    // Vitesse normale pour gameplay fluide
    this.engine.timing.timeScale = 1.0;

    // Événements globaux
    Events.on(this.engine, "collisionStart", (event) => {
      this.handleCollisionStart(event);
    });

    Events.on(this.engine, "beforeUpdate", () => {
      this.preventBodySleeping();
      this.limitExcessiveVelocities();
    });

    // Événement après mise à jour pour corrections post-physique
    Events.on(this.engine, "afterUpdate", () => {
      this.correctAllCharacterPositions();
    });
  }

  handleCollisionStart(event) {
    // Gestion des collisions spéciales (goal zone, etc.)
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;

      // Collision character + goal
      if (this.isCharacterGoalCollision(bodyA, bodyB)) {
        // Événement émis pour le GameState
        this.emit("characterReachedGoal", {
          character: this.getCharacterBody(bodyA, bodyB),
          goal: this.getGoalBody(bodyA, bodyB),
        });
      }
    }
  }

  isCharacterGoalCollision(bodyA, bodyB) {
    return (
      (bodyA.label === "character" && bodyB.label === "goal") ||
      (bodyA.label === "goal" && bodyB.label === "character")
    );
  }

  getCharacterBody(bodyA, bodyB) {
    return bodyA.label === "character" ? bodyA : bodyB;
  }

  getGoalBody(bodyA, bodyB) {
    return bodyA.label === "goal" ? bodyA : bodyB;
  }

  /**
   * Crée un trait physique optimisé à partir de points
   */
  createTrailFromPoints(points, options = {}) {
    if (points.length < 2) return null;

    // Détection mobile pour ajuster les paramètres
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;

    const {
      thickness = isMobile ? 35 : 30, // Plus épais sur mobile
      friction = isMobile ? 1.5 : 1.0, // Plus de friction sur mobile
      frictionStatic = isMobile ? 3.0 : 2.0, // Anti-glissement renforcé sur mobile
      restitution = 0.0, // Zéro rebond
      density = isMobile ? 3000.0 : 2000.0, // Plus dense sur mobile
    } = options;

    // GARDER LA FORME EXACTE - pas de simplification
    if (points.length < 2) return null;

    // Création de segments AVEC CHEVAUCHEMENT pour éviter les gaps
    const trailBodies = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      if (length < 1) continue;

      const centerX = (p1.x + p2.x) / 2;
      const centerY = (p1.y + p2.y) / 2;

      // SEGMENTS AVEC CHEVAUCHEMENT POUR SOLIDITÉ ABSOLUE
      const overlapFactor = isMobile ? 0.5 : 0.3; // Plus de chevauchement sur mobile
      const extendedLength = length + thickness * overlapFactor;

      const segment = Bodies.rectangle(
        centerX,
        centerY,
        extendedLength,
        thickness,
        {
          isStatic: true,
          friction,
          frictionStatic,
          restitution,
          density: density * 2, // ENCORE PLUS DENSE
          angle,
          label: "drawn-trail",
          render: {
            fillStyle: "#42a5f5",
            strokeStyle: "#1976d2",
            lineWidth: 1,
          },
        }
      );

      World.add(this.world, segment);
      trailBodies.push(segment);
    }

    // AJOUTER DES SEGMENTS DE RENFORCEMENT AUX JONCTIONS
    for (let i = 1; i < points.length - 1; i++) {
      const point = points[i];

      // Cercle de renforcement PLUS GROS à chaque jonction
      const reinforcementSize = isMobile ? thickness * 0.9 : thickness * 0.7;
      const reinforcement = Bodies.circle(point.x, point.y, reinforcementSize, {
        isStatic: true,
        friction: isMobile ? 2.0 : friction,
        frictionStatic: isMobile ? 4.0 : frictionStatic,
        restitution,
        density: isMobile ? density * 5 : density * 3, // ENCORE PLUS DENSE sur mobile
        label: "drawn-trail",
        render: {
          fillStyle: "#42a5f5",
          strokeStyle: "#1976d2",
          lineWidth: 1,
        },
      });

      World.add(this.world, reinforcement);
      trailBodies.push(reinforcement);
    }

    // AJOUTER DES RENFORCEMENTS AUX COINS (intersections de traits)
    if (points.length > 2) {
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        
        // Vérifier s'il y a d'autres traits à proximité (intersections)
        for (let j = i + 2; j < points.length - 1; j++) {
          const p3 = points[j];
          const p4 = points[j + 1];
          
          // Distance entre les segments
          const distance = this.distanceBetweenSegments(p1, p2, p3, p4);
          
          if (distance < thickness * 2) {
            // Ajouter un renforcement à l'intersection
            const intersectionPoint = this.findIntersection(p1, p2, p3, p4);
            if (intersectionPoint) {
              const cornerReinforcement = Bodies.circle(
                intersectionPoint.x, 
                intersectionPoint.y, 
                thickness * 1.2, // Très gros renforcement aux intersections
                {
                  isStatic: true,
                  friction: isMobile ? 3.0 : 2.0,
                  frictionStatic: isMobile ? 5.0 : 3.0,
                  restitution: 0,
                  density: isMobile ? density * 8 : density * 5, // ULTRA DENSE
                  label: "drawn-trail",
                  render: {
                    fillStyle: "#1976d2", // Couleur différente pour les intersections
                    strokeStyle: "#0d47a1",
                    lineWidth: 2,
                  },
                }
              );
              
              World.add(this.world, cornerReinforcement);
              trailBodies.push(cornerReinforcement);
            }
          }
        }
      }
    }

    if (trailBodies.length === 0) return null;

    const trailId = this.generateTrailId();
    this.drawnBodies.set(trailId, {
      bodies: trailBodies, // Array de bodies au lieu d'un seul
      segments: trailBodies,
      originalPoints: points.slice(),
    });

    return { id: trailId, bodies: trailBodies };
  }

  /**
   * Calcule la distance entre deux segments de ligne
   */
  distanceBetweenSegments(p1, p2, p3, p4) {
    // Distance minimale entre deux segments
    const d1 = this.pointToLineDistance(p1, p3, p4);
    const d2 = this.pointToLineDistance(p2, p3, p4);
    const d3 = this.pointToLineDistance(p3, p1, p2);
    const d4 = this.pointToLineDistance(p4, p1, p2);
    
    return Math.min(d1, d2, d3, d4);
  }

  /**
   * Trouve le point d'intersection entre deux segments
   */
  findIntersection(p1, p2, p3, p4) {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;
    
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.001) return null; // Segments parallèles
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }
    
    return null;
  }

  /**
   * Simplifie un chemin pour réduire le nombre de points
   */
  simplifyPath(points, tolerance = 2) {
    if (points.length <= 2) return points;

    // Algorithme de Douglas-Peucker simplifié
    const simplified = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      const dist = this.pointToLineDistance(curr, prev, next);
      if (dist > tolerance) {
        simplified.push(curr);
      }
    }

    simplified.push(points[points.length - 1]);
    return simplified;
  }

  pointToLineDistance(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0)
      return Math.sqrt(
        (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
      );

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
          (length * length)
      )
    );
    const projX = lineStart.x + t * dx;
    const projY = lineStart.y + t * dy;

    return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
  }

  /**
   * Supprime un trait par son ID
   */
  removeTrail(trailId) {
    const trail = this.drawnBodies.get(trailId);
    if (!trail) return false;

    // Supprimer tous les bodies du trail
    if (trail.bodies) {
      // Nouveau format avec array de bodies
      for (const body of trail.bodies) {
        World.remove(this.world, body);
      }
    } else if (trail.body) {
      // Ancien format avec un seul body
      World.remove(this.world, trail.body);
    }

    this.drawnBodies.delete(trailId);
    return true;
  }

  /**
   * Trouve et supprime les traits dans une zone
   */
  removeTrailsInArea(center, radius) {
    const removedIds = [];

    for (const [id, trail] of this.drawnBodies) {
      if (this.isTrailInArea(trail, center, radius)) {
        this.removeTrail(id);
        removedIds.push(id);
      }
    }

    return removedIds;
  }

  isTrailInArea(trail, center, radius) {
    // Vérifier tous les segments du trail
    const bodies = trail.bodies || [trail.body];

    for (const body of bodies) {
      if (!body || !body.bounds) continue;

      const bounds = body.bounds;
      const bodyCenter = {
        x: (bounds.min.x + bounds.max.x) / 2,
        y: (bounds.min.y + bounds.max.y) / 2,
      };

      const distance = Math.sqrt(
        (bodyCenter.x - center.x) ** 2 + (bodyCenter.y - center.y) ** 2
      );

      if (distance <= radius) {
        return true;
      }
    }

    return false;
  }

  /**
   * Crée les limites du monde - MURS ABSOLUMENT INFRANCHISSABLES
   */
  createWorldBounds(width, height) {
    const thickness = 100; // DOUBLÉ pour plus de solidité

    const bounds = [
      // Sol renforcé
      Bodies.rectangle(
        width / 2,
        height + thickness / 2,
        width + thickness * 2,
        thickness,
        {
          isStatic: true,
          label: "world-bound",
          render: { visible: false },
          // Propriétés ULTRA-SOLIDES
          density: 10000,
          friction: 1.0,
          frictionStatic: 2.0,
          restitution: 0,
        }
      ),
      // Mur GAUCHE - INFRANCHISSABLE
      Bodies.rectangle(-thickness / 2, height / 2, thickness, height * 3, {
        isStatic: true,
        label: "world-bound",
        render: { visible: false },
        density: 10000,
        friction: 1.0,
        frictionStatic: 2.0,
        restitution: 0,
      }),
      // Mur DROIT - INFRANCHISSABLE
      Bodies.rectangle(
        width + thickness / 2,
        height / 2,
        thickness,
        height * 3,
        {
          isStatic: true,
          label: "world-bound",
          render: { visible: false },
          density: 10000,
          friction: 1.0,
          frictionStatic: 2.0,
          restitution: 0,
        }
      ),
      // PLAFOND invisible pour empêcher les sorties par le haut
      Bodies.rectangle(
        width / 2,
        -thickness / 2,
        width + thickness * 2,
        thickness,
        {
          isStatic: true,
          label: "world-bound",
          render: { visible: false },
          density: 10000,
          friction: 1.0,
          frictionStatic: 2.0,
          restitution: 0,
        }
      ),
    ];

    World.add(this.world, bounds);
    this.staticBodies.push(...bounds);
    console.log("🏰 MURS INFRANCHISSABLES créés avec succès !");
  }

  /**
   * Ajoute un body statique (obstacles, plateformes)
   */
  addStaticBody(body) {
    World.add(this.world, body);
    this.staticBodies.push(body);
    return body;
  }

  /**
   * Ajoute un body dynamique (personnages)
   */
  addDynamicBody(body) {
    World.add(this.world, body);
    return body;
  }

  /**
   * Crée une zone objectif
   */
  createGoalZone(x, y, width, height) {
    const goalBody = Bodies.rectangle(
      x + width / 2,
      y + height / 2,
      width,
      height,
      {
        isStatic: true,
        isSensor: true,
        label: "goal",
        render: {
          fillStyle: "rgba(76, 175, 80, 0.3)",
          strokeStyle: "#4caf50",
          lineWidth: 2,
        },
      }
    );

    World.add(this.world, goalBody);
    return goalBody;
  }

  /**
   * Test de collision point-corps
   */
  queryPoint(point) {
    const bodies = Composite.allBodies(this.world);
    const hits = [];

    for (const body of bodies) {
      if (this.pointInBody(point, body)) {
        hits.push(body);
      }
    }

    return hits;
  }

  queryBodies(topLeft, bottomRight) {
    const bodies = Composite.allBodies(this.world);
    const hits = [];

    for (const body of bodies) {
      const pos = body.position;
      if (
        pos.x >= topLeft.x &&
        pos.x <= bottomRight.x &&
        pos.y >= topLeft.y &&
        pos.y <= bottomRight.y
      ) {
        hits.push(body);
      }
    }

    return hits;
  }

  pointInBody(point, body) {
    const bounds = body.bounds;
    return (
      point.x >= bounds.min.x &&
      point.x <= bounds.max.x &&
      point.y >= bounds.min.y &&
      point.y <= bounds.max.y
    );
  }

  /**
   * Raycast pour détection avancée
   */
  raycast(start, end, filter = null) {
    const bodies = Composite.allBodies(this.world);
    const filteredBodies = filter ? bodies.filter(filter) : bodies;

    // Implémentation simplifiée du raycast
    for (const body of filteredBodies) {
      if (this.rayIntersectsBody(start, end, body)) {
        return {
          body,
          point: this.calculateIntersectionPoint(start, end, body),
        };
      }
    }

    return null;
  }

  rayIntersectsBody(start, end, body) {
    // Test AABB simple
    const bounds = body.bounds;
    return this.lineIntersectsAABB(start, end, bounds);
  }

  lineIntersectsAABB(start, end, bounds) {
    // Algorithme de Cohen-Sutherland simplifié
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    let t0 = 0,
      t1 = 1;

    for (const side of ["left", "right", "bottom", "top"]) {
      let p, q;

      switch (side) {
        case "left":
          p = -dx;
          q = start.x - bounds.min.x;
          break;
        case "right":
          p = dx;
          q = bounds.max.x - start.x;
          break;
        case "bottom":
          p = -dy;
          q = start.y - bounds.min.y;
          break;
        case "top":
          p = dy;
          q = bounds.max.y - start.y;
          break;
      }

      if (p === 0) {
        if (q < 0) return false;
      } else {
        const r = q / p;
        if (p < 0) {
          if (r > t1) return false;
          if (r > t0) t0 = r;
        } else {
          if (r < t0) return false;
          if (r < t1) t1 = r;
        }
      }
    }

    return t0 <= t1;
  }

  calculateIntersectionPoint(start, end, body) {
    // Point d'intersection approximatif au centre du body
    const bounds = body.bounds;
    return {
      x: (bounds.min.x + bounds.max.x) / 2,
      y: (bounds.min.y + bounds.max.y) / 2,
    };
  }

  /**
   * Calcule la distance entre un point et un body
   */
  pointToBodyDistance(point, body) {
    const bounds = body.bounds;
    
    // Distance au rectangle englobant
    const closestX = Math.max(bounds.min.x, Math.min(point.x, bounds.max.x));
    const closestY = Math.max(bounds.min.y, Math.min(point.y, bounds.max.y));
    
    const distanceX = point.x - closestX;
    const distanceY = point.y - closestY;
    
    return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
  }

  preventBodySleeping() {
    // Forcer les personnages à rester "éveillés" pour des collisions précises
    const allBodies = Composite.allBodies(this.world);
    for (const body of allBodies) {
      if (body.label === "character") {
        body.isSleeping = false;
        body.sleepThreshold = Infinity; // Ne jamais dormir
      }
    }
  }

  limitExcessiveVelocities() {
    // Limiter les vitesses excessives de manière adaptive
    const allBodies = Composite.allBodies(this.world);

    // Récupérer le timeScale du moteur pour adapter les limites
    const timeScale = this.engine.timing.timeScale || 1.0;

    // Vitesse max adaptive : plus stricte à haute vitesse
    const baseMaxVelocity = 8;
    const maxVelocity =
      timeScale > 1.5
        ? baseMaxVelocity * 0.4
        : timeScale > 1.2
        ? baseMaxVelocity * 0.6
        : baseMaxVelocity;

    for (const body of allBodies) {
      if (body.label === "character") {
        const velocity = body.velocity;
        const speed = Math.sqrt(
          velocity.x * velocity.x + velocity.y * velocity.y
        );

        if (speed > maxVelocity) {
          // Normaliser et limiter la vitesse
          const normalizedVel = {
            x: (velocity.x / speed) * maxVelocity,
            y: (velocity.y / speed) * maxVelocity,
          };
          Body.setVelocity(body, normalizedVel);
        }

        // Amortissement supplémentaire à très haute vitesse
        if (timeScale > 2.0) {
          const dampingFactor = 0.85;
          Body.setVelocity(body, {
            x: velocity.x * dampingFactor,
            y: velocity.y * dampingFactor,
          });
        }
      }
    }
  }

  /**
   * Correction globale de tous les personnages après la physique
   */
  correctAllCharacterPositions() {
    const allBodies = Composite.allBodies(this.world);
    const characterBodies = allBodies.filter(body => body.label === "character");
    const trailBodies = allBodies.filter(body => body.label === "drawn-trail" && body.isStatic);

    for (const character of characterBodies) {
      const characterRadius = character.circleRadius || 6;
      let needsCorrection = false;
      let correctionVector = { x: 0, y: 0 };

      // Vérifier les collisions avec tous les traits
      for (const trail of trailBodies) {
        const distance = this.pointToBodyDistance(character.position, trail);
        
        if (distance < characterRadius * 0.8) { // Seuil plus strict
          needsCorrection = true;
          
          // Calculer la direction de sortie
          const bounds = trail.bounds;
          const centerX = (bounds.min.x + bounds.max.x) / 2;
          const centerY = (bounds.min.y + bounds.max.y) / 2;
          
          const dx = character.position.x - centerX;
          const dy = character.position.y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 0) {
            correctionVector.x += (dx / dist) * (characterRadius + 1); // Distance réduite
            correctionVector.y += (dy / dist) * (characterRadius + 1);
          } else {
            // Si exactement au centre, pousser vers le haut
            correctionVector.y -= characterRadius + 1;
          }
        }
      }

      if (needsCorrection) {
        // Appliquer la correction SEULEMENT si vraiment nécessaire
        const magnitude = Math.sqrt(
          correctionVector.x * correctionVector.x + 
          correctionVector.y * correctionVector.y
        );
        
        if (magnitude > characterRadius * 0.5) { // Seulement si correction significative
          // Appliquer la correction
          Body.setPosition(character, {
            x: character.position.x + correctionVector.x,
            y: character.position.y + correctionVector.y,
          });

          // RALENTIR au lieu d'arrêter complètement
          if (Math.abs(correctionVector.x) > 0) {
            Body.setVelocity(character, {
              x: character.velocity.x * 0.5, // Ralentir au lieu d'arrêter
              y: character.velocity.y,
            });
          }
          if (Math.abs(correctionVector.y) > 0) {
            Body.setVelocity(character, {
              x: character.velocity.x,
              y: character.velocity.y * 0.5, // Ralentir au lieu d'arrêter
            });
          }
        }
      }
    }
  }

  /**
   * Mise à jour du moteur physique
   */
  update(deltaTime) {
    Engine.update(this.engine, deltaTime * 1000);
  }

  /**
   * Réinitialise le monde physique
   */
  reset() {
    World.clear(this.world, false);
    this.drawnBodies.clear();
    this.staticBodies.length = 0;
  }

  /**
   * Getters pour l'accès aux données
   */
  getBodies() {
    return Composite.allBodies(this.world);
  }

  getDrawnBodies() {
    return Array.from(this.drawnBodies.values()).map((trail) => trail.body);
  }

  getStaticBodies() {
    return this.staticBodies;
  }

  generateTrailId() {
    return `trail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Système d'événements simple
  emit(eventName, data) {
    if (this.eventListeners && this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach((callback) => callback(data));
    }
  }

  on(eventName, callback) {
    if (!this.eventListeners) this.eventListeners = {};
    if (!this.eventListeners[eventName]) this.eventListeners[eventName] = [];
    this.eventListeners[eventName].push(callback);
  }
}
