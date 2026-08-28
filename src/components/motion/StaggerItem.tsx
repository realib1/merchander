'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';
import { cn } from '@/utils/cn';

export interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** React children */
  children?: React.ReactNode;
  /** Y offset for item entrance (defaults to 16px) */
  yOffset?: number;
}

/**
 * Child element within StaggerContainer animated in sequence.
 */
export function StaggerItem({ children, yOffset = 16, className, ...props }: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isLowEnd } = useDevicePerformance();

  if (shouldReduceMotion || isLowEnd) {
    return <div className={cn(className)}>{children}</div>;
  }

  const customVariants = {
    hidden: { opacity: 0, y: yOffset },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: [0, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <motion.div variants={customVariants} className={cn(className)} {...props}>
      {children}
    </motion.div>
  );
}
