export const orbSizes = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
  "2xl": 96,
} as const;

export type OrbSizePreset = keyof typeof orbSizes;

export function resolveOrbSize(size?: number | OrbSizePreset): number {
  if (typeof size === "string") return orbSizes[size] ?? 64;
  return size ?? 64;
}
