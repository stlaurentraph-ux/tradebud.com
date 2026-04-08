import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler disabled - requires babel-plugin-react-compiler
  turbopack: {
    root: "/vercel/share/v0-project",
  },
};

export default nextConfig;
