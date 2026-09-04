import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { Text } from "@/components/ui/text";

const REPO_URL = "https://github.com/AmineAce/ai-primitives-ui";
const AUTHOR_URL = "https://github.com/AmineAce";

export function Footer() {
  return (
    <footer className="border-border border-t">
      <Container className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-secondary flex items-center gap-2.5 text-sm">
          <Logo className="size-4" />
          <span>AI Primitives</span>
          <Text as="span" variant="subtle">
            · MIT License
          </Text>
          <span className="text-fg-subtle hidden sm:inline">·</span>
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noreferrer"
            className="text-fg-subtle hover:text-fg hidden text-xs transition-colors sm:inline"
          >
            Built by AmineAce
          </a>
        </div>
        <div className="text-fg-muted flex flex-wrap items-center gap-5 text-sm sm:gap-6">
          <Link
            href="/docs"
            className="hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noreferrer"
            className="text-fg-subtle hover:text-fg text-xs transition-colors sm:hidden"
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
