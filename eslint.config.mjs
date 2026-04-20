import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/node_modules/**",
      // Package trees run their own ESLint (Next, Expo, Nest configs differ).
      "apps/**",
      "tracebud-backend/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
]
export default eslintConfig
