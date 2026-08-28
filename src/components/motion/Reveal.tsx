'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';
import { cn } from '@/utils/cn';

export type RevealDirection = 'up' | 'down' | 'left' | 'right';

export interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** React children */
  children?: React.ReactNode;
  /** Direction from which the content slides into view */
  direction?: RevealDirection;
  /** Distance in pixels to travel during reveal */
  distance?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Animation delay in seconds */
  delay?: number;
  /** Trigger animation once */
  once?: boolean;
}

/**
 * Directional reveal animation for headings, cards, and section containers.
 */
export function Reveal({
  children,
  direction = 'up',
  distance = 24,
  duration = 0.45,
  delay = 0,
  once = true,
  className,
  ...props
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isLowEnd } = useDevicePerformance();

  if (shouldReduceMotion || isLowEnd) {
    return <div className={cn(className)}>{children}</div>;
  }

  const getInitialOffsets = (): { x: number; y: number } => {
    switch (direction) {
      case 'up':
        return { x: 0, y: distance };
      case 'down':
        return { x: 0, y: -distance };
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
      default:
        return { x: 0, y: distance };
    }
  };

  const initialOffset = getInitialOffsets();

  return (
    <motion.div
      initial={{ opacity: 0, ...initialOffset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
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
}
