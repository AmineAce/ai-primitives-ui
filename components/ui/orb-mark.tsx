import { cn } from "@/lib/utils";

export interface OrbMarkProps extends React.SVGProps<SVGSVGElement> {}

export function OrbMark({ className, ...props }: OrbMarkProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      className={cn("size-40", className)}
      {...props}
    >
      <circle
        cx="100"
        cy="100"
        r="92"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="100"
        cy="100"
        r="66"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 6"
      />
      <circle
        cx="100"
        cy="100"
        r="40"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="100" cy="100" r="13" fill="currentColor" />
    </svg>
  );
}
