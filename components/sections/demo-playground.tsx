"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Pause, Play, RotateCcw, Send } from "lucide-react";
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
  StreamingText,
} from "@ai-primitives/ui";
import { orbSizes } from "@ai-primitives/ui";
import { ApprovalCard } from "@/components/ui/approval-card";
import { ToolChips } from "@/components/ui/tool-chips";
import { TaskRows } from "@/components/ui/task-rows";
import { Chat } from "@/components/ui/chat";
import { DemoRecommendationCard } from "@/components/ui/recommendation-card";
import { DemoContextCards } from "@/components/ui/context-cards";
import { DemoDiffTable } from "@/components/ui/diff-table";

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
      <div className="rounded-xl border bg-elevated p-5">
        <StreamingText key={key} text={text} size={320} loop={false} />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="focus:border-strong w-full rounded-lg border border-muted bg-background p-3 font-mono text-xs text-fg focus:outline-none"
        placeholder="Type to stream..."
      />
      <button
        type="button"
        onClick={() => setKey((k) => k + 1)}
        className="hover:border-strong inline-flex items-center gap-1.5 self-start rounded-full border border-muted px-3 py-1 font-mono text-xs text-fg-muted hover:text-fg"
      >
        <RotateCcw className="size-3" /> Replay stream
      </button>
    </div>
  );
}

function PlaygroundApproval() {
  const [risk, setRisk] = useState<"low" | "high">("high");
  const [k, setK] = useState(0);
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ApprovalCard
        key={k}
        command="rm -rf .next/cache"
        risk={risk}
        description="Deletes the stale build cache. This cannot be undone."
      />
      <div className="flex gap-1">
        {(["low", "high"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRisk(r)}
            className={cn(
              "rounded-full px-3 py-1 font-mono text-xs capitalize",
              risk === r
                ? "bg-fg text-bg-base"
                : "border border-muted text-fg-muted hover:text-fg",
            )}
          >
            {r} risk
          </button>
        ))}
        <button
          type="button"
          onClick={() => setK((v) => v + 1)}
          className="ml-auto font-mono text-xs text-fg-subtle hover:text-fg"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

const DEFAULT_TOOLS = ["read_file", "search", "write_file"];

function PlaygroundToolChips() {
  const [tools, setTools] = useState(DEFAULT_TOOLS);
  const [input, setInput] = useState("");
  const [k, setK] = useState(0);
  const script = tools.map((label) => ({ label, duration: 1100 }));
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="rounded-xl border bg-elevated p-5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
          Tools
        </span>
        <ToolChips script={script} className="mt-4" />
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              setTools((t) => [...t, input.trim()]);
              setInput("");
              setK((v) => v + 1);
            }
          }}
          placeholder="add tool + Enter"
          className="focus:border-strong flex-1 rounded-lg border border-muted bg-background p-2 font-mono text-xs text-fg focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={() => {
          setTools(DEFAULT_TOOLS);
          setK((v) => v + 1);
        }}
        className="self-start font-mono text-xs text-fg-subtle hover:text-fg"
      >
        Reset to default tools
      </button>
    </div>
  );
}

const DEFAULT_ROWS = [
  { id: "a", label: "scan_repo", duration: 1200 },
  { id: "b", label: "map_deps", duration: 1700 },
  { id: "c", label: "plan_edit", duration: 1500 },
];

function PlaygroundTaskRows() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [k, setK] = useState(0);
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="rounded-xl border bg-elevated p-5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
          Tasks
        </span>
        <TaskRows key={k} rows={rows} className="mt-4" />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            setRows((r) => [
              ...r,
              {
                id: `${Date.now()}`,
                label: `step_${r.length + 1}`,
                duration: 1200,
              },
            ])
          }
          className="rounded-full border border-muted px-3 py-1 font-mono text-xs text-fg-muted hover:text-fg"
        >
          + Add step
        </button>
        <button
          type="button"
          onClick={() => {
            setRows(DEFAULT_ROWS);
            setK((v) => v + 1);
          }}
          className="rounded-full border border-muted px-3 py-1 font-mono text-xs text-fg-muted hover:text-fg"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

const DEFAULT_TURNS: {
  role: "user" | "assistant";
  text: string;
  tools?: string[];
}[] = [
  { role: "user", text: "why is my build failing?" },
  {
    role: "assistant",
    text: "Your .next cache is stale.",
    tools: ["read_file"],
  },
];

function PlaygroundChat() {
  const [turns, setTurns] = useState(DEFAULT_TURNS);
  const [input, setInput] = useState("");
  const [used, setUsed] = useState(false);
  const add = () => {
    if (!input.trim() || used) return;
    setTurns((t) => [
      ...t,
      { role: "user" as const, text: input.trim() },
      {
        role: "assistant" as const,
        text: "Nice, you tried it. This is only a test — the real component streams any conversation.",
      },
    ]);
    setInput("");
    setUsed(true);
  };
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="max-h-[420px] overflow-y-auto rounded-xl border bg-elevated p-5">
        <Chat turns={turns} />
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={
            used ? "Test used — reset to try again" : "Type a message + Enter"
          }
          disabled={used}
          className="focus:border-strong flex-1 rounded-lg border border-muted bg-background p-2.5 font-mono text-xs text-fg focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={add}
          disabled={used}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-4 py-2 font-mono text-xs transition-colors",
            used
              ? "cursor-not-allowed border border-muted bg-transparent text-fg-subtle opacity-50"
              : "bg-fg text-bg-base",
          )}
        >
          <Send className="size-3" /> Send
        </button>
        {used && (
          <button
            type="button"
            onClick={() => {
              setTurns(DEFAULT_TURNS);
              setUsed(false);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-muted px-3 py-2 font-mono text-xs text-fg-muted transition-colors hover:text-fg"
          >
            <RotateCcw className="size-3" /> Reset
          </button>
        )}
      </div>
    </div>
  );
}

const EXTRA_LIVE: Record<string, React.ComponentType> = {
  "streaming-text": PlaygroundStreaming,
  "approval-card": PlaygroundApproval,
  "tool-chips": PlaygroundToolChips,
  "task-rows": PlaygroundTaskRows,
  chat: PlaygroundChat,
};

const STATIC_DEMOS: Record<string, React.ComponentType> = {
  "recommendation-card": DemoRecommendationCard,
  "context-cards": DemoContextCards,
  "diff-table": DemoDiffTable,
};

export function DemoPlayground() {
  const ready = primitives.filter((p) => p.status === "ready");
  const [state, setState] = useState<string>(ready[0]?.id ?? "cloning");
  const [size, setSize] = useState<number>(orbSizes.xl);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOrb = ORB_IDS.has(state);
  const OrbComp = ORB_MAP[state];
  const ExtraComp = EXTRA_LIVE[state] ?? STATIC_DEMOS[state];

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
      return `import { ${name} } from "@ai-primitives/ui";\n\n<${name} ${props} />`;
    }
    const name = CapOrb(state);
    return `import { ${name} } from "@ai-primitives/ui";\n\n<${name} />`;
  }, [state, size, speed, paused, isOrb]);

  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="border-t border-muted py-24">
      <Container>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-medium">Playground</h2>
          <p className="font-mono text-xs text-fg-subtle">
            {ready.length} ready — test, don&apos;t just look
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {ready.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setState(p.id)}
              className={cn(
                "rounded-full px-4 py-1.5 font-mono text-xs capitalize transition-colors",
                state === p.id
                  ? "bg-fg text-bg-base"
                  : "hover:border-strong border border-muted text-fg-muted hover:text-fg",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex min-h-[380px] flex-col items-center justify-center gap-6 rounded-xl border bg-elevated p-8">
            <div
              className={cn(
                "grid place-items-center rounded-xl border border-dashed border-muted bg-background p-6",
                !isOrb && "w-full max-w-[520px] p-4",
                isOrb && "p-10",
              )}
            >
              {isOrb && OrbComp ? (
                <OrbComp
                  key={`${state}-${size}`}
                  size={size}
                  speed={speed}
                  paused={paused}
                  aria-label={CapOrb(state).replace("Orb", "")}
                />
              ) : ExtraComp ? (
                <ExtraComp />
              ) : (
                <div className="w-full">
                  {(() => {
                    const C = (EXTRA_LIVE[state] ?? (() => null)) as any;
                    return <C />;
                  })()}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-fg-subtle">
              <span className="rounded-full border border-muted px-2.5 py-1 capitalize">
                {state}
              </span>
              {isOrb && (
                <>
                  <span className="rounded-full border border-muted px-2.5 py-1">
                    {size}px
                  </span>
                  <span className="rounded-full border border-muted px-2.5 py-1">
                    {speed.toFixed(1)}×
                  </span>
                  {paused && (
                    <span className="rounded-full bg-fg px-2.5 py-1 text-bg-base">
                      paused
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {isOrb ? (
              <div className="rounded-xl border bg-elevated p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-fg">
                    Size
                  </span>
                  <span className="font-mono text-xs text-fg-subtle">
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
                          : "hover:border-strong border border-muted text-fg-muted hover:text-fg",
                      )}
                    >
                      {p.label} · {p.value}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-fg">
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
                    className="h-1 w-full accent-fg"
                  />
                  <span className="w-12 text-right font-mono text-xs text-fg-muted">
                    {speed.toFixed(2)}×
                  </span>
                </label>
              </div>
            ) : (
              <div className="rounded-xl border bg-elevated p-5">
                <p className="font-mono text-xs leading-relaxed text-fg-subtle">
                  Test it — edit the content below, hit the controls. Orbs use{" "}
                  <code className="doc-code">size / speed / paused</code>, these
                  use their own props.
                </p>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border bg-elevated">
              <div className="flex items-center justify-between border-b border-muted bg-inset px-4 py-2">
                <span className="font-mono text-xs text-fg-subtle">Code</span>
                <button
                  type="button"
                  onClick={onCopy}
                  className="hover:border-strong inline-flex items-center gap-1.5 rounded-md border border-muted px-2.5 py-1 font-mono text-xs text-fg-muted transition-colors hover:text-fg"
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-fg">
                <code>{code}</code>
              </pre>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
