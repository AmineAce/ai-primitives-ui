import { describe, expect, it } from "vitest";
import { mulberry32 } from "./random";

describe("mulberry32", () => {
  it("is deterministic for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const expected = Array.from({ length: 10 }, () => a());
    expect(Array.from({ length: 10 }, () => b())).toEqual(expected);
  });

  it("produces values in [0, 1)", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("produces different sequences for different seeds", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});
