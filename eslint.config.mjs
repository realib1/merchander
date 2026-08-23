import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/node_modules/**",
      "**/.yarn/**",
      "next-env.d.ts"
    ],
  },
]);

export default eslintConfig;
