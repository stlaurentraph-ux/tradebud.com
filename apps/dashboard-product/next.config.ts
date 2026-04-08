import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  // React Compiler disabled - requires babel-plugin-react-compiler
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
