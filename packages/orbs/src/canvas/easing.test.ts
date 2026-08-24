import { describe, expect, it } from "vitest";
import {
  easeInOutSine,
  easeOutBack,
  easeOutCubic,
  easeOutExpo,
} from "./easing";

const STEPS = 20;

function isNonDecreasing(ease: (t: number) => number): boolean {
  let previous = ease(0);
  for (let step = 1; step <= STEPS; step++) {
    const value = ease(step / STEPS);
    if (value < previous - 1e-9) return false;
    previous = value;
  }
  return true;
}

describe.each([
  ["easeOutCubic", easeOutCubic],
  ["easeInOutSine", easeInOutSine],
  ["easeOutExpo", easeOutExpo],
])("%s", (_name, ease) => {
  it("starts at 0", () => {
    expect(ease(0)).toBeCloseTo(0, 6);
  });

  it("ends at 1", () => {
    expect(ease(1)).toBeCloseTo(1, 6);
  });

  it("stays within [0, 1] on [0, 1]", () => {
    for (let step = 0; step <= STEPS; step++) {
      const value = ease(step / STEPS);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("is non-decreasing", () => {
    expect(isNonDecreasing(ease)).toBe(true);
  });
});

describe("easeOutBack", () => {
  it("starts at 0 and ends at 1", () => {
    expect(easeOutBack(0)).toBeCloseTo(0, 6);
    expect(easeOutBack(1)).toBeCloseTo(1, 6);
  });

  it("overshoots past 1 mid-ease", () => {
    expect(easeOutBack(0.6)).toBeGreaterThan(1);
  });
});
