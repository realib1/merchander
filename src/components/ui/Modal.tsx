'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'fullscreen';

export interface ModalProps {
  /** Controls open/closed visibility */
  isOpen: boolean;
  /** Callback fired when modal requests to close */
  onClose: () => void;
  /** Modal header title */
  title?: React.ReactNode;
  /** Optional subtitle or description */
  description?: React.ReactNode;
  /** Modal body content */
  children: React.ReactNode;
  /** Optional modal footer actions */
  footer?: React.ReactNode;
  /** Max width / size dimension */
  size?: ModalSize;
  /** Show close button (X) in top corner */
  showCloseButton?: boolean;
  /** Close when clicking the backdrop overlay */
  closeOnBackdropClick?: boolean;
  /** Custom wrapper class */
  className?: string;
}

const SIZE_STYLES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  fullscreen: 'w-screen h-screen max-w-none rounded-none max-h-screen',
};

const emptySubscribe = () => () => {};

/**
 * Accessible dialog overlay with Portal, focus trap, backdrop dismissal, single-scroll container, and keyboard support.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  className,
}: ModalProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Store previously focused element and manage focus on open/close
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;

      // Focus first focusable element or modal container
      const timer = setTimeout(() => {
        if (!dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0]?.focus();
        } else {
          dialogRef.current.focus();
        }
      }, 0);

      return () => clearTimeout(timer);
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
      previousActiveElementRef.current = null;
    }
  }, [isOpen]);

  // Handle ESC key press & Tab focus trap & Body Scroll Lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
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
          if (document.activeElement === firstElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement || !dialogRef.current.contains(document.activeElement)) {
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

  const modalContent = (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        aria-hidden="true"
        onClick={() => closeOnBackdropClick && onClose()}
      />

      {/* Modal Dialog Card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        className={cn(
          'relative z-10 flex flex-col w-full bg-surface-elevated text-primary',
          'animate-in fade-in zoom-in-95 overflow-hidden border border-separator shadow-2xl rounded-2xl duration-150 outline-none',
          'max-h-[min(90dvh,800px)]',
          SIZE_STYLES[size],
          className
        )}
      >
        {/* Pinned Header */}
        {(title || showCloseButton) && (
          <div className="shrink-0 flex items-start justify-between border-b border-separator/60 p-4 sm:p-5 bg-surface-elevated">
            <div className="flex flex-col gap-1 pr-4">
              {title && (
                <h2 id="modal-title" className="text-base sm:text-lg font-semibold tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="text-xs text-secondary leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-brand-primary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Single Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 text-sm">{children}</div>

        {/* Pinned Footer */}
        {footer && (
          <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-separator/60 bg-surface/50 p-3.5 sm:p-4 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
