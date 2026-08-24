import Link from "next/link";
import { Github } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { Container } from "@/components/ui/container";
import { primitives } from "@/lib/primitives";
import { HeroOrb } from "./hero-orb";

const REPO_URL = "https://github.com/AmineAce/ai-primitives-ui";

export function DemoHero() {
  const readyCount = primitives.filter((p) => p.status === "ready").length;
  const comingCount = primitives.filter(
    (p) => p.status === "placeholder",
  ).length;

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <Container className="relative flex flex-1 flex-col items-center justify-center py-20 text-center">
        <div>
          <HeroOrb />
        </div>

        <p className="mt-6 font-mono text-xs tracking-widest text-fg-subtle">
          canvas 2d · monochrome · zero runtime dependencies
        </p>

        <h1 className="mt-4 font-mono text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          UI primitives for
          <br />
          AI-native interfaces
        </h1>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/docs" className={buttonVariants({ size: "lg" })}>
            Get Started
          </Link>
          <Link
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            <Github className="size-4" />
            View on GitHub
          </Link>
        </div>

        <p className="mt-8 font-mono text-xs text-fg-subtle">
          {readyCount} primitives · 0 runtime dependencies · MIT
          {comingCount > 0 ? " · More coming soon" : ""}
        </p>
      </Container>

      <div
        aria-hidden="true"
        className="bg-border-muted relative mx-auto mb-6 hidden h-14 w-px md:block"
      >
        <span className="animate-scroll-dot absolute left-1/2 top-0 -ml-px size-1 rounded-full bg-fg" />
      </div>
    </section>
  );
}
