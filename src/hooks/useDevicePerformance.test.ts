import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useDevicePerformance } from "./useDevicePerformance";

describe("useDevicePerformance hook", () => {
  it("computes performance tier and flags", () => {
    const { result } = renderHook(() => useDevicePerformance());
    expect(["low", "medium", "high"]).toContain(result.current.tier);
    expect(typeof result.current.isLowEnd).toBe("boolean");
    expect(typeof result.current.isHighEnd).toBe("boolean");
  });
});
