const { Bodies, Body, Composite, Query } = window.Matter;

export class CharacterController {
  constructor(
    world,
    position,
    goal,
    walkDirection = 1,
    bounds = { minX: 0, maxX: 1200 }
  ) {
    this.world = world;
    this.goal = goal;
    this.isDead = false;
    this.isSaved = false;
    this.walkDirection = walkDirection;
    this.moveDir = Math.sign(walkDirection) || 1;
    this.radius = 6;
    this.bounds = bounds;

    // Compound body with foot sensor
    const main = Bodies.circle(position.x, position.y, this.radius, {
      friction: 0.06,
      frictionStatic: 0.12,
      restitution: 0.0,
      density: 0.0018,
      label: "character",
      render: { fillStyle: "#ffd54f" },
    });
    // Keep single circle for simpler collisions (avoids snagging on segments)
    this.body = Body.create({ parts: [main], frictionAir: 0.02 });
    this.body.label = "character";
    Matter.World.add(this.world, this.body);

    // Visual walk animation state
    this.stepTime = 0;
    this.isGrounded = false;
    this.turnCooldown = 0;
    this.stuckTimer = 0;
    this.autoJumpEnabled = true;
  }

  update() {
    if (this.isDead || this.isSaved) return;
    const body = this.body;

    // Update grounded state by checking small region below feet
    this.isGrounded = this.checkGrounded();

    // Detect wall just ahead at foot height
    const wallAhead = this.detectWallAhead(this.moveDir);
    if (wallAhead && this.isGrounded && this.turnCooldown <= 0) {
      // Try a tiny hop only if allowed; else just invert to avoid jitter
      if (this.autoJumpEnabled) {
        Body.applyForce(body, body.position, { x: 0, y: -0.005 });
      }
      this.turnCooldown = 15; // ~0.25s
      // If we are nearly stopped, also reverse to avoid jittering against vertical bars
      if (Math.abs(body.velocity.x) < 0.2) this.moveDir = -this.moveDir;
    }

    // NOTE: do NOT turn around when there is no support ahead; we want them to
    // walk off the edge and fall. Only walls trigger a reversal.

    // World bounds patrol
    const margin = 12;
    if (body.position.x > this.bounds.maxX - margin) this.moveDir = -1;
    if (body.position.x < this.bounds.minX + margin) this.moveDir = 1;

    // Slope assistance: estimate ground height delta ahead vs current
    let uphillBoost = 1.0;
    if (this.isGrounded) {
      const hereY = this.sampleGroundYAt(
        body.position.x,
        body.position.y + this.radius + 2,
        body.position.y + this.radius + 40
      );
      const aheadX = body.position.x + this.moveDir * 10;
      const aheadY = this.sampleGroundYAt(
        aheadX,
        body.position.y + this.radius + 2,
        body.position.y + this.radius + 40
      );
      if (hereY !== null && aheadY !== null) {
        const delta = aheadY - hereY; // negative -> uphill
        if (delta < -2) {
          uphillBoost = 1.6;
          if (Math.abs(body.velocity.x) < 0.12 && this.autoJumpEnabled) {
            Body.applyForce(body, body.position, {
              x: 0.001 * this.moveDir,
              y: -0.008,
            });
          }
        }
      }
    }

    // Stuck resolution: if slow for a moment while grounded, hop and flip
    if (
      this.isGrounded &&
      Math.abs(body.velocity.x) < 0.08 &&
      this.hasSupportAhead(this.moveDir)
    ) {
      this.stuckTimer += 1;
      if (this.stuckTimer > 45) {
        // ~0.75s
        if (this.autoJumpEnabled) {
          Body.applyForce(body, body.position, {
            x: 0.002 * this.moveDir,
            y: -0.01,
          });
        }
        this.moveDir = -this.moveDir;
        this.stuckTimer = 0;
        this.turnCooldown = 20;
      }
    } else {
      this.stuckTimer = 0;
    }

    // Simple locomotion: apply small horizontal force; slightly more when grounded/uphill
    const maxSpeed = 2.8;
    const groundFactor = this.isGrounded ? 1.0 : 0.5;
    const forceMag = 0.0012 * groundFactor * uphillBoost;
    if (Math.abs(body.velocity.x) < maxSpeed) {
      Body.applyForce(body, body.position, {
        x: forceMag * this.moveDir,
        y: 0,
      });
    }

    if (this.turnCooldown > 0) this.turnCooldown -= 1;

    // Gravity handles vertical motion; friction on slopes will cause sliding
    // Dead check: extreme forces or off-screen handled elsewhere

    // Step animation clock
    this.stepTime += 1 / 60;
  }

  checkGrounded() {
    const p = this.body.position;
    const r = this.radius;
    const region = {
      min: { x: p.x - r * 0.5, y: p.y + r - 1 },
      max: { x: p.x + r * 0.5, y: p.y + r + 6 },
    };
    const bodies = Composite.allBodies(this.world);
    for (const b of bodies) {
      if (b === this.body || b.label === "character") continue;
      if (b.isSensor) continue;
      if (this.aabbOverlap(region, b.bounds)) return true;
    }
    return false;
  }

  detectWallAhead(sign) {
    const p = this.body.position;
    const r = this.radius;
    const bodies = Composite.allBodies(this.world).filter(
      (b) => b !== this.body && b.label !== "character" && !b.isSensor
    );

    const cast = (yOffset) => {
      const start = { x: p.x + sign * (r + 1), y: p.y + yOffset };
      const end = { x: p.x + sign * (r + 12), y: p.y + yOffset };
      const hits = Query.ray(bodies, start, end);
      if (!hits || hits.length === 0) return null;
      return hits.reduce((m, h) => (h.t < m.t ? h : m), hits[0]);
    };

    // Ray at foot height and at head height
    const hitFoot = cast(r - 2);
    const hitHead = cast(-r);

    // Treat as wall only if BOTH rays hit something very near ahead
    const near = (hit) => hit && hit.t < 0.45; // a bit more tolerant
    if (near(hitFoot) && near(hitHead)) return true;
    return false; // likely a slope or low obstacle, allow movement
  }

  hasSupportAhead(sign) {
    const p = this.body.position;
    const r = this.radius;
    const x = p.x + sign * (r + 6);
    const yTop = p.y + r - 6;
    const yBottom = p.y + r + 26; // larger window
    const bodies = Composite.allBodies(this.world).filter(
      (b) => b !== this.body && b.label !== "character" && !b.isSensor
    );
    // vertical down
    const hitsDown = Query.ray(bodies, { x, y: yTop }, { x, y: yBottom });
    if (hitsDown && hitsDown.length > 0) return true;
    // diagonal up (ascending slope support)
    const diagStart = { x: p.x + sign * (r + 2), y: p.y + r - 2 };
    const diagEnd = { x: p.x + sign * (r + 14), y: p.y + r - 12 };
    const hitsDiag = Query.ray(bodies, diagStart, diagEnd);
    return hitsDiag && hitsDiag.length > 0;
  }

  sampleGroundYAt(x, yTop, yBottom) {
    const bodies = Composite.allBodies(this.world).filter(
      (b) => b !== this.body && b.label !== "character" && !b.isSensor
    );
    const hits = Query.ray(bodies, { x, y: yTop }, { x, y: yBottom });
    if (!hits || hits.length === 0) return null;
    const nearest = hits.reduce((m, h) => (h.t < m.t ? h : m), hits[0]);
    return yTop + (yBottom - yTop) * nearest.t;
  }

  aabbOverlap(a, b) {
    return (
      a.min.x <= b.max.x &&
      a.max.x >= b.min.x &&
      a.min.y <= b.max.y &&
      a.max.y >= b.min.y
    );
  }

  render(ctx) {
    const p = this.body.position;
    // Body
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Simple stick figure legs animation
    const legLen = 8;
    const phase = Math.sin(this.stepTime * 8 + p.x * 0.02);
    const legSpread = 3;
    ctx.strokeStyle = "#ffecb3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x - legSpread, p.y + 4);
    ctx.lineTo(p.x - legSpread + phase * 2, p.y + 4 + legLen);
    ctx.moveTo(p.x + legSpread, p.y + 4);
    ctx.lineTo(p.x + legSpread - phase * 2, p.y + 4 + legLen);
    ctx.stroke();
  }
}
