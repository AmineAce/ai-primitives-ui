import { Copy } from "lucide-react";
import { Container } from "@/components/ui/container";

export function DemoInstall() {
  return (
    <section className="border-t border-muted py-24">
      <Container>
        <h2 className="text-lg font-medium">Installation</h2>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border bg-elevated p-4 font-mono text-sm text-fg">
          <code>npm install @ai-primitives-ui/ui</code>
          <button
            type="button"
            aria-label="Copy install command"
            className="text-fg-subtle transition-colors hover:text-fg"
          >
            <Copy className="size-4" />
          </button>
        </div>
      </Container>
    </section>
  );
}
