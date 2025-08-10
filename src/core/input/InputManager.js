/**
 * Gestionnaire d'entrées optimisé pour le dessin et les interactions
 */
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.isDrawing = false;
    this.lastDrawPoint = null;
    this.lastClickTime = 0;
    this.doubleClickDelay = 300;

    // Callbacks à définir par le jeu
    this.onDrawStart = null;
    this.onDrawMove = null;
    this.onDrawEnd = null;
    this.onErase = null;
    this.onDoubleClick = null;

    // État des entrées
    this.mouseState = {
      x: 0,
      y: 0,
      leftButton: false,
      rightButton: false,
      isOverCanvas: false,
    };

    this.bindEvents();
  }

  bindEvents() {
    // Événements de souris
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.canvas.addEventListener(
      "mouseenter",
      () => (this.mouseState.isOverCanvas = true)
    );
    this.canvas.addEventListener("mouseleave", () => this.handleMouseLeave());

    // Désactiver le menu contextuel
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Événements tactiles pour mobile (non-passifs pour preventDefault)
    this.canvas.addEventListener(
      "touchstart",
      (e) => this.handleTouchStart(e),
      { passive: false }
    );
    this.canvas.addEventListener("touchmove", (e) => this.handleTouchMove(e), {
      passive: false,
    });
    this.canvas.addEventListener("touchend", (e) => this.handleTouchEnd(e), {
      passive: false,
    });

    // Événements globaux
    window.addEventListener("mouseup", (e) => this.handleGlobalMouseUp(e));
    window.addEventListener("keydown", (e) => this.handleKeyDown(e));
  }

  handleMouseDown(e) {
    e.preventDefault();

    const point = this.getCanvasPoint(e);
    this.updateMouseState(e, point);

    if (e.button === 0) {
      // Clic gauche
      this.handleLeftClick(point, e);
    } else if (e.button === 2) {
      // Clic droit
      this.handleRightClick(point);
    }
  }

  handleMouseMove(e) {
    const point = this.getCanvasPoint(e);
    this.updateMouseState(e, point);

    if (this.isDrawing && this.onDrawMove) {
      const distance = this.lastDrawPoint
        ? this.calculateDistance(this.lastDrawPoint, point)
        : 0;

      // Seuil minimum pour éviter les points trop rapprochés
      if (distance >= 2) {
        this.onDrawMove(point);
        this.lastDrawPoint = point;
      }
    } else if (this.mouseState.rightButton && this.onErase) {
      // Effacement continu avec clic droit maintenu
      this.onErase(point);
    }
  }

  handleMouseUp(e) {
    const point = this.getCanvasPoint(e);
    this.updateMouseState(e, point);

    if (e.button === 0 && this.isDrawing) {
      this.stopDrawing();
    }
  }

  handleMouseLeave() {
    this.mouseState.isOverCanvas = false;
    if (this.isDrawing) {
      this.stopDrawing();
    }
  }

  handleGlobalMouseUp(e) {
    // Arrêter le dessin même si la souris sort du canvas
    if (this.isDrawing) {
      this.stopDrawing();
    }

    this.mouseState.leftButton = false;
    this.mouseState.rightButton = false;
  }

  handleLeftClick(point, event) {
    const currentTime = performance.now();
    const timeSinceLastClick = currentTime - this.lastClickTime;

    // Détection du double-clic
    if (timeSinceLastClick < this.doubleClickDelay) {
      if (this.onDoubleClick) {
        this.onDoubleClick(point);
      }
      this.lastClickTime = 0; // Réinitialiser pour éviter les triple-clics
    } else {
      this.lastClickTime = currentTime;
      this.startDrawing(point);
    }
  }

  handleRightClick(point) {
    if (this.onErase) {
      this.onErase(point);
    }
  }

  startDrawing(point) {
    this.isDrawing = true;
    this.lastDrawPoint = point;

    if (this.onDrawStart) {
      this.onDrawStart(point);
    }
  }

  stopDrawing() {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    this.lastDrawPoint = null;

    if (this.onDrawEnd) {
      this.onDrawEnd();
    }
  }

  // Support tactile pour mobile
  handleTouchStart(e) {
    e.preventDefault();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const point = this.getCanvasPointFromTouch(touch);
      this.startDrawing(point);
    }
  }

  handleTouchMove(e) {
    e.preventDefault();

    if (e.touches.length === 1 && this.isDrawing) {
      const touch = e.touches[0];
      const point = this.getCanvasPointFromTouch(touch);

      const distance = this.lastDrawPoint
        ? this.calculateDistance(this.lastDrawPoint, point)
        : 0;

      if (distance >= 3 && this.onDrawMove) {
        this.onDrawMove(point);
        this.lastDrawPoint = point;
      }
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();

    if (e.touches.length === 0) {
      this.stopDrawing();
    }
  }

  handleKeyDown(e) {
    // Raccourcis clavier utiles
    if (e.code === "KeyZ" && (e.ctrlKey || e.metaKey)) {
      // Annuler (futur)
      e.preventDefault();
    } else if (e.code === "KeyC" && (e.ctrlKey || e.metaKey)) {
      // Effacer tout (futur)
      e.preventDefault();
    }
  }

  // Utilitaires de conversion de coordonnées
  getCanvasPoint(mouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (mouseEvent.clientX - rect.left) * scaleX,
      y: (mouseEvent.clientY - rect.top) * scaleY,
    };
  }

  getCanvasPointFromTouch(touch) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }

  updateMouseState(event, point) {
    this.mouseState.x = point.x;
    this.mouseState.y = point.y;
    this.mouseState.leftButton = (event.buttons & 1) !== 0;
    this.mouseState.rightButton = (event.buttons & 2) !== 0;
  }

  calculateDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Getters pour l'état actuel
  getMousePosition() {
    return { x: this.mouseState.x, y: this.mouseState.y };
  }

  isMouseOverCanvas() {
    return this.mouseState.isOverCanvas;
  }

  isCurrentlyDrawing() {
    return this.isDrawing;
  }

  // Configuration
  setDoubleClickDelay(delay) {
    this.doubleClickDelay = delay;
  }

  // Nettoyage
  destroy() {
    // Retirer tous les event listeners
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("mouseenter", () => {});
    this.canvas.removeEventListener("mouseleave", this.handleMouseLeave);
    this.canvas.removeEventListener("contextmenu", () => {});
    this.canvas.removeEventListener("touchstart", this.handleTouchStart);
    this.canvas.removeEventListener("touchmove", this.handleTouchMove);
    this.canvas.removeEventListener("touchend", this.handleTouchEnd);

    window.removeEventListener("mouseup", this.handleGlobalMouseUp);
    window.removeEventListener("keydown", this.handleKeyDown);
  }
}
