"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Pause, Play, RotateCcw } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { primitives } from "@/lib/primitives";
import {
  CloningOrb,
  FetchingOrb,
  PullingOrb,
  PushingOrb,
  MergingOrb,
  RebasingOrb,
  StashingOrb,
  SyncOrb,
  CubeOrb,
  ScanOrb,
  DownloadOrb,
  ErrorOrb,
  ProgressOrb,
  DnaOrb,
  VerifyOrb,
  GraphOrb,
  StreamingText,
} from "@ai-primitives-ui/ui";
import { orbSizes } from "@ai-primitives-ui/ui";

function CapOrb(id: string) {
  const m: Record<string, string> = {
    cloning: "CloningOrb",
    sync: "SyncOrb",
    fetching: "FetchingOrb",
    pulling: "PullingOrb",
    pushing: "PushingOrb",
    merging: "MergingOrb",
    rebasing: "RebasingOrb",
    stashing: "StashingOrb",
    thinking: "CubeOrb",
    scan: "ScanOrb",
    download: "DownloadOrb",
    failed: "ErrorOrb",
    progress: "ProgressOrb",
    dna: "DnaOrb",
    verify: "VerifyOrb",
    graph: "GraphOrb",
  };
  return m[id] ?? id;
}

const ORB_IDS = new Set([
  "cloning",
  "sync",
  "fetching",
  "pulling",
  "pushing",
  "merging",
  "rebasing",
  "stashing",
  "thinking",
  "scan",
  "download",
  "failed",
  "progress",
  "dna",
  "verify",
  "graph",
]);

const ORB_MAP: Record<string, React.ComponentType<any>> = {
  cloning: CloningOrb,
  sync: SyncOrb,
  fetching: FetchingOrb,
  pulling: PullingOrb,
  pushing: PushingOrb,
  merging: MergingOrb,
  rebasing: RebasingOrb,
  stashing: StashingOrb,
  thinking: CubeOrb,
  scan: ScanOrb,
  download: DownloadOrb,
  failed: ErrorOrb,
  progress: ProgressOrb,
  dna: DnaOrb,
  verify: VerifyOrb,
  graph: GraphOrb,
};

const SIZE_PRESETS = [
  { label: "xs", value: orbSizes.xs },
  { label: "sm", value: orbSizes.sm },
  { label: "md", value: orbSizes.md },
  { label: "lg", value: orbSizes.lg },
  { label: "xl", value: orbSizes.xl },
] as const;

function PlaygroundStreaming() {
  const [text, setText] = useState(
    "Every thought gathers, turns, and settles.",
  );
  const [key, setKey] = useState(0);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="bg-elevated rounded-xl border p-5">
        <StreamingText key={key} text={text} size={320} loop={false} />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="focus:border-strong border-muted bg-background text-fg w-full rounded-lg border p-3 font-mono text-xs focus:outline-none"
        placeholder="Type to stream..."
      />
      <button
        type="button"
        onClick={() => setKey((k) => k + 1)}
        className="hover:border-strong border-muted text-fg-muted hover:text-fg inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 font-mono text-xs"
      >
        <RotateCcw className="size-3" /> Replay stream
      </button>
    </div>
  );
}

const EXTRA_LIVE: Record<string, React.ComponentType> = {
  "streaming-text": PlaygroundStreaming,
};

export function DemoPlayground() {
  const ready = primitives.filter((p) => p.status === "ready");
  const [state, setState] = useState<string>(ready[0]?.id ?? "cloning");
  const [size, setSize] = useState<number>(orbSizes.xl);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const applyOrbFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const hashMatch = window.location.hash.match(/^#playground-([\w-]+)/);
      const id = params.get("orb") ?? hashMatch?.[1];
      if (id && primitives.some((p) => p.id === id && p.status === "ready"))
        setState(id);
    };
    applyOrbFromUrl();
    window.addEventListener("hashchange", applyOrbFromUrl);
    return () => window.removeEventListener("hashchange", applyOrbFromUrl);
  }, []);

  const isOrb = ORB_IDS.has(state);
  const OrbComp = ORB_MAP[state];
  const ExtraComp = EXTRA_LIVE[state];

  const code = useMemo(() => {
    if (isOrb) {
      const name = CapOrb(state);
      const props = [
        `size={${size}}`,
        speed !== 1 ? `speed={${speed}}` : "",
        paused ? "paused" : "",
        `aria-label="${CapOrb(state).replace("Orb", "")}"`,
      ]
        .filter(Boolean)
        .join(" ");
      return `import { ${name} } from "@ai-primitives-ui/ui";\n\n<${name} ${props} />`;
    }
    return `import { StreamingText } from "@ai-primitives-ui/ui";\n\n<StreamingText />`;
  }, [state, size, speed, paused, isOrb]);

  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section id="playground" className="border-muted border-t py-24">
      <Container>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-medium">Playground</h2>
          <p className="text-fg-subtle font-mono text-xs">
            {ready.length} ready · test, don&apos;t just look
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {ready.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setState(p.id);
                const url = new URL(window.location.href);
                url.searchParams.set("orb", p.id);
                url.hash = "playground";
                window.history.replaceState(null, "", url.toString());
              }}
              className={cn(
                "rounded-full px-4 py-1.5 font-mono text-xs capitalize transition-colors",
                state === p.id
                  ? "bg-fg text-bg-base"
                  : "hover:border-strong border-muted text-fg-muted hover:text-fg border",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-elevated flex min-h-[380px] flex-col items-center justify-center gap-6 rounded-xl border p-8">
            <div
              className={cn(
                "border-muted bg-background grid place-items-center rounded-xl border border-dashed p-6",
                !isOrb && "w-full max-w-[520px] p-4",
                isOrb && "p-10",
              )}
            >
              {isOrb && OrbComp ? (
                <OrbComp
                  size={size}
                  speed={speed}
                  paused={paused}
                  aria-label={CapOrb(state).replace("Orb", "")}
                />
              ) : ExtraComp ? (
                <ExtraComp />
              ) : null}
            </div>
            <div className="text-fg-subtle flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
              <span className="border-muted rounded-full border px-2.5 py-1 capitalize">
                {state}
              </span>
              {isOrb && (
                <>
                  <span className="border-muted rounded-full border px-2.5 py-1">
                    {size}px
                  </span>
                  <span className="border-muted rounded-full border px-2.5 py-1">
                    {speed.toFixed(1)}×
                  </span>
                  {paused && (
                    <span className="bg-fg text-bg-base rounded-full px-2.5 py-1">
                      paused
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {isOrb ? (
              <div className="bg-elevated rounded-xl border p-5">
                <div className="flex items-center justify-between">
                  <span className="text-fg font-mono text-xs font-medium">
                    Size
                  </span>
                  <span className="text-fg-subtle font-mono text-xs">
                    {size}px
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SIZE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setSize(p.value)}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 font-mono text-xs transition-colors",
                        size === p.value
                          ? "bg-fg text-bg-base"
                          : "hover:border-strong border-muted text-fg-muted hover:text-fg border",
                      )}
                    >
                      {p.label} · {p.value}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-fg font-mono text-xs font-medium">
                    Speed
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaused((v) => !v)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs transition-colors",
                      paused
                        ? "border-fg bg-fg text-bg-base"
                        : "hover:border-strong border-muted text-fg-muted hover:text-fg",
                    )}
                  >
                    {paused ? (
                      <Play className="size-3" />
                    ) : (
                      <Pause className="size-3" />
                    )}
                    {paused ? "Play" : "Pause"}
                  </button>
                </div>
                <label className="mt-3 flex items-center gap-3">
                  <input
                    type="range"
                    min={0.25}
                    max={2}
                    step={0.05}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="accent-fg h-1 w-full"
                  />
                  <span className="text-fg-muted w-12 text-right font-mono text-xs">
                    {speed.toFixed(2)}×
                  </span>
                </label>
              </div>
            ) : (
              <div className="bg-elevated rounded-xl border p-5">
                <p className="text-fg-subtle font-mono text-xs leading-relaxed">
                  Test it · edit the content below, hit the controls. Orbs use{" "}
                  <code className="doc-code">size / speed / paused</code>, these
                  use their own props.
                </p>
              </div>
            )}

            <div className="bg-elevated overflow-hidden rounded-xl border">
              <div className="border-muted bg-inset flex items-center justify-between border-b px-4 py-2">
                <span className="text-fg-subtle font-mono text-xs">Code</span>
                <button
                  type="button"
                  onClick={onCopy}
                  className="hover:border-strong border-muted text-fg-muted hover:text-fg inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs transition-colors"
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="text-fg overflow-x-auto p-4 font-mono text-xs leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
