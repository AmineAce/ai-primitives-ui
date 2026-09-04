"use client";

import { useMemo } from "react";
import { CanvasContainer } from "../canvas/CanvasContainer";
import { useOrbAnimation } from "../canvas/useOrbAnimation";

export interface MiniOrbProps {
  done?: boolean;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

const TWO_PI = Math.PI * 2;

export function MiniOrb({
  done = false,
  size = 16,
  color,
  className,
  style,
  "aria-label": ariaLabel,
}: MiniOrbProps) {
  const cx = size / 2;
  const cy = size / 2;

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    ctx.clearRect(0, 0, size, size);

    const fills: string[] = [];
    for (let i = 0; i <= 20; i++)
      fills[i] = colorPrefix + ink(i / 20).toFixed(3) + ")";
    const fillFor = (a: number) =>
      fills[Math.round(Math.max(0, Math.min(1, a)) * 20)];

    const dot = (x: number, y: number, r: number, a: number) => {
      if (a <= 0.003) return;
      ctx.fillStyle = fillFor(a);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.fill();
    };

    const SPIN1 = 0.0038;
    const SPIN2 = 0.0027;
    const breath = (tt: number) => Math.sin((tt / 1500) * TWO_PI) * 0.35;

    if (reduced) {
      if (done) {
        dot(cx, cy, 1.9, 0.95);
        return;
      }
      const rx = 5.4;
      const ry = 3.1;
      dot(cx + Math.cos(0) * rx, cy - Math.sin(0) * ry, 0.9, 0.4);
      dot(cx + Math.cos(1.1) * rx, cy - Math.sin(1.1) * ry, 0.9, 0.95);
      dot(cx, cy, 0.85, 0.75);
      return;
    }

    if (done) {
      dot(cx, cy, 1.9, 0.95);
      return;
    }

    const rx = 5.4 + breath(t);
    const ry = 3.1 + breath(t) * 0.5;
    const a1 = t * SPIN1;
    const a2 = -t * SPIN2 + 1.1;
    const s1 = {
      x: cx + Math.cos(a1) * rx,
      y: cy - Math.sin(a1) * ry,
      back: Math.sin(a1) < 0,
    };
    const s2 = {
      x: cx + Math.cos(a2) * rx,
      y: cy - Math.sin(a2) * ry,
      back: Math.sin(a2) < 0,
    };
    const sats = [s1, s2].sort((a, b) => Number(a.back) - Number(b.back));

    for (const s of sats) {
      dot(s.x, s.y, s.back ? 0.7 : 0.9, s.back ? 0.4 : 0.95);
    }
    dot(cx, cy, 0.85 + breath(t) * 0.2, 0.75);
  };

  const { canvasRef } = useOrbAnimation({
    size,
    speed: 1,
    paused: false,
    color,
    render,
  });

  return (
    <CanvasContainer
      ref={canvasRef}
      width={size}
      height={size}
      ariaLabel={ariaLabel}
      className={className}
      style={style}
    />
  );
}
