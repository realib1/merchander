import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  formatPhoneNumber,
} from "./format";

describe("format utilities", () => {
  describe("formatCurrency", () => {
    it("formats Ghanaian Cedi (GHS) correctly", () => {
      const formatted = formatCurrency(1500, "GHS", "en-GH");
      expect(formatted).toContain("1,500.00");
    });

    it("formats USD correctly", () => {
      const formatted = formatCurrency(99.5, "USD", "en-US");
      expect(formatted).toBe("$99.50");
    });

    it("handles zero and NaN values safely", () => {
      expect(formatCurrency(0, "GHS", "en-GH")).toContain("0.00");
      expect(formatCurrency(NaN, "GHS")).toBe("GHS 0.00");
    });
  });

  describe("formatNumber", () => {
    it("formats numbers with fixed decimals", () => {
      expect(formatNumber(1234.567, { decimals: 2 })).toBe("1,234.57");
    });

    it("formats compact notation", () => {
      expect(formatNumber(1500, { compact: true })).toBe("1.5K");
      expect(formatNumber(2500000, { compact: true })).toBe("2.5M");
    });

    it("handles NaN safely", () => {
      expect(formatNumber(NaN)).toBe("0");
    });
  });

  describe("formatDate", () => {
    it("formats Date instance into readable string", () => {
      const date = new Date("2026-08-15T12:00:00Z");
      expect(formatDate(date)).toContain("2026");
      expect(formatDate(date)).toContain("Aug");
    });

    it("handles invalid dates gracefully", () => {
      expect(formatDate("invalid-date")).toBe("");
    });
  });

  describe("formatRelativeTime", () => {
    const base = new Date("2026-08-15T12:00:00Z");

    it("returns 'just now' for recent events", () => {
      const recent = new Date("2026-08-15T11:59:40Z");
      expect(formatRelativeTime(recent, base)).toBe("just now");
    });

    it("returns minutes ago", () => {
      const past = new Date("2026-08-15T11:45:00Z");
      expect(formatRelativeTime(past, base)).toBe("15m ago");
    });

    it("returns hours ago", () => {
      const past = new Date("2026-08-15T09:00:00Z");
      expect(formatRelativeTime(past, base)).toBe("3h ago");
    });

    it("returns days ago", () => {
      const past = new Date("2026-08-12T12:00:00Z");
      expect(formatRelativeTime(past, base)).toBe("3d ago");
    });

    it("returns months and years ago", () => {
      const monthsPast = new Date("2026-05-15T12:00:00Z");
      expect(formatRelativeTime(monthsPast, base)).toBe("3mo ago");

      const yearsPast = new Date("2024-08-15T12:00:00Z");
      expect(formatRelativeTime(yearsPast, base)).toBe("2y ago");
    });

    it("handles future dates and invalid dates", () => {
      const future = new Date("2026-08-15T13:00:00Z");
      expect(formatRelativeTime(future, base)).toBe("in the future");
      expect(formatRelativeTime("invalid-date", base)).toBe("");
    });
  });

  describe("formatPhoneNumber", () => {
    it("formats 10-digit Ghana local number", () => {
      expect(formatPhoneNumber("0241234567")).toBe("+233 24 123 4567");
    });

    it("formats 12-digit Ghana number starting with country code", () => {
      expect(formatPhoneNumber("233241234567")).toBe("+233 24 123 4567");
    });

    it("handles empty, unformatted, and pre-formatted numbers", () => {
      expect(formatPhoneNumber("")).toBe("");
      expect(formatPhoneNumber("+1 415 555 2671")).toBe("+1 415 555 2671");
      expect(formatPhoneNumber("12345")).toBe("12345");
    });
  });
});
