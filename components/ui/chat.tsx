"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MiniOrb } from "@/components/ui/tool-chips";
import { drawGlobe, GLOBE_POINTS } from "@/components/ui/task-rows";
import { StageLock } from "@/components/ui/stage-lock";
import { useOrbInk } from "@/hooks/use-orb-ink";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const LEAD_MS = 400;
const GAP_MS = 450;
const HOLD_MS = 1300;
const DRAIN_MS = 180;
const CHAR_MS = 18;
const TYPE_MIN_MS = 350;
const TYPE_MAX_MS = 1400;
const PULSE_MS = 420;
const THINK_MS = 900;
const TOOL_MS = 1200;
const WORD_MS = 85;
const DONE_HOLD_MS = 550;
const ORB_SIZE = 20;
const GLOBE_R = 4.1;
const TILT = 0.35;
const IGNITE_MS = 220;
const SETTLE_MS = 240;
const TWO_PI = Math.PI * 2;

interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  tools?: string[];
}

interface ChatProps {
  turns: ChatTurn[];
  loop?: boolean;
  className?: string;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function typeMs(text: string): number {
  return Math.min(TYPE_MAX_MS, Math.max(TYPE_MIN_MS, text.length * CHAR_MS));
}

function streamMs(text: string): number {
  return Math.max(700, text.split(" ").length * WORD_MS);
}

function turnSpan(turn: ChatTurn): number {
  if (turn.role === "user") return typeMs(turn.text) + PULSE_MS;
  const toolWindow = turn.tools != null && turn.tools.length > 0 ? TOOL_MS : 0;
  return THINK_MS + toolWindow + streamMs(turn.text) + DONE_HOLD_MS;
}

interface Dot {
  x: number;
  y: number;
  r: number;
  a: number;
}

function ChatOrb({
  mode,
  reduced,
}: {
  mode: "think" | "settled";
  reduced: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { color, ink } = useOrbInk();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(ORB_SIZE * dpr);
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = ORB_SIZE / 2;
    const cy = ORB_SIZE / 2;

    const dot = (x: number, y: number, r: number, a: number) => {
      ctx.globalAlpha = ink(a);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.fill();
    };

    const breath = (t: number) => Math.sin((t / 1600) * TWO_PI) * 0.3;

    const drawThink = (t: number) => {
      ctx.clearRect(0, 0, ORB_SIZE, ORB_SIZE);
      const k = easeOutCubic(clamp01(t / IGNITE_MS));
      const dots: Dot[] = [];
      const cosX = Math.cos(TILT);
      const sinX = Math.sin(TILT);
      const spin = t * 0.0006;
      const cosY = Math.cos(spin);
      const sinY = Math.sin(spin);
      const spread = lerp(1.8, 1, k);
      const radius = GLOBE_R + breath(t);
      for (const p of GLOBE_POINTS) {
        const x = p.x * radius;
        const y = p.y * radius;
        const z = p.z * radius;
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        dots.push({
          x: cx + x1 * spread,
          y: cy - y2 * spread,
          r: 0.55,
          a: k * 0.9 * (z2 > 0 ? 0.35 : 1),
        });
      }
      for (const d of dots) {
        ctx.globalAlpha = ink(d.a);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, TWO_PI);
        ctx.fill();
      }
    };

    const drawSettled = (t: number) => {
      ctx.clearRect(0, 0, ORB_SIZE, ORB_SIZE);
      const q = easeOutCubic(clamp01(t / SETTLE_MS));
      drawGlobe(ctx, color, {
        cx,
        cy,
        radius: GLOBE_R,
        spin: 0.6,
        spread: lerp(1, 0.12, q),
        alpha: ink((1 - q) * 0.9),
      });
      dot(cx, cy, lerp(0.9, 2, q), lerp(0.75, 0.95, q));
      return q >= 1;
    };

    if (reduced) {
      if (mode === "think") drawThink(IGNITE_MS + 10);
      else drawSettled(SETTLE_MS + 10);
      return;
    }

    let raf = 0;
    let start = 0;
    const frame = (now: number) => {
      if (start === 0) start = now;
      const t = now - start;
      if (mode === "think") {
        drawThink(t);
        raf = requestAnimationFrame(frame);
        return;
      }
      if (drawSettled(t)) return;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [mode, reduced, color, ink]);

  return (
    <canvas
      ref={ref}
      width={ORB_SIZE}
      height={ORB_SIZE}
      aria-hidden="true"
      className="size-5 shrink-0"
    />
  );
}

function UserTurn({
  text,
  reduced,
  active,
}: {
  text: string;
  reduced: boolean;
  active: boolean;
}) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);
  const [sent, setSent] = useState(false);
  const total = typeMs(text);

  useEffect(() => {
    if (!active) return;
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      if (textRef.current) textRef.current.textContent = text;
      setSent(true);
      return;
    }
    let raf = 0;
    let start = 0;
    const frame = (now: number) => {
      if (start === 0) start = now;
      const t = now - start;
      const n = Math.min(text.length, Math.floor((t / total) * text.length));
      if (textRef.current) textRef.current.textContent = text.slice(0, n);
      if (t >= total) {
        setSent(true);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [text, total, reduced, active]);

  return (
    <div
      className={cn(
        "flex justify-end transition-all duration-300 ease-out",
        mounted ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
      )}
    >
      <div className="relative w-fit max-w-[85%]">
        {sent && (
          <span
            aria-hidden="true"
            className="animate-pulse-ring absolute inset-0 rounded-xl border border-fg"
          />
        )}
        <div
          className={cn(
            "rounded-xl border px-3.5 py-2 font-mono text-xs transition-colors duration-300",
            sent
              ? "border-strong bg-inset text-fg"
              : "border-transparent bg-transparent text-fg-muted",
          )}
        >
          <span ref={textRef} />
          {!sent && (
            <span
              aria-hidden="true"
              className="animate-caret ml-1 inline-block size-1.5 rounded-full bg-fg align-middle"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AssistantTurn({
  text,
  tools,
  reduced,
  active,
}: {
  text: string;
  tools?: string[];
  reduced: boolean;
  active: boolean;
}) {
  const words = useMemo(() => text.split(" "), [text]);
  const streamTotal = streamMs(text);
  const hasTools = tools != null && tools.length > 0;
  const streamStart = THINK_MS + (hasTools ? TOOL_MS : 0);
  const [phase, setPhase] = useState<"think" | "tool" | "stream">("think");
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setPhase("stream");
      setWordCount(words.length);
      return;
    }
    let raf = 0;
    let start = 0;
    const frame = (now: number) => {
      if (start === 0) start = now;
      const t = now - start;
      if (t < streamStart) {
        const p = t < THINK_MS ? "think" : "tool";
        setPhase((prev) => (prev === p ? prev : p));
        raf = requestAnimationFrame(frame);
        return;
      }
      setPhase((prev) => (prev === "stream" ? prev : "stream"));
      const n = Math.min(
        words.length,
        Math.floor(((t - streamStart) / streamTotal) * words.length),
      );
      setWordCount((prev) => (prev === n ? prev : n));
      if (n >= words.length) return;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced, words, streamTotal, streamStart]);

  const showTools = hasTools && (reduced || phase !== "think");

  return (
    <div
      className={cn(
        "flex gap-3 transition-all duration-300 ease-out",
        active ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
      )}
    >
      {active ? (
        <ChatOrb
          mode={phase === "stream" ? "settled" : "think"}
          reduced={reduced}
        />
      ) : (
        <span aria-hidden="true" className="size-5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        {hasTools && (
          <div
            className={cn(
              "mb-2 flex flex-col gap-1.5 transition-all duration-300 ease-out",
              showTools
                ? "translate-y-0 opacity-100"
                : "-translate-y-1 opacity-0",
            )}
          >
            {tools.map((tool) => (
              <div
                key={tool}
                className="flex w-fit items-center gap-2 rounded-lg border border-muted px-2 py-1"
              >
                {showTools ? (
                  <MiniOrb done={reduced || phase === "stream"} />
                ) : (
                  <span aria-hidden="true" className="size-4" />
                )}
                <span className="font-mono text-[10px] text-fg-muted">
                  {tool}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="font-mono text-xs leading-relaxed text-fg">
          {words.slice(0, wordCount).map((word, i) => (
            <span
              key={i}
              className="mr-1 inline-block translate-y-0 opacity-100 transition-all duration-200 ease-out"
            >
              {word}
            </span>
          ))}
          {active && phase === "stream" && wordCount < words.length && (
            <span
              aria-hidden="true"
              className="animate-caret inline-block size-1.5 rounded-full bg-fg align-middle"
            />
          )}
        </p>
      </div>
    </div>
  );
}

export function Chat({ turns, loop = false, className }: ChatProps) {
  const [elapsed, setElapsed] = useState(0);
  const [announce, setAnnounce] = useState("");
  const reduced = useReducedMotion();
  const [cycle, setCycle] = useState(0);
  const [draining, setDraining] = useState(false);

  const { starts, total } = useMemo(() => {
    const s: number[] = [];
    let t = LEAD_MS;
    for (const turn of turns) {
      s.push(t);
      t += turnSpan(turn) + GAP_MS;
    }
    return { starts: s, total: turns.length > 0 ? t - GAP_MS : 0 };
  }, [turns]);

  useEffect(() => {
    if (reduced || turns.length === 0) return;

    let raf = 0;
    let start = 0;
    let prev = "";
    let drainStart = 0;
    const allVisible = turns.map(() => "1").join("");
    const frame = (now: number) => {
      if (start === 0) start = now;
      let t = now - start;
      if (drainStart > 0) {
        if (now - drainStart < DRAIN_MS) {
          raf = requestAnimationFrame(frame);
          return;
        }
        drainStart = 0;
        setDraining(false);
        setCycle((c) => c + 1);
        start = now;
        t = 0;
      } else if (loop && t >= total + HOLD_MS) {
        drainStart = now;
        setDraining(true);
      }
      const snap = turns.map((_, i) => (t >= starts[i] ? "1" : "0")).join("");
      if (snap !== prev) {
        const oldSnap = prev;
        prev = snap;
        setElapsed(t);
        const events: string[] = [];
        for (let i = 0; i < snap.length; i++) {
          if (snap[i] === oldSnap[i]) continue;
          const turn = turns[i];
          events.push(
            `${turn.role === "user" ? "You asked" : "Assistant replied"}: ${turn.text}`,
          );
        }
        if (events.length > 0) setAnnounce(events.join(", "));
      }
      if (!loop && snap === allVisible) return;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [turns, loop, reduced, starts, total]);

  useEffect(() => {
    if (reduced) {
      setAnnounce(
        turns
          .map(
            (turn) =>
              `${turn.role === "user" ? "You asked" : "Assistant replied"}: ${turn.text}`,
          )
          .join(", "),
      );
    }
  }, [reduced, turns]);

  if (turns.length === 0) return null;

  return (
    <>
      <StageLock className={className}>
        <div
          key={cycle}
          aria-hidden="true"
          className={cn(
            "flex flex-col gap-4 transition-opacity duration-150",
            draining && "opacity-0",
          )}
        >
          {turns.map((turn, i) => {
            const active = reduced || elapsed >= starts[i];
            return turn.role === "user" ? (
              <UserTurn
                key={i}
                text={turn.text}
                reduced={reduced}
                active={active}
              />
            ) : (
              <AssistantTurn
                key={i}
                text={turn.text}
                tools={turn.tools}
                reduced={reduced}
                active={active}
              />
            );
          })}
        </div>
      </StageLock>
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </>
  );
}

const DEMO_TURNS: ChatTurn[] = [
  { role: "user", text: "why is my build failing?" },
  {
    role: "assistant",
    text: "Your .next cache is stale — the manifest points at chunks that no longer exist.",
    tools: ["read_file"],
  },
  { role: "user", text: "fix it" },
  {
    role: "assistant",
    text: "Deleted the cache. Rerunning now — should pass clean.",
  },
];

export function DemoChat() {
  const [key, setKey] = useState(0);
  const widget = (
    <div className="border-strong w-full max-w-lg rounded-xl border bg-elevated p-5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
        Chat
      </span>
      <Chat key={key} turns={DEMO_TURNS} loop className="mt-4" />
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {widget}
      <button
        type="button"
        onClick={() => setKey((k) => k + 1)}
        className="font-mono text-[10px] uppercase tracking-widest text-fg-subtle transition-colors hover:text-fg"
      >
        Reset
      </button>
    </div>
  );
}
