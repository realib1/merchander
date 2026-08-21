import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { generateThemeCss, applyThemeToDom, ThemeInjector } from "./theme-injector";
import type { ThemeConfig } from "@/types/config";

describe("theme-injector", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("style");
  });

  it("generates CSS string with custom properties from ThemeConfig", () => {
    const theme: ThemeConfig = {
      primaryColor: "oklch(0.45 0.15 260)",
      secondaryColor: "oklch(0.65 0.20 145)",
      fontPrimary: "Inter",
      fontMono: "Fira Code",
      borderRadius: "8px",
    };

    const css = generateThemeCss(theme);
    expect(css).toContain("--color-brand-primary: oklch(0.45 0.15 260);");
    expect(css).toContain("--color-brand-secondary: oklch(0.65 0.20 145);");
    expect(css).toContain("--font-primary: Inter, system-ui, sans-serif;");
    expect(css).toContain("--font-mono: Fira Code, ui-monospace, monospace;");
    expect(css).toContain("--radius-md: 8px;");
  });

  it("returns empty string when theme is undefined or empty", () => {
    expect(generateThemeCss()).toBe("");
    expect(generateThemeCss({})).toBe("");
  });

  it("applyThemeToDom sets style properties on document root", () => {
    const theme: ThemeConfig = {
      primaryColor: "oklch(0.50 0.18 30)",
      borderRadius: "10px",
    };

    applyThemeToDom(theme);
    expect(document.documentElement.style.getPropertyValue("--color-brand-primary")).toBe(
      "oklch(0.50 0.18 30)"
    );
    expect(document.documentElement.style.getPropertyValue("--radius-md")).toBe("10px");
  });

  it("renders style element when ThemeInjector component has theme", () => {
    const theme: ThemeConfig = {
      primaryColor: "oklch(0.50 0.18 30)",
    };

    const { container } = render(<ThemeInjector theme={theme} />);
    const styleEl = container.querySelector("style#shero-theme-overrides");
    expect(styleEl).toBeInTheDocument();
    expect(styleEl?.innerHTML).toContain("--color-brand-primary: oklch(0.50 0.18 30);");
  });

  it("renders null when ThemeInjector has no theme or empty theme", () => {
    const { container } = render(<ThemeInjector theme={{}} />);
    expect(container.querySelector("style#shero-theme-overrides")).toBeNull();
  });
});
