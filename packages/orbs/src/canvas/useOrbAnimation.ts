"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
  DEFAULT_DOT_RGB,
  FG_FALLBACK_VAR,
  makeInk,
  ORB_FG_VAR,
  parseColor,
  toColorPrefix,
  type Ink,
  type RgbColor,
} from "./colors";

const MAX_DPR = 2;

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReducedSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot() {
  return false;
}

export interface UseOrbAnimationOptions {
  size: number;
  height?: number;
  speed: number;
  paused: boolean;
  color?: string;
  render: (
    ctx: CanvasRenderingContext2D,
    elapsed: number,
    reduced: boolean,
    colorPrefix: string,
    ink: Ink,
  ) => void;
}

export function useOrbAnimation({
  size,
  height,
  speed,
  paused,
  color,
  render,
}: UseOrbAnimationOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const elapsedRef = useRef(0);
  const colorRef = useRef(toColorPrefix(DEFAULT_DOT_RGB));
  const inkRef = useRef<Ink>((a: number) => a);
  const reduceMotion = useSyncExternalStore(
    subscribeReduced,
    getReducedSnapshot,
    getServerSnapshot,
  );
  const reduceMotionRef = useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;

  const optsRef = useRef({ speed, paused, render });
  optsRef.current = { speed, paused, render };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const w = Math.round(size * dpr);
    const h = Math.round((height ?? size) * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  }, [size, height]);

  useEffect(() => {
    const resolve = () => {
      const canvas = canvasRef.current;
      let rgb = DEFAULT_DOT_RGB;
      if (color) {
        rgb = parseColor(color) ?? DEFAULT_DOT_RGB;
      } else if (canvas) {
        const cs = window.getComputedStyle(canvas);
        const value =
          cs.getPropertyValue(ORB_FG_VAR).trim() ||
          cs.getPropertyValue(FG_FALLBACK_VAR).trim();
        rgb = parseColor(value) ?? DEFAULT_DOT_RGB;
      }
      colorRef.current = toColorPrefix(rgb);
      inkRef.current = makeInk(rgb);
      if (!reduceMotionRef.current || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx)
        optsRef.current.render(ctx, 0, true, colorRef.current, inkRef.current);
    };

    resolve();

    if (color || typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(resolve);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    return () => observer.disconnect();
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (reduceMotion) {
      optsRef.current.render(ctx, 0, true, colorRef.current, inkRef.current);
      return;
    }

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const { speed, paused, render } = optsRef.current;
      if (!paused) elapsedRef.current += dt * speed;
      render(ctx, elapsedRef.current, false, colorRef.current, inkRef.current);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, size, height]);

  return { canvasRef, reduceMotion };
}
