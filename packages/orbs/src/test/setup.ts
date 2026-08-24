import { vi } from "vitest";

const SENTINEL = "rgb(0, 1, 0)";

function toRgb(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const hex =
    /^#[0-9a-f]{3}$/i.test(trimmed) || /^#[0-9a-f]{6}$/i.test(trimmed);
  if (hex) {
    let digits = trimmed.slice(1);
    if (digits.length === 3) {
      digits =
        digits[0] + digits[0] + digits[1] + digits[1] + digits[2] + digits[2];
    }
    const n = parseInt(digits, 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
  }

  if (
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+)?\s*\)$/i.test(
      trimmed,
    )
  ) {
    return trimmed.replace(/\s+/g, " ").replace(/,\s+/g, ", ");
  }

  return null;
}

function mockContext(): CanvasRenderingContext2D {
  let current = SENTINEL;
  const ctx = {
    get fillStyle() {
      return current;
    },
    set fillStyle(value: string | CanvasGradient | CanvasPattern) {
      const normalized = toRgb(String(value));
      if (normalized) current = normalized;
    },
  } as unknown as CanvasRenderingContext2D;
  return ctx;
}

vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() =>
  mockContext(),
);
