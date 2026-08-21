import React from "react";
import type { ThemeConfig } from "@/types/config";

/**
 * Converts a ThemeConfig object into a CSS custom properties string.
 */
export function generateThemeCss(theme?: ThemeConfig): string {
  if (!theme) return "";

  const declarations: string[] = [];

  if (theme.primaryColor) {
    declarations.push(`  --color-brand-primary: ${theme.primaryColor};`);
  }
  if (theme.secondaryColor) {
    declarations.push(`  --color-brand-secondary: ${theme.secondaryColor};`);
  }
  if (theme.fontPrimary) {
    declarations.push(`  --font-primary: ${theme.fontPrimary}, system-ui, sans-serif;`);
  }
  if (theme.fontMono) {
    declarations.push(`  --font-mono: ${theme.fontMono}, ui-monospace, monospace;`);
  }
  if (theme.borderRadius) {
    declarations.push(`  --radius-md: ${theme.borderRadius};`);
  }

  if (declarations.length === 0) return "";

  return `:root {\n${declarations.join("\n")}\n}`;
}

/**
 * Applies theme overrides to the document root element at runtime (client-side).
 */
export function applyThemeToDom(theme?: ThemeConfig): void {
  if (typeof document === "undefined" || !theme) return;

  const root = document.documentElement;

  if (theme.primaryColor) {
    root.style.setProperty("--color-brand-primary", theme.primaryColor);
  }
  if (theme.secondaryColor) {
    root.style.setProperty("--color-brand-secondary", theme.secondaryColor);
  }
  if (theme.fontPrimary) {
    root.style.setProperty("--font-primary", `${theme.fontPrimary}, system-ui, sans-serif`);
  }
  if (theme.fontMono) {
    root.style.setProperty("--font-mono", `${theme.fontMono}, ui-monospace, monospace`);
  }
  if (theme.borderRadius) {
    root.style.setProperty("--radius-md", theme.borderRadius);
  }
}

export interface ThemeInjectorProps {
  /** Theme configuration object containing overrides */
  theme?: ThemeConfig;
}

/**
 * Server/Client component that injects runtime CSS overrides into document head.
 */
export function ThemeInjector({ theme }: ThemeInjectorProps): React.JSX.Element | null {
  const css = generateThemeCss(theme);
  if (!css) return null;

  return <style id="shero-theme-overrides" dangerouslySetInnerHTML={{ __html: css }} />;
}
