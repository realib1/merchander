import { describe, it, expect } from "vitest";
import { escapeHtml, sanitizeInput, slugify, truncate, sanitizeNumeric } from "./sanitize";

describe("sanitize utilities", () => {
  describe("escapeHtml", () => {
    it("escapes script tags and attributes", () => {
      const payload = '<script>alert("xss")</script>';
      expect(escapeHtml(payload)).toBe("&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;");
    });

    it("escapes quotes and ampersands", () => {
      expect(escapeHtml("Tom & 'Jerry'")).toBe("Tom &amp; &#x27;Jerry&#x27;");
    });

    it("handles empty strings", () => {
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("sanitizeInput", () => {
    it("trims whitespace and removes invisible control characters", () => {
      const raw = "   Hello \x00World\x1F!   ";
      expect(sanitizeInput(raw)).toBe("Hello World!");
    });
  });

  describe("slugify", () => {
    it("converts mixed strings and special characters into clean slugs", () => {
      expect(slugify("Smart Boutique Accra!")).toBe("smart-boutique-accra");
      expect(slugify("  Café & Restaurant $100  ")).toBe("cafe-restaurant-100");
    });

    it("collapses multiple consecutive dashes", () => {
      expect(slugify("foo---bar   baz")).toBe("foo-bar-baz");
    });
  });

  describe("truncate", () => {
    it("truncates at word boundary when possible", () => {
      const text = "Universal Project Scaffolding System for Developers";
      expect(truncate(text, 25)).toBe("Universal Project...");
    });

    it("does not truncate when within limit", () => {
      expect(truncate("Short string", 20)).toBe("Short string");
    });

    it("handles short maxLength values safely", () => {
      expect(truncate("Hello World", 3)).toBe("Hel");
      expect(truncate("", 10)).toBe("");
    });
  });

  describe("sanitizeNumeric", () => {
    it("parses currency strings and numbers", () => {
      expect(sanitizeNumeric("GH₵1,500.50")).toBe(1500.5);
      expect(sanitizeNumeric("-45.20")).toBe(-45.2);
      expect(sanitizeNumeric(123)).toBe(123);
      expect(sanitizeNumeric(Infinity, 0)).toBe(0);
    });

    it("returns fallback for invalid numbers", () => {
      expect(sanitizeNumeric("abc", 10)).toBe(10);
      expect(sanitizeNumeric(NaN, 0)).toBe(0);
      expect(sanitizeNumeric(null as unknown as string, 5)).toBe(5);
    });
  });
});
