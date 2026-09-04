/** Logical canvas sizes in px (`xs:16 → 2xl:96`); pass values (not names) to orb `size` props. */
export const orbSizes = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
  "2xl": 96,
} as const;

/** Preset name union for `orbSizes` keys. */
export type OrbSizePreset = keyof typeof orbSizes;

/** Resolve a preset name or raw px to px (unknown → 64). */
export function resolveOrbSize(size?: number | OrbSizePreset): number {
  if (typeof size === "string") return orbSizes[size] ?? 64;
  return size ?? 64;
}
