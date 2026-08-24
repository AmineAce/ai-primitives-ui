import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { Text } from "@/components/ui/text";

const REPO_URL = "https://github.com/ai-primitives/ai-primitives";
const AUTHOR_URL = "https://github.com/AmineAce";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 text-sm text-secondary">
          <Logo className="size-4" />
          <span>AI Primitives</span>
          <Text as="span" variant="subtle">
            · MIT License
          </Text>
          <span className="hidden text-fg-subtle sm:inline">·</span>
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden text-xs text-fg-subtle transition-colors hover:text-fg sm:inline"
          >
            Built by AmineAce
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm text-fg-muted sm:gap-6">
          <Link
            href="/docs"
            className="transition-colors hover:text-foreground"
          >
            Docs
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-fg-subtle transition-colors hover:text-fg sm:hidden"
          >
            AmineAce
          </a>
          <Text as="span" variant="subtle">
            © 2026
          </Text>
        </div>
      </Container>
    </footer>
  );
}
