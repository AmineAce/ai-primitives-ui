import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      sidebar={{
        defaultOpenLevel: 1,
        collapsible: true,
        prefetch: true,
      }}
    >
      {children}
    </DocsLayout>
  );
}
