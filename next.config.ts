import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The workspace root holds an unrelated package-lock.json; without this,
  // Turbopack walks up and infers the wrong project root.
  turbopack: { root: __dirname },
};

export default nextConfig;
