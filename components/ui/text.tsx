import { cn } from "@/lib/utils";

export type TextVariant = "default" | "muted" | "subtle" | "mono";

export const textVariantClasses: Record<TextVariant, string> = {
  default: "text-foreground",
  muted: "text-git-fg-muted",
  subtle: "text-git-fg-subtle",
  mono: "font-mono text-git-fg-muted",
};

export function textVariants({
  variant = "default",
  className,
}: {
  variant?: TextVariant;
  className?: string;
} = {}) {
  return cn(textVariantClasses[variant], className);
}

export type TextProps<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "as" | "variant" | "className"
> & {
  as?: T;
  variant?: TextVariant;
  className?: string;
};

export function Text<T extends React.ElementType = "span">({
  as,
  variant = "default",
  className,
  ...props
}: TextProps<T>) {
  const Component = (as ?? "span") as React.ElementType;
  return (
    <Component className={textVariants({ variant, className })} {...props} />
  );
}
