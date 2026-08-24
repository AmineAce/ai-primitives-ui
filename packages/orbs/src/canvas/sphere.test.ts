import { describe, expect, it } from "vitest";
import { fitRadius, makeSphereDots, project } from "./sphere";

describe("fitRadius", () => {
  it("hits the 42% cap at base resolution", () => {
    expect(fitRadius(64)).toBeCloseTo(64 * 0.42, 6);
  });

  it("never exceeds 42% of the canvas", () => {
    for (const size of [64, 96, 128, 256, 512]) {
      expect(fitRadius(size)).toBeLessThanOrEqual(size * 0.42);
    }
  });

  it("grows with the canvas", () => {
    expect(fitRadius(128)).toBeGreaterThan(fitRadius(64));
    expect(fitRadius(32)).toBeLessThan(fitRadius(64));
  });
});

describe("project", () => {
  it("maps the origin to the canvas center with unit scale", () => {
    const point = project({ x: 0, y: 0, z: 0 }, 100, 80, 0.3, -0.5);
    expect(point.x).toBeCloseTo(100, 6);
    expect(point.y).toBeCloseTo(80, 6);
    expect(point.z).toBeCloseTo(0, 6);
    expect(point.scale).toBe(1);
  });
});

describe("makeSphereDots", () => {
  it("places every dot on the sphere surface", () => {
    const dots = makeSphereDots(100, 40);
    expect(dots).toHaveLength(100);
    for (const dot of dots) {
      const radiusSquared = dot.x * dot.x + dot.y * dot.y + dot.z * dot.z;
      expect(radiusSquared).toBeCloseTo(40 * 40, 6);
    }
  });

  it("is deterministic", () => {
    expect(makeSphereDots(12, 30)).toEqual(makeSphereDots(12, 30));
  });
});
