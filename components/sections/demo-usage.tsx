import { Container } from "@/components/ui/container";
import { Pre } from "@/components/ui/pre";

export function DemoUsage() {
  return (
    <section className="border-t border-muted py-24">
      <Container>
        <h2 className="text-lg font-medium">Usage</h2>

        <div className="mt-6 space-y-4">
          <Pre>{`import { CloningOrb } from "@ai-primitives/orbs";`}</Pre>
          <Pre>{`<CloningOrb size={64} aria-label="Cloning repository" />`}</Pre>
        </div>
      </Container>
    </section>
  );
}
