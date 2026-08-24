import { describe, expect, it } from "vitest";
import type { Point3D } from "./sphere";
import { lerp3, quad } from "./paths";

const A: Point3D = { x: 0, y: 0, z: 0 };
const B: Point3D = { x: 10, y: 20, z: 30 };
const C: Point3D = { x: 5, y: 5, z: 5 };

describe("lerp3", () => {
  it("returns the start at f = 0", () => {
    expect(lerp3(A, B, 0)).toEqual(A);
  });

  it("returns the end at f = 1", () => {
    expect(lerp3(A, B, 1)).toEqual(B);
  });

  it("interpolates by f", () => {
    expect(lerp3(A, B, 0.5)).toEqual({ x: 5, y: 10, z: 15 });
  });
});

describe("quad", () => {
  it("passes through the corners at f = 0 and f = 1", () => {
    expect(quad(A, C, B, 0)).toEqual(A);
    expect(quad(A, C, B, 1)).toEqual(B);
  });

  it("hits the quadratic midpoint", () => {
    const mid = quad(A, C, B, 0.5);
    expect(mid.x).toBeCloseTo(5, 6);
    expect(mid.y).toBeCloseTo(7.5, 6);
    expect(mid.z).toBeCloseTo(10, 6);
  });
});
