import { describe, it, expect } from "vitest";
import { validateConfig, getConfig, isModuleEnabled, getModuleConfig } from "./config";
import type { SheroConfig } from "@/types/config";

describe("config lib", () => {
  const validMockConfig: SheroConfig = {
    app: {
      name: "Test App",
      slug: "test-app",
      description: "A test app",
    },
    theme: {
      primaryColor: "oklch(0.4 0.1 200)",
    },
    modules: {
      auth: { enabled: true, adapter: "session-auth" },
      payments: { enabled: false },
      notifications: { enabled: true, adapters: ["email"] },
      database: { enabled: false },
      dashboard: { enabled: false },
    },
  };

  it("validates a correctly structured config object", () => {
    const result = validateConfig(validMockConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails validation when config is null or not an object", () => {
    const result = validateConfig(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("must be a non-null object");
  });

  it("fails validation when required app properties are missing", () => {
    const invalidConfig = {
      app: { name: "", slug: "" },
      modules: validMockConfig.modules,
    };
    const result = validateConfig(invalidConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("fails validation when module configurations are missing or invalid", () => {
    const invalidConfig = {
      app: validMockConfig.app,
      modules: {
        auth: { enabled: "yes" as unknown as boolean },
      },
    };
    const result = validateConfig(invalidConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("getConfig returns default configuration", () => {
    const config = getConfig();
    expect(config).toBeDefined();
    expect(config.app.name).toBeDefined();
  });

  it("isModuleEnabled checks module enablement status", () => {
    expect(isModuleEnabled("auth", validMockConfig)).toBe(true);
    expect(isModuleEnabled("payments", validMockConfig)).toBe(false);
  });

  it("getModuleConfig returns correct module config slice", () => {
    const authConfig = getModuleConfig("auth", validMockConfig);
    expect(authConfig.enabled).toBe(true);
    expect(authConfig.adapter).toBe("session-auth");
  });
});
