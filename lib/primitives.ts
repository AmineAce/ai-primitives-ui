export type PrimitiveStatus = "ready" | "placeholder";

export interface Primitive {
  id: string;
  name: string;
  description: string;
  status: PrimitiveStatus;
  category: string;
  span?: number;
}

export const primitives: Primitive[] = [
  {
    id: "download",
    name: "Generating File",
    description:
      "A file assembles dot by dot, seals with a folded corner, and steadies for handoff.",
    status: "ready",
    category: "Loading State",
  },
  {
    id: "failed",
    name: "Failed",
    description: "Digital glitch tears, then a `!` holds: honest failure.",
    status: "ready",
    category: "Loading State",
  },
  {
    id: "progress",
    name: "Progress",
    description: "Ring sweeps around a still globe: 0→100% at a glance.",
    status: "ready",
    category: "Loading State",
  },
  {
    id: "dna",
    name: "DNA",
    description:
      "A double helix assembles base by base: curious, methodical, alive.",
    status: "ready",
    category: "Thinking",
  },
  {
    id: "verify",
    name: "Verify",
    description:
      "A vigilant scan sweeps and reinforces: protective, thorough, wary.",
    status: "ready",
    category: "Thinking",
  },
  {
    id: "graph",
    name: "Graph",
    description: "Nodes find each other and link: a living network revealed.",
    status: "ready",
    category: "Thinking",
  },
  {
    id: "cloning",
    name: "Cloning",
    description: "Dots spiral onto an empty sphere, filling it layer by layer.",
    status: "ready",
    category: "Loading State",
  },
  {
    id: "sync",
    name: "Sync",
    description: "Bidirectional sync: local and remote converge.",
    status: "ready",
    category: "Loading State",
  },
  {
    id: "fetching",
    name: "Fetching",
    description:
      "Packets pulse outward from the sphere's core, snap onto the surface one by one, then peel back in.",
    status: "ready",
    category: "Loading State",
  },
  {
    id: "pulling",
    name: "Pulling",
    description: "Fetch and merge combined: remote dots flow in and integrate.",
    status: "ready",
    category: "Loading State",
  },
  {
    id: "pushing",
    name: "Pushing",
    description:
      "Selected local commits detach and launch outward to the remote.",
    status: "ready",
    category: "Loading State",
  },
  {
    id: "merging",
    name: "Merging",
    description: "Two branches converge at a junction and continue as one.",
    status: "ready",
    category: "Loading State",
  },
  {
    id: "rebasing",
    name: "Rebasing",
    description:
      "Orbs replay onto three equator rings, filling the globe together.",
    status: "ready",
    category: "Loading State",
  },
  {
    id: "stashing",
    name: "Stashing",
    description:
      "Scattered work dots converge into a glowing core, flash shut, then reapply.",
    status: "ready",
    category: "Loading State",
  },
  {
    id: "thinking",
    name: "Thinking",
    description: "A cube twists a few turns, then blooms into the orb.",
    status: "ready",
    category: "Thinking",
  },
  {
    id: "scan",
    name: "Scan",
    description:
      "A soft wavefront sweeps the surface, brightening dots in passing.",
    status: "ready",
    category: "Thinking",
  },
  {
    id: "streaming-text",
    name: "Streaming Text",
    description: "Tokens that appear in sequence as text is generated.",
    status: "ready",
    category: "Streaming Text",
  },
  {
    id: "approval-card",
    name: "Approval Card",
    description:
      "A compact card asking the user to confirm or dismiss an action.",
    status: "ready",
    category: "Approval Card",
  },
  {
    id: "tool-chips",
    name: "Tool Chips",
    description: "Chips that surface which tools the model invoked.",
    status: "ready",
    category: "Tool Chips",
  },
  {
    id: "task-rows",
    name: "Task Rows",
    description: "Progress rows for multi-step agentic runs.",
    status: "ready",
    category: "Task Rows",
  },
  {
    id: "recommendation-card",
    name: "Recommendation Card",
    description: "Inline suggestions and follow-ups after an answer.",
    status: "ready",
    category: "Recommendation Card",
  },
  {
    id: "chat",
    name: "Chat",
    description: "Message layout for streaming, multi-turn conversations.",
    status: "ready",
    category: "Chat",
    span: 2,
  },
  {
    id: "context-cards",
    name: "Context Cards",
    description: "Sources and references the model drew on.",
    status: "ready",
    category: "Context Cards",
  },
  {
    id: "diff-table",
    name: "Diff Table",
    description: "Line-by-line code changes in a diff view.",
    status: "ready",
    category: "Diff Table",
    span: 2,
  },
  {
    id: "more",
    name: "More coming soon",
    description: "More primitives on the way.",
    status: "placeholder",
    category: "More",
  },
];
