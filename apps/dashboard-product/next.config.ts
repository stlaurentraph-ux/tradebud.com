import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler disabled - requires babel-plugin-react-compiler
  turbopack: {
    root: "../../",
  },
};

export default nextConfig;
