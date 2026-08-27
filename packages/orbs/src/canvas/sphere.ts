export const R = 48;

export function fitRadius(size: number): number {
  return Math.min(R * (size / 64), size * 0.42);
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  scale: number;
}

export function project(
  p: Point3D,
  cx: number,
  cy: number,
  tiltX: number,
  tiltY: number,
): ProjectedPoint {
  const cosX = Math.cos(tiltX);
  const sinX = Math.sin(tiltX);
  const cosY = Math.cos(tiltY);
  const sinY = Math.sin(tiltY);
  return projectWithTrig(p, cx, cy, cosX, sinX, cosY, sinY);
}

export function projectWithTrig(
  p: Point3D,
  cx: number,
  cy: number,
  cosX: number,
  sinX: number,
  cosY: number,
  sinY: number,
): ProjectedPoint {
  const rotatedY1 = p.y * cosX - p.z * sinX;
  const rotatedZ1 = p.y * sinX + p.z * cosX;
  const x2 = p.x * cosY + rotatedZ1 * sinY;
  const z2 = -p.x * sinY + rotatedZ1 * cosY;
  const scale = 1 / (1 + z2 * 0.0035);
  return { x: cx + x2 * scale, y: cy - rotatedY1 * scale, z: z2, scale };
}

export function spherePoint(theta: number, phi: number, r: number): Point3D {
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  };
}

export function makeSphereDots(count: number, radius: number): Point3D[] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const step = count > 1 ? 1 / (count - 1) : 0;
  const dots: Point3D[] = [];

  for (let i = 0; i < count; i++) {
    const y = 1 - i * step * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    dots.push({
      x: radius * radiusAtY * Math.cos(theta),
      y: radius * y,
      z: radius * radiusAtY * Math.sin(theta),
    });
  }

  return dots;
}
