import { Copy } from "lucide-react";
import { Container } from "@/components/ui/container";

export function DemoInstall() {
  return (
    <section className="border-muted border-t py-24">
      <Container>
        <h2 className="text-lg font-medium">Installation</h2>

        <div className="bg-elevated text-fg mt-6 flex items-center justify-between gap-4 rounded-lg border p-4 font-mono text-sm">
          <code>npm install @ai-primitives-ui/ui</code>
          <button
            type="button"
            aria-label="Copy install command"
            className="text-fg-subtle hover:text-fg transition-colors"
          >
            <Copy className="size-4" />
          </button>
        </div>
      </Container>
    </section>
  );
}
