import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-muted bg-elevated",
        hover && "transition-colors hover:border-fg-muted",
        className,
      )}
      {...props}
    />
  );
}
