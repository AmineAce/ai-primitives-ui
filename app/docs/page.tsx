import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Pre } from "@/components/ui/pre";
import { primitives } from "@/lib/primitives";

const INSTALL_CMD = `npm install @ai-primitives/ui
# pnpm
pnpm add @ai-primitives/ui`;

const IMPORT_EXAMPLE = `import { CloningOrb } from "@ai-primitives/ui";`;

const USAGE_EXAMPLE = `import { CloningOrb } from "@ai-primitives/ui";

export function CloningIndicator() {
  return (
    <CloningOrb size={160} speed={1} aria-label="Cloning repository" />
  );
}`;

const ACCESSIBILITY_EXAMPLE = `<PushingOrb size={64} aria-label="Pushing changes" />`;

const THEME_EXAMPLE = `/* 1 auto system — matchMedia + inline script before hydration */
matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"

/* 2 global — every orb follows --orb-fg */
:root { --orb-fg: var(--fg-default); }

/* 3 per instance — prop wins, alpha ignored */
<CloningOrb color="#e6edf3" />
import { orbSizes } from "@ai-primitives/ui";
<SyncOrb size={orbSizes.xl} />`;

const PROPS = [
  {
    name: "size",
    type: "number",
    defaultValue: "64",
    description: "The width and height of the canvas, in pixels.",
  },
  {
    name: "speed",
    type: "number",
    defaultValue: "1",
    description: "Animation speed multiplier. Lower is slower.",
  },
  {
    name: "paused",
    type: "boolean",
    defaultValue: "false",
    description: "Freezes the animation at its current phase.",
  },
  {
    name: "color",
    type: "string",
    defaultValue: "--orb-fg",
    description:
      "Overrides `--orb-fg`. Falls back to the neutral default when unset.",
  },
  {
    name: "aria-label",
    type: "string",
    defaultValue: "undefined",
    description:
      "Accessible label describing the operation. Omit to render decoratively.",
  },
];

const STREAMING_PROPS = [
  {
    name: "text",
    type: "string",
    defaultValue: `"Every thought gathers..."`,
    description: "Text to stream token by token.",
  },
  {
    name: "size",
    type: "number",
    defaultValue: "320",
    description: "Canvas width; height is 30% of it.",
  },
  {
    name: "loop",
    type: "boolean",
    defaultValue: "false",
    description: "Loops stream → hold → fade when true.",
  },
];

const DIFF_PROPS = [
  {
    name: "file",
    type: "string",
    defaultValue: "undefined",
    description: "File path shown in the header.",
  },
  {
    name: "lines",
    type: "DiffLine[]",
    defaultValue: "[]",
    description: "Array of {type, oldNo, newNo, content}.",
  },
];

export default function DocsPage() {
  return (
    <article>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to AI Primitives
      </Link>

      <section id="getting-started" className="scroll-mt-28">
        <h1 className="mt-8 text-balance text-3xl font-semibold tracking-tight">
          AI Primitives
        </h1>
        <p className="doc-lead">
          AI Primitives is a dependency-free library of monochrome UI primitives
          for AI-native interfaces — loading states, thinking traces, streaming
          text, approval cards, tool chips, and more. Motion is drawn with the
          plain HTML5 Canvas 2D API: no WebGL, no SVG filters, no blur. Every
          primitive ships as a small, typed React component.
        </p>
      </section>

      <section id="installation" className="scroll-mt-28">
        <h2 className="doc-h2">Installation</h2>
        <p className="doc-p">
          Install the package with your package manager of choice. AI Primitives
          ships zero runtime dependencies.
        </p>
        <div className="mt-6 space-y-4">
          <Pre>{INSTALL_CMD}</Pre>
          <Pre>{IMPORT_EXAMPLE}</Pre>
        </div>
      </section>

      <section id="usage" className="scroll-mt-28">
        <h2 className="doc-h2">Usage</h2>
        <p className="doc-p">
          Every primitive is a focused, typed React component. The Loading State
          category ships as eight components today —{" "}
          <code className="doc-code">CloningOrb</code>,{" "}
          <code className="doc-code">SyncOrb</code>,{" "}
          <code className="doc-code">FetchingOrb</code>,{" "}
          <code className="doc-code">PullingOrb</code>,{" "}
          <code className="doc-code">PushingOrb</code>,{" "}
          <code className="doc-code">MergingOrb</code>,{" "}
          <code className="doc-code">RebasingOrb</code>, and{" "}
          <code className="doc-code">StashingOrb</code>. Render the one that
          matches the operation, and the library handles sizing and device pixel
          ratio for you.
        </p>
        <div className="mt-6">
          <Pre>{USAGE_EXAMPLE}</Pre>
        </div>
      </section>

      <section id="primitives" className="scroll-mt-28">
        <h2 className="doc-h2">Primitives — ready, More coming soon</h2>
        <p className="doc-p">
          Grouped by category. See the live showcase on the landing page for
          animated previews.
        </p>
        {(() => {
          const groups: Record<string, typeof primitives> = {};
          for (const p of primitives) {
            const key =
              p.category === "Loading State"
                ? "Loading State — 8 orbs"
                : p.category === "Thinking"
                  ? "Thinking — 2"
                  : p.category === "More"
                    ? "More"
                    : "Streaming & Cards — 8";
            (groups[key] ??= []).push(p);
          }
          const order = [
            "Loading State — 8 orbs",
            "Thinking — 2",
            "Streaming & Cards — 8",
            "More",
          ];
          return order.map(
            (g) =>
              groups[g] && (
                <div key={g} className="mt-8">
                  <h3 className="font-mono text-xs font-medium uppercase tracking-widest text-fg-subtle">
                    {g}
                  </h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-elevated text-left text-xs font-medium text-fg-muted">
                          <th scope="col" className="px-3 py-2">
                            Name
                          </th>
                          <th scope="col" className="px-3 py-2">
                            Category
                          </th>
                          <th scope="col" className="px-3 py-2">
                            Status
                          </th>
                          <th scope="col" className="px-3 py-2">
                            One-line
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups[g].map((primitive) => (
                          <tr
                            key={primitive.id}
                            className="border-t border-muted"
                          >
                            <td className="px-3 py-2 font-mono text-xs font-medium text-fg">
                              {primitive.name}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-fg-muted">
                              {primitive.category}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">
                              <span
                                className={
                                  primitive.status === "ready"
                                    ? "text-emerald-600"
                                    : "text-fg-subtle"
                                }
                              >
                                {primitive.status === "ready"
                                  ? "Ready"
                                  : "Coming soon"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs leading-relaxed text-fg-muted">
                              {primitive.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ),
          );
        })()}
      </section>

      <section id="playground" className="scroll-mt-28">
        <h2 className="doc-h2">Playground</h2>
        <p className="doc-p">
          Try every ready primitive live at{" "}
          <Link href="/#playground" className="doc-code">
            /#playground
          </Link>{" "}
          — orbs expose <code className="doc-code">size / speed / paused</code>{" "}
          via <code className="doc-code">orbSizes</code>{" "}
          <code className="doc-code">xs 16 → 2xl 96</code>. Streaming, approval,
          tool chips, task rows, and chat are testable (chat is one-shot in the
          playground —{" "}
          <code className="doc-code">
            Nice, you tried it. This is only a test
          </code>{" "}
          — the component streams any conversation).
        </p>
        <div className="mt-6">
          <Pre>{`import { orbSizes, SyncOrb } from "@ai-primitives/ui";\n\n<SyncOrb size={orbSizes.xl} speed={1} aria-label="Sync" />`}</Pre>
        </div>
      </section>

      <section id="theming" className="scroll-mt-28">
        <h2 className="doc-h2">Theming</h2>
        <p className="doc-p">
          Primitives ship monochrome and resolve color in three steps:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-fg-muted">
          <li>
            <code className="doc-code">system</code> —{" "}
            <code className="doc-code">matchMedia</code> + inline{" "}
            <code className="doc-code">THEME_INIT_SCRIPT</code> in{" "}
            <code className="doc-code">app/layout.tsx:8</code> sets{" "}
            <code className="doc-code">data-theme</code> before hydration (no
            FOUC), follows OS when no stored choice.
          </li>
          <li>
            <code className="doc-code">--orb-fg</code> on any ancestor themes
            every orb — demo wires{" "}
            <code className="doc-code">--orb-fg: var(--fg-default)</code>.
          </li>
          <li>
            <code className="doc-code">color</code> prop wins per instance,
            alpha ignored — orb controls alpha via{" "}
            <code className="doc-code">ink()</code>.
          </li>
        </ul>
        <div className="mt-6">
          <Pre>{THEME_EXAMPLE}</Pre>
        </div>
      </section>

      <section id="accessibility" className="scroll-mt-28">
        <h2 className="doc-h2">Accessibility</h2>
        <p className="doc-p">
          Canvas-rendered primitives are invisible to assistive technology by
          default. When an indicator communicates something important to sighted
          users, pass an <code className="doc-code">aria-label</code> to
          describe the operation.
        </p>
        <div className="mt-6">
          <Pre>{ACCESSIBILITY_EXAMPLE}</Pre>
        </div>
        <p className="doc-p">
          Reduced motion is honored out of the box: when{" "}
          <code className="doc-code">prefers-reduced-motion</code> is set, the
          animation settles into a static representation instead of looping.
        </p>
        <p className="doc-p">
          If the primitive is purely decorative, omit the label and pair it with
          visible text.
        </p>
      </section>

      <section id="api-reference" className="scroll-mt-28">
        <h2 className="doc-h2">API Reference</h2>
        <p className="doc-p">
          The eight Loading State components expose a shared props surface
          today. The surface will grow as each category ships.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-elevated text-left text-xs font-medium text-fg-muted">
                <th scope="col" className="px-4 py-3 font-medium">
                  Prop
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Default
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {PROPS.map((prop) => (
                <tr key={prop.name} className="border-t border-muted">
                  <td className="px-4 py-3 align-top">
                    <code className="whitespace-nowrap font-mono text-xs">
                      {prop.name}
                    </code>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <code className="font-mono text-xs">{prop.type}</code>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <code className="font-mono text-xs text-fg-muted">
                      {prop.defaultValue}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm leading-relaxed">
                    {prop.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-10 font-mono text-xs font-medium uppercase tracking-widest text-fg-subtle">
          StreamingText
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-elevated text-left text-xs font-medium text-fg-muted">
                <th scope="col" className="px-4 py-3 font-medium">
                  Prop
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Default
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {STREAMING_PROPS.map((prop) => (
                <tr key={prop.name} className="border-t border-muted">
                  <td className="px-4 py-3 align-top">
                    <code className="whitespace-nowrap font-mono text-xs">
                      {prop.name}
                    </code>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <code className="font-mono text-xs">{prop.type}</code>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <code className="font-mono text-xs text-fg-muted">
                      {prop.defaultValue}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm leading-relaxed">
                    {prop.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-10 font-mono text-xs font-medium uppercase tracking-widest text-fg-subtle">
          DiffTable
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-elevated text-left text-xs font-medium text-fg-muted">
                <th scope="col" className="px-4 py-3 font-medium">
                  Prop
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Default
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {DIFF_PROPS.map((prop) => (
                <tr key={prop.name} className="border-t border-muted">
                  <td className="px-4 py-3 align-top">
                    <code className="whitespace-nowrap font-mono text-xs">
                      {prop.name}
                    </code>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <code className="font-mono text-xs">{prop.type}</code>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <code className="font-mono text-xs text-fg-muted">
                      {prop.defaultValue}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm leading-relaxed">
                    {prop.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
