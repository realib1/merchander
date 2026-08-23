"use client";

import React, { createContext, useContext, useState, useCallback, useId } from "react";
import { cn } from "@/utils/cn";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string) => string;
    error: (message: string, title?: string) => string;
    warning: (message: string, title?: string) => string;
    info: (message: string, title?: string) => string;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_ICONS: Record<ToastType, React.JSX.Element> = {
  success: (
    <svg
      className="h-5 w-5 text-brand-secondary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg
      className="h-5 w-5 text-destructive"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg
      className="h-5 w-5 text-warning"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg
      className="h-5 w-5 text-info"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idPrefix = useId();

  const removeToast = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastItem, "id">): string => {
      const id = `${idPrefix}-${Date.now()}-${Math.random()}`;
      const duration = toast.duration ?? 4000;
      const newItem: ToastItem = { ...toast, id, duration };

      setToasts((prev) => [...prev, newItem]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [idPrefix, removeToast]
  );

  const toastMethods = {
    success: (message: string, title?: string) => addToast({ type: "success", message, title }),
    error: (message: string, title?: string) => addToast({ type: "error", message, title }),
    warning: (message: string, title?: string) => addToast({ type: "warning", message, title }),
    info: (message: string, title?: string) => addToast({ type: "info", message, title }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast: toastMethods }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg",
              "border-separator bg-surface-elevated text-primary",
              "animate-in slide-in-from-bottom-2 fade-in transition-all duration-200"
            )}
          >
            <div className="shrink-0 pt-0.5">{TOAST_ICONS[t.type]}</div>
            <div className="flex flex-1 flex-col gap-0.5 text-left">
              {t.title && <h4 className="text-xs font-semibold">{t.title}</h4>}
              <p className="text-xs text-secondary">{t.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Close notification"
              className="shrink-0 rounded-full p-1 text-muted transition-colors hover:text-brand-primary"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
