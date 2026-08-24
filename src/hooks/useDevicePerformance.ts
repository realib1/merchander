/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';

export type PerformanceTier = 'low' | 'medium' | 'high';

export interface DevicePerformanceState {
  /** Computed performance category based on hardware/network indicators */
  tier: PerformanceTier;
  /** Convenience flag indicating low-end/battery-constrained device */
  isLowEnd: boolean;
  /** Convenience flag indicating high-performance device */
  isHighEnd: boolean;
}

interface NavigatorExtended extends Navigator {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
}

/**
 * Custom hook to detect device capability and adjust animation fidelity.
 * Prevents UI lag and frame drops on low-power mobile devices.
 */
export function useDevicePerformance(): DevicePerformanceState {
  const [performance, setPerformance] = useState<DevicePerformanceState>(() => ({
    tier: 'high',
    isLowEnd: false,
    isHighEnd: true,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nav = navigator as NavigatorExtended;
    const cores = nav.hardwareConcurrency ?? 4;
    const memory = nav.deviceMemory ?? 4;
    const isSaveData = nav.connection?.saveData ?? false;
    const isSlowConnection = nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g';

    let tier: PerformanceTier = 'medium';

    if (isSaveData || isSlowConnection || cores <= 2 || memory <= 2) {
      tier = 'low';
    } else if (cores >= 8 && memory >= 8) {
      tier = 'high';
    }

    setPerformance({
      tier,
      isLowEnd: tier === 'low',
      isHighEnd: tier === 'high',
    });
  }, []);

  return performance;
}
