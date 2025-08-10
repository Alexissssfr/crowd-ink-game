/**
 * Moteur de rendu 2D optimisé pour le jeu
 */
export class Renderer {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
    this.debugMode = false;
    
    // Configuration du contexte
    this.setupContext();
    
    // Cache pour optimisations
    this.imageCache = new Map();
    this.gradientCache = new Map();
  }

  setupContext() {
    // Configuration pour un rendu net
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
  }

  // Nettoyage de l'écran
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Rendu du fond
  renderBackground() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    
    // Dégradé de fond
    const gradient = this.getOrCreateGradient('background', () => {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#1a1f2e');
      grad.addColorStop(1, '#0f1419');
      return grad;
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Grille optionnelle
    if (this.debugMode) {
      this.renderGrid();
    }
  }

  renderGrid() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const gridSize = 40;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Lignes verticales
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
    }
    
    // Lignes horizontales
    for (let y = 0; y <= height; y += gridSize) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
    }
    
    ctx.stroke();
  }

  // Rendu de la zone objectif
  renderGoalZone(goal) {
    if (!goal) return;
    
    const ctx = this.ctx;
    const { x, y, w, h } = goal;
    
    // Fond de la zone
    ctx.fillStyle = 'rgba(76, 175, 80, 0.15)';
    ctx.fillRect(x, y, w, h);
    
    // Bordure animée
    const time = performance.now() * 0.002;
    const alpha = 0.5 + Math.sin(time) * 0.3;
    
    ctx.strokeStyle = `rgba(76, 175, 80, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = time * 20;
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    
    // Icône ou texte "OBJECTIF"
    ctx.fillStyle = `rgba(76, 175, 80, ${alpha})`;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('OBJECTIF', x + w / 2, y + h / 2 - 7);
    ctx.textAlign = 'left';
  }

  // Rendu des corps statiques (obstacles, plateformes)
  renderStaticBodies(bodies) {
    for (const body of bodies) {
      if (body.label === 'character' || body.label === 'goal') continue;
      
      this.renderBody(body);
    }
  }

  renderBody(body) {
    const ctx = this.ctx;
    const vertices = body.vertices;
    
    if (!vertices || vertices.length === 0) return;
    
    // Couleur basée sur le type de corps
    const fillStyle = this.getBodyColor(body);
    const strokeStyle = this.getBodyStrokeColor(body);
    
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    
    // Dessiner la forme
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    
    ctx.closePath();
    ctx.fill();
    
    if (strokeStyle !== 'none') {
      ctx.stroke();
    }
    
    // Effet d'ombre légère pour les plateformes
    if (body.label === 'drawn-trail') {
      this.renderBodyShadow(body);
    }
  }

  getBodyColor(body) {
    switch (body.label) {
      case 'drawn-trail':
        return '#42a5f5';
      case 'world-bound':
        return '#263238';
      default:
        if (body.render && body.render.fillStyle) {
          return body.render.fillStyle;
        }
        return '#455a64';
    }
  }

  getBodyStrokeColor(body) {
    switch (body.label) {
      case 'drawn-trail':
        return '#1976d2';
      case 'world-bound':
        return 'none';
      default:
        return 'rgba(255, 255, 255, 0.1)';
    }
  }

  renderBodyShadow(body) {
    const ctx = this.ctx;
    const vertices = body.vertices;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(vertices[0].x + 2, vertices[0].y + 2);
    
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x + 2, vertices[i].y + 2);
    }
    
    ctx.closePath();
    ctx.fill();
  }

  // Rendu des traits dessinés avec styles avancés
  renderTrail(points, options = {}) {
    if (!points || points.length < 2) return;
    
    const ctx = this.ctx;
    const {
      color = '#42a5f5',
      thickness = 8,
      alpha = 1.0,
      dashed = false,
      glow = false
    } = options;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (dashed) {
      ctx.setLineDash([8, 4]);
    }
    
    // Effet de glow si demandé
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = thickness;
    }
    
    // Dessiner le trait
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
    ctx.restore();
  }

  // Rendu d'un cercle (pour les personnages)
  drawCircle(x, y, radius, options = {}) {
    const ctx = this.ctx;
    const {
      fill = '#ffd54f',
      stroke = null,
      strokeWidth = 2
    } = options;
    
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }

  // Rendu d'une ligne
  drawLine(x1, y1, x2, y2, options = {}) {
    const ctx = this.ctx;
    const {
      color = '#ffffff',
      width = 1,
      dashed = false
    } = options;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    
    if (dashed) {
      ctx.setLineDash([4, 4]);
    }
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    if (dashed) {
      ctx.setLineDash([]);
    }
  }

  // Rendu de texte
  drawText(x, y, text, options = {}) {
    const ctx = this.ctx;
    const {
      color = '#ffffff',
      size = 16,
      font = 'Arial',
      align = 'left',
      baseline = 'top',
      stroke = false,
      strokeColor = '#000000',
      strokeWidth = 2
    } = options;
    
    ctx.font = `${size}px ${font}`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillStyle = color;
    
    if (stroke) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(text, x, y);
    }
    
    ctx.fillText(text, x, y);
  }

  // Rendu de debug
  renderDebug(physics, characterManager) {
    if (!this.debugMode) return;
    
    const ctx = this.ctx;
    
    // Informations de performance
    const fps = this.calculateFPS();
    this.drawText(10, 10, `FPS: ${fps}`, { color: '#00ff00', size: 14 });
    
    // Statistiques physiques
    const bodyCount = physics.getBodies().length;
    this.drawText(10, 30, `Bodies: ${bodyCount}`, { color: '#00ff00', size: 14 });
    
    // Statistiques des personnages
    if (characterManager) {
      const stats = characterManager.getStats();
      this.drawText(10, 50, `Characters: ${stats.alive}/${stats.total}`, { color: '#00ff00', size: 14 });
    }
    
    // Rayons de détection des personnages
    if (characterManager) {
      this.renderCharacterDebug(characterManager);
    }
  }

  renderCharacterDebug(characterManager) {
    const ctx = this.ctx;
    
    for (const character of characterManager.getAliveCharacters()) {
      const pos = character.getPosition();
      
      // Direction du personnage
      const directionEnd = {
        x: pos.x + character.direction * 30,
        y: pos.y - 10
      };
      
      this.drawLine(pos.x, pos.y - 10, directionEnd.x, directionEnd.y, {
        color: '#ff5722',
        width: 2
      });
      
      // Zone de détection au sol
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pos.x - 8, pos.y + 6, 16, 10);
    }
  }

  // Utilitaires de rendu
  getOrCreateGradient(name, creator) {
    if (!this.gradientCache.has(name)) {
      this.gradientCache.set(name, creator());
    }
    return this.gradientCache.get(name);
  }

  // Calcul de FPS pour le debug
  calculateFPS() {
    if (!this.lastFrameTime) this.lastFrameTime = performance.now();
    if (!this.frameCount) this.frameCount = 0;
    
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
    
    return this.fps || 60;
  }

  // Configuration
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  toggleDebugMode() {
    this.debugMode = !this.debugMode;
  }

  // Nettoyage
  destroy() {
    this.imageCache.clear();
    this.gradientCache.clear();
  }
}
