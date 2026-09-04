import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Github } from "lucide-react";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "AI Primitives",
    },
    links: [
      {
        text: "Docs",
        url: "/docs",
        active: "nested-url",
      },
      {
        type: "icon",
        url: "https://github.com/AmineAce/ai-primitives-ui",
        label: "GitHub",
        text: "GitHub",
        icon: <Github />,
        external: true,
      },
    ],
  };
}
