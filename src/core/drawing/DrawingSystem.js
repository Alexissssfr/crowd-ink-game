/**
 * Système de dessin optimisé avec lissage et gestion intelligente des traits
 */
export class DrawingSystem {
  constructor(physics, gameState) {
    this.physics = physics;
    this.gameState = gameState;

    // État du dessin
    this.isDrawing = false;
    this.currentStroke = [];
    this.drawnTrails = new Map(); // ID -> trail data

    // Configuration
    this.config = {
      minPointDistance: 3, // Distance minimale entre points
      maxPointDistance: 20, // Distance max pour connecter points
      smoothingFactor: 0.3, // Facteur de lissage
      trailThickness: 8, // Épaisseur des traits
      eraseRadius: 16, // Rayon de suppression
      inkCostPerPixel: 1, // Coût d'encre par pixel
      fusionDistance: 12, // Distance pour fusionner des traits proches
    };

    // Cache pour optimisations
    this.spatialGrid = new Map();
    this.gridSize = 50;
  }

  /**
   * Démarre un nouveau trait
   */
  startStroke(point) {
    if (!this.canDraw()) return false;

    this.isDrawing = true;
    this.currentStroke = [{ ...point, timestamp: performance.now() }];
    return true;
  }

  /**
   * Continue le trait en cours
   */
  continueStroke(point) {
    if (!this.isDrawing || !this.canDraw()) return false;

    const lastPoint = this.currentStroke[this.currentStroke.length - 1];
    const distance = this.calculateDistance(lastPoint, point);

    // Vérifier la distance minimale
    if (distance < this.config.minPointDistance) return false;

    // Vérifier si on peut se permettre ce trait
    const inkCost = distance * this.config.inkCostPerPixel;
    if (!this.gameState.canSpendInk(inkCost)) {
      this.finishStroke();
      return false;
    }

    // Ajouter le point avec lissage
    const smoothedPoint = this.applySmoothingIfNeeded(point);
    this.currentStroke.push({ ...smoothedPoint, timestamp: performance.now() });

    // Consommer l'encre
    this.gameState.spendInk(inkCost);

    return true;
  }

  /**
   * Termine le trait en cours
   */
  finishStroke() {
    if (!this.isDrawing || this.currentStroke.length < 2) {
      this.isDrawing = false;
      this.currentStroke = [];
      return null;
    }

    this.isDrawing = false;

    // GARDER LA FORME EXACTE - pas d'optimisation
    if (this.currentStroke.length < 2) {
      this.currentStroke = [];
      return null;
    }

    // Créer un nouveau trait physique directement
    const trail = this.physics.createTrailFromPoints(this.currentStroke, {
      thickness: this.config.trailThickness,
      friction: 0.6,
      frictionStatic: 0.8,
    });

    if (trail) {
      this.drawnTrails.set(trail.id, {
        id: trail.id,
        bodies: trail.bodies,
        points: this.currentStroke.slice(),
        createdAt: performance.now(),
      });

      this.updateSpatialGrid(trail.id, this.currentStroke);
    }

    this.currentStroke = [];
    return trail;
  }

  /**
   * Supprime des traits dans une zone
   */
  eraseAt(point) {
    const removedIds = this.physics.removeTrailsInArea(
      point,
      this.config.eraseRadius
    );

    for (const id of removedIds) {
      this.drawnTrails.delete(id);
      this.removeFromSpatialGrid(id);
    }

    return removedIds.length > 0;
  }

  /**
   * Applique un lissage adaptatif
   */
  applySmoothingIfNeeded(newPoint) {
    if (this.currentStroke.length < 3) return newPoint;

    const len = this.currentStroke.length;
    const p1 = this.currentStroke[len - 2];
    const p2 = this.currentStroke[len - 1];

    // Calculer la courbure
    const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const angle2 = Math.atan2(newPoint.y - p2.y, newPoint.x - p2.x);
    const curvature = Math.abs(angle2 - angle1);

    if (curvature > Math.PI / 6) {
      // Forte courbure, lisser
      const factor = this.config.smoothingFactor;
      return {
        x: p2.x * (1 - factor) + newPoint.x * factor,
        y: p2.y * (1 - factor) + newPoint.y * factor,
      };
    }

    return newPoint;
  }

  /**
   * Optimise un trait (suppression de points redondants, lissage)
   */
  optimizeStroke(stroke) {
    if (stroke.length <= 2) return stroke;

    // Première passe : suppression des points trop proches
    const filtered = this.removeRedundantPoints(stroke);

    // Deuxième passe : simplification Douglas-Peucker
    const simplified = this.simplifyPath(filtered, 2);

    // Troisième passe : lissage final
    return this.applySmoothingPass(simplified);
  }

  removeRedundantPoints(points) {
    const result = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const distance = this.calculateDistance(
        result[result.length - 1],
        points[i]
      );
      if (distance >= this.config.minPointDistance) {
        result.push(points[i]);
      }
    }

    return result;
  }

  simplifyPath(points, tolerance) {
    if (points.length <= 2) return points;

    // Douglas-Peucker simplifié
    const simplified = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.pointToLineDistance(
        points[i],
        points[i - 1],
        points[i + 1]
      );

      if (distance > tolerance) {
        simplified.push(points[i]);
      }
    }

    simplified.push(points[points.length - 1]);
    return simplified;
  }

  applySmoothingPass(points) {
    if (points.length <= 2) return points;

    const smoothed = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      // Moyenne pondérée
      smoothed.push({
        x: (prev.x + curr.x * 2 + next.x) / 4,
        y: (prev.y + curr.y * 2 + next.y) / 4,
      });
    }

    smoothed.push(points[points.length - 1]);
    return smoothed;
  }

  /**
   * Trouve les traits candidats pour fusion
   */
  findFusionCandidates(stroke) {
    const candidates = [];
    const startPoint = stroke[0];
    const endPoint = stroke[stroke.length - 1];

    // Chercher dans la grille spatiale
    const nearbyTrails = this.getNearbyTrails(
      startPoint,
      this.config.fusionDistance
    );
    nearbyTrails.push(
      ...this.getNearbyTrails(endPoint, this.config.fusionDistance)
    );

    for (const trailId of new Set(nearbyTrails)) {
      const trail = this.drawnTrails.get(trailId);
      if (trail && this.canFuseTrails(stroke, trail.points)) {
        candidates.push(trail);
      }
    }

    return candidates;
  }

  canFuseTrails(stroke1, stroke2) {
    const tolerance = this.config.fusionDistance;

    // Vérifier si les extrémités sont proches
    const s1Start = stroke1[0];
    const s1End = stroke1[stroke1.length - 1];
    const s2Start = stroke2[0];
    const s2End = stroke2[stroke2.length - 1];

    return (
      this.calculateDistance(s1Start, s2Start) <= tolerance ||
      this.calculateDistance(s1Start, s2End) <= tolerance ||
      this.calculateDistance(s1End, s2Start) <= tolerance ||
      this.calculateDistance(s1End, s2End) <= tolerance
    );
  }

  /**
   * Fusionne le nouveau trait avec des traits existants
   */
  fuseWithExistingTrails(newStroke, candidates) {
    // Simplification : remplacer le premier candidat par le trait fusionné
    const mainCandidate = candidates[0];

    // Supprimer l'ancien trait
    this.physics.removeTrail(mainCandidate.id);
    this.drawnTrails.delete(mainCandidate.id);
    this.removeFromSpatialGrid(mainCandidate.id);

    // Créer le trait fusionné
    const fusedPoints = this.mergeStrokes(newStroke, mainCandidate.points);
    const newTrail = this.physics.createTrailFromPoints(fusedPoints, {
      thickness: this.config.trailThickness,
      friction: 0.6,
      frictionStatic: 0.8,
    });

    if (newTrail) {
      this.drawnTrails.set(newTrail.id, {
        id: newTrail.id,
        body: newTrail.body,
        points: fusedPoints.slice(),
        createdAt: performance.now(),
      });

      this.updateSpatialGrid(newTrail.id, fusedPoints);
    }

    return newTrail;
  }

  mergeStrokes(stroke1, stroke2) {
    // Algorithme simple de fusion - peut être amélioré
    const tolerance = this.config.fusionDistance;

    // Trouver le meilleur point de connexion
    const s1Start = stroke1[0];
    const s1End = stroke1[stroke1.length - 1];
    const s2Start = stroke2[0];
    const s2End = stroke2[stroke2.length - 1];

    let merged = [];

    if (this.calculateDistance(s1End, s2Start) <= tolerance) {
      merged = [...stroke1, ...stroke2.slice(1)];
    } else if (this.calculateDistance(s1End, s2End) <= tolerance) {
      merged = [...stroke1, ...stroke2.slice(0, -1).reverse()];
    } else if (this.calculateDistance(s1Start, s2End) <= tolerance) {
      merged = [...stroke2, ...stroke1.slice(1)];
    } else if (this.calculateDistance(s1Start, s2Start) <= tolerance) {
      merged = [...stroke2.slice(0, -1).reverse(), ...stroke1];
    } else {
      // Pas de fusion possible, retourner le nouveau trait
      merged = stroke1;
    }

    return this.optimizeStroke(merged);
  }

  /**
   * Gestion de la grille spatiale pour optimiser les recherches
   */
  updateSpatialGrid(trailId, points) {
    for (const point of points) {
      const gridKey = this.getGridKey(point);
      if (!this.spatialGrid.has(gridKey)) {
        this.spatialGrid.set(gridKey, new Set());
      }
      this.spatialGrid.get(gridKey).add(trailId);
    }
  }

  removeFromSpatialGrid(trailId) {
    for (const [gridKey, trailSet] of this.spatialGrid) {
      trailSet.delete(trailId);
      if (trailSet.size === 0) {
        this.spatialGrid.delete(gridKey);
      }
    }
  }

  getNearbyTrails(point, radius) {
    const nearby = new Set();
    const gridRadius = Math.ceil(radius / this.gridSize);
    const centerKey = this.getGridKey(point);
    const [centerX, centerY] = centerKey.split(",").map(Number);

    for (let dx = -gridRadius; dx <= gridRadius; dx++) {
      for (let dy = -gridRadius; dy <= gridRadius; dy++) {
        const key = `${centerX + dx},${centerY + dy}`;
        const trails = this.spatialGrid.get(key);
        if (trails) {
          trails.forEach((trailId) => nearby.add(trailId));
        }
      }
    }

    return Array.from(nearby);
  }

  getGridKey(point) {
    const x = Math.floor(point.x / this.gridSize);
    const y = Math.floor(point.y / this.gridSize);
    return `${x},${y}`;
  }

  /**
   * Utilitaires
   */
  calculateDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  pointToLineDistance(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return this.calculateDistance(point, lineStart);

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

    return this.calculateDistance(point, { x: projX, y: projY });
  }

  canDraw() {
    // Permettre le dessin dès que le niveau est chargé, même avant de cliquer "Démarrer"
    return this.gameState.inkRemaining > 0;
  }

  /**
   * Rendu du système de dessin
   */
  render(renderer) {
    // Rendu des traits terminés
    for (const trail of this.drawnTrails.values()) {
      renderer.renderTrail(trail.points, {
        color: "#42a5f5",
        thickness: this.config.trailThickness,
        alpha: 1.0,
      });
    }

    // Rendu du trait en cours
    if (this.isDrawing && this.currentStroke.length >= 2) {
      renderer.renderTrail(this.currentStroke, {
        color: "#81d4fa",
        thickness: this.config.trailThickness,
        alpha: 0.8,
        dashed: true,
      });
    }
  }

  /**
   * Mise à jour (pour animations futures)
   */
  update(deltaTime) {
    // Réservé pour animations ou effets temporels
  }

  /**
   * Réinitialisation
   */
  reset() {
    this.isDrawing = false;
    this.currentStroke = [];
    this.drawnTrails.clear();
    this.spatialGrid.clear();
  }

  /**
   * Getters pour les statistiques
   */
  getTrailCount() {
    return this.drawnTrails.size;
  }

  getTotalTrailLength() {
    let total = 0;
    for (const trail of this.drawnTrails.values()) {
      total += this.calculateTrailLength(trail.points);
    }
    return total;
  }

  calculateTrailLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += this.calculateDistance(points[i - 1], points[i]);
    }
    return length;
  }
}
