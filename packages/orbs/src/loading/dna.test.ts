import { describe, expect, it } from "vitest";
import { helixPoint, PAIRS, TWIST } from "./DnaOrb";

describe("helixPoint", () => {
  const R = 10;
  const H = 40;

  it("keeps both strands at constant radius from the axis", () => {
    for (const phase of [0, Math.PI]) {
      for (let i = 0; i <= 20; i++) {
        const p = helixPoint(i / 20, phase, R, H);
        expect(Math.hypot(p.x, p.z)).toBeCloseTo(R, 6);
      }
    }
  });

  it("is antiphasic: strand B mirrors strand A through the axis", () => {
    for (let i = 0; i <= 20; i++) {
      const a = helixPoint(i / 20, 0, R, H);
      const b = helixPoint(i / 20, Math.PI, R, H);
      expect(b.x).toBeCloseTo(-a.x, 6);
      expect(b.z).toBeCloseTo(-a.z, 6);
      expect(b.y).toBeCloseTo(a.y, 6);
    }
  });

  it("spans exactly the helix height, bottom to top", () => {
    expect(helixPoint(0, 0, R, H).y).toBeCloseTo(-H / 2, 6);
    expect(helixPoint(1, 0, R, H).y).toBeCloseTo(H / 2, 6);
  });

  it("completes TWIST radians over one full span", () => {
    const top = helixPoint(1, 0, R, H);
    const bottom = helixPoint(0, 0, R, H);
    const swept = Math.atan2(top.z, top.x) - Math.atan2(bottom.z, bottom.x);
    const norm = (a: number) =>
      ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    expect(norm(swept)).toBeCloseTo(norm(TWIST), 6);
  });

  it("lights every rung position within the PAIRS count", () => {
    expect(PAIRS).toBeGreaterThan(2);
    for (let i = 1; i < PAIRS - 1; i++) {
      const tNorm = i / (PAIRS - 1);
      expect(tNorm).toBeGreaterThan(0);
      expect(tNorm).toBeLessThan(1);
    }
  });
});
