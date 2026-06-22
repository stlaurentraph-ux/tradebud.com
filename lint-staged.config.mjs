/** @type {import('lint-staged').Configuration} */
const config = {
  "apps/dashboard-product/**/*.{js,jsx,ts,tsx,mjs}":
    "eslint --config packages/eslint-config/nextjs.mjs --max-warnings 0",
  "apps/marketing/**/*.{js,jsx,ts,tsx,mjs}":
    "eslint --config packages/eslint-config/nextjs.mjs --max-warnings 0",
  "apps/field-auth/**/*.{js,jsx,ts,tsx,mjs}":
    "eslint --config packages/eslint-config/nextjs.mjs --max-warnings 0",
  "tracebud-backend/src/**/*.{js,ts}": (files) => {
    const relative = files.map((file) => file.replace(/^tracebud-backend\//, ""));
    return [
      `bash -c 'cd tracebud-backend && eslint --config eslint.config.mjs --max-warnings 0 ${relative.map((f) => `"${f}"`).join(" ")}'`,
    ];
  },
  "scripts/**/*.{js,mjs}": "eslint --max-warnings 0",
};

export default config;
