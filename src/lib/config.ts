import { sheroConfig as defaultSheroConfig } from "../../shero.config";
import type { SheroConfig, ModulesConfig } from "@/types/config";

/**
 * Validates a configuration object to ensure it conforms to SheroConfig schema.
 */
export function validateConfig(config: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config || typeof config !== "object") {
    return { valid: false, errors: ["Configuration must be a non-null object."] };
  }

  const c = config as Partial<SheroConfig>;

  // Validate app
  if (!c.app || typeof c.app !== "object") {
    errors.push("Missing 'app' configuration object.");
  } else {
    if (!c.app.name || typeof c.app.name !== "string" || c.app.name.trim() === "") {
      errors.push("app.name is required and must be a non-empty string.");
    }
    if (!c.app.slug || typeof c.app.slug !== "string" || c.app.slug.trim() === "") {
      errors.push("app.slug is required and must be a non-empty string.");
    }
  }

  // Validate modules
  if (!c.modules || typeof c.modules !== "object") {
    errors.push("Missing 'modules' configuration object.");
  } else {
    const requiredModules: Array<keyof ModulesConfig> = [
      "auth",
      "payments",
      "notifications",
      "database",
      "dashboard",
    ];

    for (const mod of requiredModules) {
      if (!c.modules[mod] || typeof c.modules[mod] !== "object") {
        errors.push(`Module '${mod}' must be defined as an object.`);
      } else if (typeof c.modules[mod].enabled !== "boolean") {
        errors.push(`Module '${mod}.enabled' must be a boolean.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Retrieves the master application configuration.
 */
export function getConfig(): SheroConfig {
  return defaultSheroConfig;
}

/**
 * Checks whether a specific Layer 2 module is enabled in configuration.
 */
export function isModuleEnabled(
  moduleName: keyof ModulesConfig,
  config: SheroConfig = defaultSheroConfig
): boolean {
  return Boolean(config?.modules?.[moduleName]?.enabled);
}

/**
 * Returns configuration for a specific module.
 */
export function getModuleConfig<K extends keyof ModulesConfig>(
  moduleName: K,
  config: SheroConfig = defaultSheroConfig
): ModulesConfig[K] {
  return config.modules[moduleName];
}
