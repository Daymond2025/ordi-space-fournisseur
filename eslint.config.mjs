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
    // Script Node ponctuel (génération de l'icône PWA temporaire) — pas
    // servi par l'app, pas de raison de suivre les règles TS/React du bundle.
    "scripts/**",
  ]),
]);

export default eslintConfig;
