"use client";

import { useEffect, useRef } from "react";

/**
 * Custom hook that runs an interval callback only while the document/tab is actively visible.
 * Pauses automatically when tab is hidden or minimized to save battery and CPU.
 *
 * @param callback - Function to execute on each interval tick.
 * @param delay - Interval delay in milliseconds (or null to pause).
 */
export function useVisibleInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null || typeof window === "undefined") return;

    let intervalId: NodeJS.Timeout | null = null;

    const tick = (): void => {
      savedCallback.current();
    };

    const startInterval = (): void => {
      if (document.visibilityState === "visible" && intervalId === null) {
        intervalId = setInterval(tick, delay);
      }
    };

    const stopInterval = (): void => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        startInterval();
      } else {
        stopInterval();
      }
    };

    startInterval();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [delay]);
}
