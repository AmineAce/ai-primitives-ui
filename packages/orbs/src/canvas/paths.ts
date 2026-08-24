import type { Point3D } from "./sphere";

export function lerp3(a: Point3D, b: Point3D, f: number): Point3D {
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    z: a.z + (b.z - a.z) * f,
  };
}

export function quad(a: Point3D, c: Point3D, b: Point3D, f: number): Point3D {
  return lerp3(lerp3(a, c, f), lerp3(c, b, f), f);
}
