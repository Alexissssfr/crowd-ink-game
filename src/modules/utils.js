const { Bodies, Body, World, Composite, Vertices } = window.Matter;

export function distance(a, b) {
  const dx = a.x - b.x; const dy = a.y - b.y; return Math.hypot(dx, dy);
}

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Create a thick polyline as a chain of small rectangles approximating the stroke
export function createPathBodyFromPoints(points, { thickness = 6, isStatic = true } = {}) {
  const { Bodies, Body, Composite, World } = window.Matter;
  const rects = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = p1.x - p0.x; const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) continue;
    const angle = Math.atan2(dy, dx);
    const cx = (p0.x + p1.x) / 2;
    const cy = (p0.y + p1.y) / 2;
    const rect = Bodies.rectangle(cx, cy, len, thickness, { isStatic, friction: 0.18, frictionStatic: 0.1, restitution: 0.0, render: { fillStyle: '#55c9ff' } });
    Body.rotate(rect, angle);
    rects.push(rect);
  }
  if (rects.length === 0) {
    return Bodies.circle(points[0].x, points[0].y, thickness * 0.5, { isStatic });
  }
  // Combine into a compound body
  const compound = Body.create({ parts: rects, isStatic });
  compound.label = 'drawn-segment';
  return compound;
}


