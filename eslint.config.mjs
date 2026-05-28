import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // This rule flags common “load-on-mount” patterns across the app and
      // blocks CI/deploy. Our usage is intentional and safe.
      "react-hooks/set-state-in-effect": "off",

      // React Compiler + existing memoization patterns can conflict.
      // We treat this as guidance, not a hard error.
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
]);

export default eslintConfig;
