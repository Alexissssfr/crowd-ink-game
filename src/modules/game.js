import { createPathBodyFromPoints, distance, clamp } from "./utils.js";
import { CharacterController } from "./walker.js";
import { SoundManager } from "../core/audio/SoundManager.js";

const {
  Engine,
  Render,
  Runner,
  World,
  Bodies,
  Body,
  Events,
  Composite,
  Composites,
  Constraint,
  Vector,
} = window.Matter;

export class Game {
  constructor(canvas, hud, levels) {
    this.canvas = canvas;
    this.hud = hud;
    this.levels = levels;
    this.currentLevelIndex = 0;
    this.isPaused = false;

    // Gestionnaire de sons
    this.soundManager = new SoundManager();

    // Canvas logical size
    this.width = 1200;
    this.height = 700;

    // Ink system
    this.inkMax = 4000; // pixels budget
    this.inkRemaining = this.inkMax;
    this.drawnSegments = []; // { points: Vector[], body }
    this.isDrawing = false;
    this.currentStroke = [];
    this.eraseRadius = 16;

    // Characters
    this.characters = [];
    this.totalCharacters = 0;
    this.savedCount = 0;
    this.deadCount = 0;
    this.requiredSaves = 1; // objectif: au moins 1

    // Physics
    this.engine = Engine.create({ gravity: { x: 0, y: 1 } });
    this.runner = Runner.create();
    this.world = this.engine.world;
    this.timeScale = 1;
    this.isRunStarted = false;
    this.lockSpeed = false;
    this.autoJump = false;
    this.elapsedMs = 0;
    this.graceAfterFirstSaveMs = 3000;
    this.timeSinceLastSaveMs = 0;
    this.hasAnySaved = false;
    this.lastSettings = { speed: 1, autoJump: false, lockSpeed: false };
    this.inGoalIds = new Set();
    this.savedCount = 0; // equals current in-goal count
    this.occupancyMs = 0; // time with at least one inside
    this.occupancyQualified = false; // true once occupancyMs >= threshold
    this.prevInGoalCount = 0;
    this.isValidating = false;
    this.validationRemainingMs = 0;

    // Offscreen canvas for drawing trails to avoid blur
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Viewport resize fit
    this.resize();
  }

  start() {
    this.loadLevel(this.currentLevelIndex);
    Runner.run(this.runner, this.engine);

    // Main render loop (we draw with Canvas ourselves)
    const loop = () => {
      if (!this.isPaused) {
        this.update();
      }
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // Mouse input
    this.bindInput();
    this.bindEngineEvents();

    // Wait for start validation
    this.pause();
  }

  bindEngineEvents() {
    // Global collision handling could go here if needed later
  }

  bindInput() {
    const rect = () => this.canvas.getBoundingClientRect();
    const getMouse = (ev) => ({
      x: (ev.clientX - rect().left) * (this.canvas.width / rect().width),
      y: (ev.clientY - rect().top) * (this.canvas.height / rect().height),
    });

    const onDown = (ev) => {
      if (ev.button === 0) {
        if (this.inkRemaining <= 0) return;
        this.isDrawing = true;
        this.currentStroke = [getMouse(ev)];
        this.soundManager.play('lineDraw');
      } else if (ev.button === 2) {
        // Erase
        const m = getMouse(ev);
        this.eraseAt(m.x, m.y);
      }
    };
    const onMove = (ev) => {
      const m = getMouse(ev);
      if (this.isDrawing) {
        const last = this.currentStroke[this.currentStroke.length - 1];
        const d = distance(last, m);
        if (d >= 3) {
          // consume ink by distance
          const cost = d;
          if (this.inkRemaining - cost < 0) {
            this.finishStroke();
            return;
          }
          this.inkRemaining -= cost;
          this.currentStroke.push(m);
        }
      } else if (ev.buttons === 2) {
        // hold right button to erase continuously
        this.eraseAt(m.x, m.y);
      }
    };
    const onUp = (ev) => {
      if (this.isDrawing) this.finishStroke();
    };

    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    this.canvas.addEventListener("mousedown", onDown);
    this.canvas.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  finishStroke() {
    this.isDrawing = false;
    if (this.currentStroke.length < 2) return;
    const body = createPathBodyFromPoints(this.currentStroke, {
      thickness: 6,
      isStatic: true,
    });
    World.add(this.world, body);
    this.drawnSegments.push({ points: this.currentStroke.slice(), body });
    this.currentStroke = [];
    this.updateHud();
    this.soundManager.play('lineDraw');
  }

  eraseAt(x, y) {
    const p = { x, y };
    for (let i = this.drawnSegments.length - 1; i >= 0; i--) {
      const seg = this.drawnSegments[i];
      // quick AABB check via body bounds
      const b = seg.body.bounds;
      const insideAABB =
        x >= b.min.x - this.eraseRadius &&
        x <= b.max.x + this.eraseRadius &&
        y >= b.min.y - this.eraseRadius &&
        y <= b.max.y + this.eraseRadius;
      if (!insideAABB) continue;
      // fine check: distance to any poly vertex or segment
      const pts = seg.points;
      for (let j = 0; j < pts.length - 1; j++) {
        const a = pts[j];
        const c = pts[j + 1];
        const t = this.pointToSegmentDistance(p, a, c);
        if (t <= this.eraseRadius) {
          World.remove(this.world, seg.body);
          this.drawnSegments.splice(i, 1);
          return;
        }
      }
    }
  }

  pointToSegmentDistance(p, a, b) {
    const v = { x: b.x - a.x, y: b.y - a.y };
    const w = { x: p.x - a.x, y: p.y - a.y };
    const c1 = v.x * w.x + v.y * w.y;
    if (c1 <= 0) return distance(p, a);
    const c2 = v.x * v.x + v.y * v.y;
    if (c2 <= c1) return distance(p, b);
    const t = c1 / c2;
    const proj = { x: a.x + t * v.x, y: a.y + t * v.y };
    return distance(p, proj);
  }

  loadLevel(index) {
    // Reset world
    Composite.clear(this.world, false);
    this.drawnSegments = [];
    this.characters = [];
    this.savedCount = 0;
    this.deadCount = 0;
    this.inkRemaining = this.inkMax;
    this.elapsedMs = 0;
    this.isRunStarted = false;
    this.isPaused = true;

    const level = this.levels[index % this.levels.length];
    this.currentLevelIndex = index % this.levels.length;

    // Static boundaries
    const wallThickness = 200;
    const ground = Bodies.rectangle(
      this.width / 2,
      this.height + wallThickness / 2 - 20,
      this.width + wallThickness * 2,
      wallThickness,
      { isStatic: true, render: { fillStyle: "#223" } }
    );
    const left = Bodies.rectangle(
      -wallThickness / 2,
      this.height / 2,
      wallThickness,
      this.height * 3,
      { isStatic: true }
    );
    const right = Bodies.rectangle(
      this.width + wallThickness / 2,
      this.height / 2,
      wallThickness,
      this.height * 3,
      { isStatic: true }
    );
    World.add(this.world, [ground, left, right]);

    // Level fixed obstacles
    level.build(this.world, this.width, this.height);

    // Spawn characters
    const spawn = level.spawn;
    const goal = level.goal;
    this.goalArea = goal; // {x,y,w,h}
    this.totalCharacters = level.numCharacters;
    this.requiredSaves = 1;

    for (let i = 0; i < level.numCharacters; i++) {
      const x = spawn.x + (i % 8) * 12;
      const y = spawn.y - Math.floor(i / 8) * 4;
      const ch = new CharacterController(
        this.world,
        { x, y },
        goal,
        level.walkDirection,
        { minX: 0, maxX: this.width }
      );
      this.characters.push(ch);
    }

    // SUPPRIMÉ : Goal sensor physique - Plus de corps invisible
    // Remove old listeners then add a new one per level
    Events.off(this.engine, "beforeUpdate");
    Events.off(this.engine, "afterUpdate");

    // Comptage dynamique des persos dans la zone (sans corps physique)
    Events.on(this.engine, "afterUpdate", () => {
      this.inGoalIds.clear();
      let count = 0;
      for (const ch of this.characters) {
        if (ch.isDead) continue;
        
        // Vérification directe de la position sans corps physique
        const position = ch.body.position;
        const inGoal =
          position.x >= goal.x &&
          position.x <= goal.x + goal.w &&
          position.y >= goal.y &&
          position.y <= goal.y + goal.h;
          
        if (inGoal) {
          this.inGoalIds.add(ch.body.id);
          count += 1;
        }
      }
      const prevSaved = this.savedCount;
      this.savedCount = count;
      if (this.savedCount > 0) {
        this.hasAnySaved = true;
        this.timeSinceLastSaveMs = 0;
      }
      if (prevSaved !== this.savedCount) this.updateHud();
    });

    this.updateHud();
  }

  resetLevel() {
    this.loadLevel(this.currentLevelIndex);
    if (this.hud && this.hud.startPanel)
      this.hud.startPanel.style.display = "grid";
    this.pause();
  }

  nextLevel() {
    this.loadLevel(this.currentLevelIndex + 1);
    this.hud.levelText.textContent = String(this.currentLevelIndex + 1);
    if (this.hud && this.hud.startPanel)
      this.hud.startPanel.style.display = "grid";
    this.pause();
  }

  togglePause() {
    if (this.isPaused) this.resume();
    else this.pause();
  }

  resize() {
    // Fit canvas to container while keeping aspect ratio
    const container = document.getElementById("container");
    const rect = container.getBoundingClientRect();
    const aspect = this.width / this.height;
    let w = rect.width;
    let h = w / aspect;
    if (h > rect.height) {
      h = rect.height;
      w = h * aspect;
    }
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  updateHud() {
    const inkPct = clamp((this.inkRemaining / this.inkMax) * 100, 0, 100);
    this.hud.inkFill.style.width = `${inkPct}%`;
    this.hud.inkText.textContent = `${Math.round(inkPct)}%`;
    this.hud.savedText.textContent = `${this.savedCount} / ${this.totalCharacters}`;
    // no objective display (always 1)
    const remaining = this.characters.filter(
      (c) => !c.isSaved && !c.isDead
    ).length;
    this.hud.remainingText.textContent = String(remaining);
    this.hud.levelText.textContent = String(this.currentLevelIndex + 1);
    if (this.hud.timeText)
      this.hud.timeText.textContent = this.formatTime(this.elapsedMs);
  }

  update() {
    // Time scaling
    this.engine.timing.timeScale = this.timeScale;
    if (this.isRunStarted && !this.isPaused) {
      this.elapsedMs += 16.6667 * this.timeScale;
      if (this.hasAnySaved)
        this.timeSinceLastSaveMs += 16.6667 * this.timeScale;
      if (this.isValidating) {
        this.validationRemainingMs -= 16.6667 * this.timeScale;
        if (this.validationRemainingMs <= 0) {
          const won = this.savedCount >= this.requiredSaves || this.hasAnySaved;
          this.showOverlay(won);
          this.isValidating = false;
        }
      }
    }
    // Character AI update
    for (const c of this.characters) c.update();

    // Update moving platforms if any
    for (const body of Composite.allBodies(this.world)) {
      if (typeof body._update === "function") body._update();
    }

    // Check out-of-bounds deaths
    for (const c of this.characters) {
      if (!c.isDead && !c.isSaved && c.body.position.y > this.height + 200) {
        c.isDead = true;
        this.deadCount += 1;
      }
    }

    // End condition
    const aliveOrMoving = this.characters.some((c) => !c.isSaved && !c.isDead);
    if (!aliveOrMoving) {
      const won = this.savedCount >= this.requiredSaves;
      this.showOverlay(won);
    } else if (!this.isValidating) {
      // Track occupancy over time: if there is at least one inside for long enough, we can finish after grace
      if (this.savedCount > 0) {
        this.occupancyMs += 16.6667 * this.timeScale;
        if (!this.occupancyQualified && this.occupancyMs >= 1500) {
          this.occupancyQualified = true; // at least ~1.5s occupancy observed
        }
        this.timeSinceLastSaveMs = 0; // reset grace while someone is inside
      } else {
        // nobody inside now; increase grace
        if (this.hasAnySaved)
          this.timeSinceLastSaveMs += 16.6667 * this.timeScale;
      }
      if (
        this.occupancyQualified &&
        this.hasAnySaved &&
        this.timeSinceLastSaveMs >= this.graceAfterFirstSaveMs
      ) {
        const won = this.savedCount >= this.requiredSaves || this.hasAnySaved;
        this.showOverlay(won);
      }
    }

    this.updateHud();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Background grid
    this.renderBackground(ctx);

    // Goal zone
    ctx.fillStyle = "rgba(76,175,80,0.25)";
    const g = this.goalArea;
    if (g) ctx.fillRect(g.x, g.y, g.w, g.h);

    // World static bodies (obstacles, platforms, ground)
    const bodies = Composite.allBodies(this.world);
    for (const b of bodies) {
      if (b.label === "character" || b.label === "drawn-segment") continue;
      if (!b.isStatic) {
        // Draw moving platforms too
      }
      const verts = b.vertices;
      if (!verts || verts.length === 0) continue;
      ctx.fillStyle = (b.render && b.render.fillStyle) || "#263246";
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
      ctx.closePath();
      ctx.fill();
    }

    // Drawn segments
    ctx.strokeStyle = "#55c9ff";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const seg of this.drawnSegments) {
      const pts = seg.points;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    // Current stroke
    if (this.isDrawing && this.currentStroke.length >= 2) {
      ctx.strokeStyle = "#9be7ff";
      ctx.beginPath();
      ctx.moveTo(this.currentStroke[0].x, this.currentStroke[0].y);
      for (let i = 1; i < this.currentStroke.length; i++)
        ctx.lineTo(this.currentStroke[i].x, this.currentStroke[i].y);
      ctx.stroke();
    }

    // Characters
    for (const c of this.characters) c.render(ctx);

    // Ink eraser cursor (if right button)
    // (optional visual; skipped for simplicity)
  }

  renderBackground(ctx) {
    const s = 20;
    ctx.fillStyle = "#0b0e1a";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= this.width; x += s) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.height);
    }
    for (let y = 0; y <= this.height; y += s) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.width, y + 0.5);
    }
    ctx.stroke();
  }

  showOverlay(won) {
    if (!this.hud || !this.hud.overlay) return;
    const overlay = this.hud.overlay;
    const title = this.hud.overlayTitle;
    const subtitle = this.hud.overlaySubtitle;
    title.textContent = won ? "Bravo !" : "Fin de partie";
    const inkPct = Math.round((this.inkRemaining / this.inkMax) * 100);
    const score = this.computeScore({
      saved: this.savedCount,
      total: this.totalCharacters,
      inkPct,
    });
    subtitle.textContent = `${this.savedCount}/${this.totalCharacters} sauvés • Encre: ${inkPct}%`;
    if (this.hud.overlayScore)
      this.hud.overlayScore.textContent = `Score: ${
        score.points
      } • ${"★".repeat(score.stars)}${"☆".repeat(3 - score.stars)}`;
    overlay.style.display = "grid";
    this.pause();
    if (this.hud.ovlNext) this.hud.ovlNext.disabled = !won;
    if (this.hud.overlayTime)
      this.hud.overlayTime.textContent = `Temps: ${this.formatTime(
        this.elapsedMs
      )}`;
  }

  computeScore({ saved, total, inkPct }) {
    // Score: base sur pourcentage sauvés + bonus encre
    const saveRatio = total > 0 ? saved / total : 0;
    const timeSec = this.elapsedMs / 1000;
    const timeFactor = Math.max(0.5, Math.min(1.2, 60 / Math.max(30, timeSec)));
    const difficulty =
      (this.autoJump ? 0.95 : 1.1) * (this.lockSpeed ? 1.05 : 1.0);
    const points = Math.round(
      (saveRatio * 1000 + inkPct * 3) * timeFactor * difficulty
    );
    let stars = 1;
    if (saveRatio >= 0.6 && inkPct >= 30) stars = 2;
    if (saveRatio >= 0.8 && inkPct >= 50) stars = 3;
    return { points, stars };
  }

  setTimeScale(v) {
    if (this.lockSpeed) return;
    this.timeScale = Math.max(0.1, Math.min(3, v || 1));
    this.engine.timing.timeScale = this.isPaused ? 0 : this.timeScale;
  }

  openLevelSelect() {
    if (!this.hud || !this.hud.levelSelect) return;
    const list = this.hud.levelList;
    list.innerHTML = "";
    for (let i = 0; i < this.levels.length; i++) {
      const btn = document.createElement("button");
      btn.textContent = `Niveau ${i + 1}`;
      btn.onclick = () => {
        this.hud.levelSelect.style.display = "none";
        this.loadLevel(i);
        // Show start panel and restore last settings for a quick start
        if (this.hud.startPanel) this.hud.startPanel.style.display = "grid";
        const { speed, autoJump, lockSpeed } = this.lastSettings || {
          speed: 1,
          autoJump: false,
          lockSpeed: false,
        };
        if (this.hud.startSpeed) this.hud.startSpeed.value = String(speed);
        if (this.hud.startSpeedText)
          this.hud.startSpeedText.textContent = `${Number(speed).toFixed(2)}x`;
        if (this.hud.optAutoJump) this.hud.optAutoJump.checked = !!autoJump;
        if (this.hud.optLockSpeed) this.hud.optLockSpeed.checked = !!lockSpeed;
        if (this.hud.speedSlider) this.hud.speedSlider.value = String(speed);
        if (this.hud.speedText)
          this.hud.speedText.textContent = `${Number(speed).toFixed(2)}x`;
      };
      list.appendChild(btn);
    }
    const inf = document.createElement("button");
    inf.textContent = "Mode Infini (à venir)";
    inf.disabled = true;
    list.appendChild(inf);
    this.hud.levelSelect.style.display = "grid";
  }

  aabbOverlap(a, b) {
    return (
      a.min.x <= b.max.x &&
      a.max.x >= b.min.x &&
      a.min.y <= b.max.y &&
      a.max.y >= b.min.y
    );
  }

  // SUPPRIMÉ : boundsOverlapLoose - Plus utilisée

  beginRun({ speed, autoJump, lockSpeed }) {
    this.setTimeScale(speed);
    this.autoJump = !!autoJump;
    this.lockSpeed = !!lockSpeed;
    this.isRunStarted = true;
    for (const c of this.characters) c.autoJumpEnabled = this.autoJump;
    if (this.hud && this.hud.speedSlider)
      this.hud.speedSlider.disabled = this.lockSpeed;
    this.resume();
    this.isValidating = false;
    this.validationRemainingMs = 0;
    this.occupancyMs = 0;
    this.occupancyQualified = false;
    this.hasAnySaved = false;
    this.timeSinceLastSaveMs = 0;
  }

  formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  pause() {
    this.isPaused = true;
    this.engine.timing.timeScale = 0;
  }

  resume() {
    this.isPaused = false;
    this.engine.timing.timeScale = this.timeScale;
  }

  requestValidation(durationMs = 2000) {
    if (!this.isRunStarted || this.isPaused) return;
    // Start a validation window; we will end level after duration, using current savedCount
    this.isValidating = true;
    this.validationRemainingMs = Math.max(500, durationMs);
  }
}
