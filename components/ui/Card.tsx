import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "border-muted bg-elevated overflow-hidden rounded-xl border",
        hover && "hover:border-fg-muted transition-colors",
        className,
      )}
      {...props}
    />
  );
}
