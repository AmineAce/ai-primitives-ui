"use client";

export {
  CloningOrb,
  FetchingOrb,
  PullingOrb,
  PushingOrb,
  MergingOrb,
  RebasingOrb,
  StashingOrb,
  SyncOrb,
  OrbitOrb,
  CubeOrb,
  ScanOrb,
} from "./loading";
export { StreamingText } from "./streaming";
export type {
  CloningOrbProps,
  FetchingOrbProps,
  PullingOrbProps,
  PushingOrbProps,
  MergingOrbProps,
  RebasingOrbProps,
  StashingOrbProps,
  SyncOrbProps,
  OrbitOrbProps,
  CubeOrbProps,
  ScanOrbProps,
} from "./loading";
export type { StreamingTextProps } from "./streaming";
export { makeInk, inkFromColor } from "./canvas/colors";
export type { Ink } from "./canvas/colors";
export { orbSizes, resolveOrbSize } from "./lib/presets";
export type { OrbSizePreset } from "./lib/presets";
