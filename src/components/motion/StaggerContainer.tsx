"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { cn } from "@/utils/cn";

export interface StaggerContainerProps extends Omit<HTMLMotionProps<"div">, "children"> {
  /** React children */
  children?: React.ReactNode;
  /** Stagger interval between child items in seconds (defaults to 0.08s) */
  staggerDelay?: number;
  /** Initial delay before stagger sequence starts in seconds */
  delayChildren?: number;
  /** Trigger animation once */
  once?: boolean;
}

/**
 * Container wrapping multiple StaggerItem components with an orchestrated delay sequence.
 */
export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.08,
  delayChildren = 0,
  once = true,
  className,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { isLowEnd } = useDevicePerformance();

  if (shouldReduceMotion || isLowEnd) {
    return <div className={cn(className)}>{children}</div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
