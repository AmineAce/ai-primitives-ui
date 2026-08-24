import { describe, expect, it } from "vitest";
import {
  DEFAULT_DOT_RGB,
  ORB_FG_VAR,
  parseColor,
  toColorPrefix,
} from "./colors";

describe("toColorPrefix", () => {
  it("formats the default dot color", () => {
    expect(toColorPrefix(DEFAULT_DOT_RGB)).toBe("rgba(201, 209, 217, ");
  });

  it("leaves the alpha slot for the orb to suffix", () => {
    const prefix = toColorPrefix({ r: 10, g: 20, b: 30 });
    expect(prefix + "0.500)").toBe("rgba(10, 20, 30, 0.500)");
  });
});

describe("parseColor", () => {
  it("parses rgb()", () => {
    expect(parseColor("rgb(230, 237, 243)")).toEqual({
      r: 230,
      g: 237,
      b: 243,
    });
  });

  it("parses rgba() and drops the alpha", () => {
    expect(parseColor("rgba(201, 209, 217, 0.4)")).toEqual(DEFAULT_DOT_RGB);
  });

  it("normalizes hex through fillStyle", () => {
    expect(parseColor("#e6edf3")).toEqual({ r: 230, g: 237, b: 243 });
  });

  it("trims surrounding whitespace", () => {
    expect(parseColor("  #e6edf3  ")).toEqual({ r: 230, g: 237, b: 243 });
  });

  it("rejects empty and whitespace-only input", () => {
    expect(parseColor("")).toBeNull();
    expect(parseColor("   ")).toBeNull();
  });

  it("rejects invalid colors via the sentinel check", () => {
    expect(parseColor("not-a-color")).toBeNull();
    expect(parseColor("#zzz")).toBeNull();
  });
});

describe("ORB_FG_VAR", () => {
  it("matches the documented CSS variable", () => {
    expect(ORB_FG_VAR).toBe("--orb-fg");
  });
});
