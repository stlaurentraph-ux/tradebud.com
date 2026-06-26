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
    {
      // Honor the repo-wide convention that a leading underscore marks an
      // intentionally-unused binding (params, locals, caught errors).
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],
      },
    },
  ]
}

export default createNextjsEslintConfig()
