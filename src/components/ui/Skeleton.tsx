import React from "react";
import { cn } from "@/utils/cn";

export type SkeletonVariant = "rect" | "circle" | "text";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape variant */
  variant?: SkeletonVariant;
  /** Width override (e.g. "100%", "200px") */
  width?: string | number;
  /** Height override (e.g. "20px", "40px") */
  height?: string | number;
  /** Number of skeleton text lines to render (for text variant) */
  count?: number;
}

const VARIANT_STYLES: Record<SkeletonVariant, string> = {
  rect: "rounded-[var(--radius-md)]",
  circle: "rounded-full",
  text: "rounded-[var(--radius-sm)] h-4 my-1",
};

/**
 * Loading placeholder placeholder with animated shimmer/pulse.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rect",
  width,
  height,
  count = 1,
  className,
  style,
  ...props
}) => {
  const customStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height !== undefined
      ? { height: typeof height === "number" ? `${height}px` : height }
      : {}),
  };

  const baseClasses = cn(
    "animate-pulse bg-[var(--color-border)]/60 select-none",
    VARIANT_STYLES[variant],
    className
  );

  if (variant === "text" && count > 1) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading content"
        className="flex w-full flex-col"
      >
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={cn(baseClasses, index === count - 1 && count > 1 ? "w-3/4" : "w-full")}
            style={customStyles}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading content"
      className={baseClasses}
      style={customStyles}
      {...props}
    />
  );
};
