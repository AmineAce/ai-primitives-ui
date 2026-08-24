"use client";

import { forwardRef, type CanvasHTMLAttributes } from "react";

export interface CanvasContainerProps extends Omit<
  CanvasHTMLAttributes<HTMLCanvasElement>,
  "width" | "height"
> {
  width: number;
  height: number;
  className?: string;
  ariaLabel?: string;
}

export const CanvasContainer = forwardRef<
  HTMLCanvasElement,
  CanvasContainerProps
>(function CanvasContainer(
  { width, height, className, ariaLabel, ...rest },
  forwardedRef,
) {
  return (
    <canvas
      ref={forwardedRef}
      width={width}
      height={height}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      style={{ width, height }}
      className={className}
      {...rest}
    />
  );
});

CanvasContainer.displayName = "CanvasContainer";
