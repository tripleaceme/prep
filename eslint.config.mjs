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

    // The original static build, kept as a reference for design and copy.
    // It is not part of the app and is not compiled, so linting it only
    // buries real findings under a thousand warnings from minified code.
    "legacy/**",
    // Vendored pdf.js worker — third-party and minified.
    "public/pdf.worker.min.mjs",
  ]),
]);

export default eslintConfig;
