'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface DrawerProps {
  /** Controls open/closed visibility */
  isOpen: boolean;
  /** Callback fired when drawer requests to close */
  onClose: () => void;
  /** Drawer header title */
  title?: React.ReactNode;
  /** Optional subtitle or description */
  description?: React.ReactNode;
  /** Optional icon or badge next to the title */
  icon?: React.ReactNode;
  /** Drawer body content */
  children: React.ReactNode;
  /** Pinned drawer footer actions */
  footer?: React.ReactNode;
  /** Width dimension */
  size?: DrawerSize;
  /** Show close button (X) in top corner */
  showCloseButton?: boolean;
  /** Close when clicking the backdrop overlay */
  closeOnBackdropClick?: boolean;
  /** Custom wrapper class */
  className?: string;
}

const SIZE_STYLES: Record<DrawerSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  full: 'max-w-full',
};

const emptySubscribe = () => () => {};

/**
 * Accessible slide-over drawer panel anchored to the right side of the screen.
 * Ideal for multi-section forms, detail sidebars, and entity provisioning.
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'lg',
  showCloseButton = true,
  closeOnBackdropClick = true,
  className,
}: DrawerProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;

      const timer = setTimeout(() => {
        if (!drawerRef.current) return;
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0]?.focus();
        } else {
          drawerRef.current.focus();
        }
      }, 0);

      return () => clearTimeout(timer);
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
      previousActiveElementRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !isMounted) return null;

  const drawerContent = (
    <div
      role="presentation"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
        onClick={() => closeOnBackdropClick && onClose()}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          aria-labelledby={title ? 'drawer-title' : undefined}
          aria-describedby={description ? 'drawer-description' : undefined}
          className={cn(
            'relative flex flex-col w-screen bg-surface-elevated text-primary',
            'border-l border-separator shadow-2xl animate-in slide-in-from-right duration-250 ease-out outline-none',
            SIZE_STYLES[size],
            className
          )}
        >
          {/* Pinned Header */}
          {(title || showCloseButton) && (
            <div className="shrink-0 flex items-start justify-between border-b border-separator/60 p-4 sm:p-5 bg-surface-elevated">
              <div className="flex items-center gap-3 pr-4">
                {icon && <div className="shrink-0">{icon}</div>}
                <div className="flex flex-col gap-0.5">
                  {title && (
                    <h2 id="drawer-title" className="text-base sm:text-lg font-semibold tracking-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="drawer-description" className="text-xs text-secondary leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close panel"
                  className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {children}
          </div>

          {/* Pinned Footer */}
          {footer && (
            <div className="shrink-0 border-t border-separator/60 p-4 sm:p-5 bg-surface-elevated">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
