"use client";

import { useState, useEffect } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Custom hook that listens to the user's OS-level motion preference.
 * Returns true if the user prefers reduced motion, false otherwise.
 *
 * @returns boolean - Whether prefers-reduced-motion is active.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);

    const updatePreference = (event: MediaQueryListEvent): void => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(mediaQueryList.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", updatePreference);
      return () => mediaQueryList.removeEventListener("change", updatePreference);
    } else {
      // Legacy fallback
      mediaQueryList.addListener(updatePreference);
      return () => mediaQueryList.removeListener(updatePreference);
    }
  }, []);

  return prefersReducedMotion;
}
