import { createNextjsEslintConfig } from "./packages/eslint-config/nextjs.mjs"

/** Root lint: OpenAPI governance scripts only — apps use @tracebud/eslint-config/nextjs. */
export default createNextjsEslintConfig([
  "apps/**",
  "tracebud-backend/**",
  "legacy/**",
  "packages/**",
])
