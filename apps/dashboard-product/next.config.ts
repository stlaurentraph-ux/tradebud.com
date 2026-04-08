import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // React Compiler disabled - requires babel-plugin-react-compiler
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
