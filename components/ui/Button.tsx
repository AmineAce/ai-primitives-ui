import { Children, cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-fg text-bg-base hover:bg-fg-muted",
  secondary:
    "border border-default text-fg hover:bg-[color-mix(in_srgb,var(--fg-default)_5%,transparent)]",
  ghost: "text-fg-muted hover:bg-surface hover:text-foreground",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-xs",
  md: "h-9 gap-2 rounded-md px-4 text-sm",
  lg: "h-11 gap-2 rounded-lg px-5 text-sm",
};

export interface ButtonVariants {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: ButtonVariants = {}) {
  return cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", asChild, ...props }, ref) => {
    if (asChild && isValidElement(props.children)) {
      const child = Children.only(props.children);
      return cloneElement(child, {
        className: cn(
          buttonVariants({ variant, size, className }),
          child.props.className,
        ),
      });
    }

    return (
      <button
        ref={ref}
        type={type}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
