"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/utils/cn";

export interface MobileDrawerProps {
  /** Controls drawer open/closed state */
  isOpen: boolean;
  /** Callback fired when drawer requests to close */
  onClose: () => void;
  /** Drawer header title */
  title?: React.ReactNode;
  /** Drawer body content (nav links, user actions, etc.) */
  children: React.ReactNode;
  /** Optional drawer footer content (status, theme toggle, logout) */
  footer?: React.ReactNode;
  /** Slide-in direction */
  position?: "left" | "right";
  /** Additional CSS class names for the drawer panel */
  className?: string;
}

/**
 * Slide-in mobile navigation drawer with backdrop overlay and accessible keyboard controls.
 */
export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = "left",
  className,
}) => {
  const isReducedMotion = useReducedMotion();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on ESC and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const slideOffset = position === "left" ? "-100%" : "100%";

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex"
          style={{ justifyContent: position === "right" ? "flex-end" : "flex-start" }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isReducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : "Mobile navigation menu"}
            initial={isReducedMotion ? { opacity: 0 } : { x: slideOffset }}
            animate={isReducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={isReducedMotion ? { opacity: 0 } : { x: slideOffset }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              duration: isReducedMotion ? 0 : 0.25,
            }}
            className={cn(
              "relative z-10 flex h-full w-4/5 max-w-sm flex-col border-r border-separator bg-surface text-text-primary shadow-2xl",
              position === "right" && "border-r-0 border-l",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-separator px-5 py-4">
              <div className="text-base font-semibold tracking-tight text-text-primary">
                {title || "Menu"}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm,4px)] text-text-muted hover:bg-surface-elevated hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-separator bg-surface-elevated/50 px-5 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
