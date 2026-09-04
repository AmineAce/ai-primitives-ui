"use client";

const TWO_PI = Math.PI * 2;
const TILT = 0.35;

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Dot {
  x: number;
  y: number;
  r: number;
  a: number;
}

const GLOBE_RINGS = [
  { y: -0.55, count: 5 },
  { y: 0, count: 7 },
  { y: 0.55, count: 5 },
];

/** Shared 17-point globe skeleton used by `drawGlobe`. */
export const GLOBE_POINTS: Point3D[] = [];
for (const ring of GLOBE_RINGS) {
  const rr = Math.sqrt(1 - ring.y * ring.y);
  for (let j = 0; j < ring.count; j++) {
    const theta = (j * TWO_PI) / ring.count;
    GLOBE_POINTS.push({
      x: rr * Math.cos(theta),
      y: ring.y,
      z: rr * Math.sin(theta),
    });
  }
}

function drawDots(ctx: CanvasRenderingContext2D, color: string, dots: Dot[]) {
  for (const d of dots) {
    ctx.globalAlpha = d.a;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, TWO_PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export interface GlobeOpts {
  cx: number;
  cy: number;
  radius: number;
  spin: number;
  spread: number;
  alpha: number;
  split?: number;
}

/** Paint the shared globe skeleton onto a 2D context. */
export function drawGlobe(
  ctx: CanvasRenderingContext2D,
  color: string,
  o: GlobeOpts,
) {
  const cosY = Math.cos(o.spin);
  const sinY = Math.sin(o.spin);
  const cosX = Math.cos(TILT);
  const sinX = Math.sin(TILT);
  const dots: Dot[] = [];
  for (const p of GLOBE_POINTS) {
    const x = p.x * o.radius;
    const y = p.y * o.radius;
    const z = p.z * o.radius;
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    let px = o.cx + x1 * o.spread;
    let py = o.cy - y2 * o.spread;
    if (o.split) {
      const side = (px - o.cx) * 0.7071 - (py - o.cy) * 0.7071 >= 0 ? 1 : -1;
      px += side * o.split * 0.7071;
      py -= side * o.split * 0.7071;
    }
    dots.push({
      x: px,
      y: py,
      r: 0.55,
      a: o.alpha * (z2 > 0 ? 0.35 : 1),
    });
  }
  drawDots(ctx, color, dots);
}
