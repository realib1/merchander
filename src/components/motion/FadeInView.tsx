"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { cn } from "@/utils/cn";

export interface FadeInViewProps extends Omit<HTMLMotionProps<"div">, "children"> {
  /** React children */
  children?: React.ReactNode;
  /** Animation duration in seconds (defaults to 0.4s) */
  duration?: number;
  /** Transition delay in seconds */
  delay?: number;
  /** Initial Y axis offset in pixels (defaults to 20) */
  yOffset?: number;
  /** Trigger animation only once when scrolling into view */
  once?: boolean;
}

/**
 * Scroll-triggered fade entrance component.
 * Automatically gracefully degrades to a static render when prefers-reduced-motion is enabled.
 */
export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 0.4,
  delay = 0,
  yOffset = 20,
  once = true,
  className,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { isLowEnd } = useDevicePerformance();

  if (shouldReduceMotion || isLowEnd) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once }}
      transition={{
        duration,
        delay,
        ease: [0, 0, 0.2, 1],
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
