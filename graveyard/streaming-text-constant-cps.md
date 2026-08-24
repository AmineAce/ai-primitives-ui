# StreamingText — constant-cps reveal (backup)

Archived 2026-08-19. Replaced by the eased-pacing version (reveal rate decelerates
toward the end instead of the constant 35 cps metronome). This file is the exact
`packages/orbs/src/streaming/StreamingText.tsx` before that change, verbatim.

The only behavioral difference vs. the current build: `revealed` was computed
linearly — `clamp(Math.floor(t * CPS), 0, text.length)` — and there was no
`orb` prop.

```tsx
"use client";

import { CanvasContainer } from "../canvas/CanvasContainer";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import { easeInOutSine } from "../canvas/easing";
import { makeSphereDots, project } from "../canvas/sphere";
import { clamp } from "../lib/math";

export interface StreamingTextProps {
  text?: string;
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  align?: "left" | "center" | "right";
  loop?: boolean;
  "aria-label"?: string;
}

const DEFAULT_TEXT =
  "Every thought gathers, turns, and settles into a clear answer.";

const HOLD = 1.4;
const FADE = 0.7;
const CPS = 35;
const ORB_DOTS = 7;
const ORB_RATIO = 0.5;
const DOT_RATIO = 0.28;
const PAD = 16;
const FONT_RATIO = 0.0535;
const LINE_RATIO = 1.35;

function wrapLines(
  source: string,
  ctx: CanvasRenderingContext2D,
  maxWidth: number,
): string[] {
  const words = source.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (!line || ctx.measureText(next).width <= maxWidth) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function StreamingText({
  text = DEFAULT_TEXT,
  size = 320,
  speed = 1,
  paused = false,
  color,
  align = "left",
  loop = false,
  "aria-label": ariaLabel,
}: StreamingTextProps) {
  const height = Math.max(40, Math.round(size * 0.3));
  const font = Math.max(12, Math.round(size * FONT_RATIO));
  const lineH = font * LINE_RATIO;
  const textW = size - PAD * 2;
  const streamTime = text.length / CPS;
  const loopTotal = streamTime + HOLD + FADE;
  const orbShape = makeSphereDots(ORB_DOTS, 1);

  const render = (
    ctx: CanvasRenderingContext2D,
    elapsed: number,
    reduced: boolean,
    colorPrefix: string,
  ) => {
    ctx.clearRect(0, 0, size, height);
    ctx.font = `${font}px "JetBrains Mono", ui-monospace, Menlo, monospace`;
    ctx.textBaseline = "alphabetic";

    const t = reduced ? streamTime : loop ? elapsed % loopTotal : elapsed;

    let revealed: number;
    let alphaText = 1;
    let spin = 0;
    let breath = 1;

    if (reduced) {
      revealed = text.length;
    } else if (t < streamTime) {
      revealed = clamp(Math.floor(t * CPS), 0, text.length);
      spin = elapsed * 0.8;
      breath = 1 + 0.04 * Math.sin(elapsed * ((2 * Math.PI) / 2.4));
    } else if (!loop) {
      revealed = text.length;
      spin = elapsed * 0.5;
      breath = 1 + 0.08 * Math.sin(elapsed * ((2 * Math.PI) / 6));
    } else if (t < streamTime + HOLD) {
      revealed = text.length;
      spin = elapsed * 0.5;
      breath = 1 + 0.08 * Math.sin(elapsed * ((2 * Math.PI) / 6));
    } else {
      const fp = clamp((t - (streamTime + HOLD)) / FADE, 0, 1);
      alphaText = 1 - easeInOutSine(fp);
      revealed = text.length;
      spin = elapsed * 0.8;
      breath = 1 + 0.06 * Math.sin(elapsed * ((2 * Math.PI) / 3));
    }

    const finalLines = wrapLines(text, ctx, textW);
    const startY = (height - finalLines.length * lineH) / 2 + font;
    const lines = wrapLines(text.slice(0, revealed), ctx, textW);

    ctx.fillStyle = colorPrefix + (alphaText * 0.95).toFixed(3) + ")";
    for (let i = 0; i < lines.length; i++) {
      const lw = ctx.measureText(lines[i]).width;
      let x = PAD;
      if (align === "center") x = PAD + (textW - lw) / 2;
      else if (align === "right") x = PAD + textW - lw;
      ctx.fillText(lines[i], x, startY + i * lineH);
    }

    const last = lines[lines.length - 1] ?? "";
    const lw = ctx.measureText(last).width;
    let cx = PAD + lw;
    if (align === "center") cx = PAD + (textW + lw) / 2;
    else if (align === "right") cx = PAD + textW;
    const baseline = startY + (lines.length - 1) * lineH;

    const orbAlpha = alphaText;
    if (orbAlpha > 0.004 && revealed > 0) {
      const orbR = Math.max(4, font * ORB_RATIO);
      const orbY = baseline - font * 0.35;
      const cs = Math.cos(spin);
      const sn = Math.sin(spin);
      for (let i = 0; i < orbShape.length; i++) {
        const d = orbShape[i];
        const r = orbR * breath;
        const x3 = (d.x * cs - d.z * sn) * r;
        const y3 = d.y * r;
        const z3 = (d.x * sn + d.z * cs) * r;
        const p = project(
          { x: x3, y: y3, z: z3 },
          cx + orbR + font * 0.45,
          orbY,
          0,
          0.25,
        );
        const alpha = orbAlpha * (z3 > 0 ? 0.35 : 1);
        ctx.fillStyle = colorPrefix + alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(
          p.x,
          p.y,
          Math.max(1, orbR * DOT_RATIO) * p.scale,
          0,
          2 * Math.PI,
        );
        ctx.fill();
      }
    }
  };

  const { canvasRef } = useOrbAnimation({
    size,
    height,
    speed,
    paused,
    color,
    render,
  });

  return (
    <CanvasContainer
      ref={canvasRef}
      width={size}
      height={height}
      ariaLabel={ariaLabel ?? text}
    />
  );
}
```

**Restore:** copy this over `packages/orbs/src/streaming/StreamingText.tsx`, drop the
`orb` prop from the interface/destructure and its gate, then `pnpm check`.
