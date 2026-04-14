import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const backendOverrides = {
  files: ["src/**/*.{ts,tsx}"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
};

export default [...nextVitals, ...nextTs, backendOverrides];
