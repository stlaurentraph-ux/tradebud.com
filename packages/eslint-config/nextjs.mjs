import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const sharedIgnores = [
  "**/.next/**",
  "**/out/**",
  "**/build/**",
  "**/dist/**",
  "**/node_modules/**",
]

/** @param {string[]=} extraIgnores */
export function createNextjsEslintConfig(extraIgnores = []) {
  return [
    {
      ignores: [...sharedIgnores, ...extraIgnores],
    },
    ...nextVitals,
    ...nextTs,
  ]
}

export default createNextjsEslintConfig()
