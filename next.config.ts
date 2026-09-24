import type { NextConfig } from "next";

// Avatars are served by the PHP API on go54, so next/image has to be told that
// host is allowed. Derived from the same env var the API client uses, so there
// is no second place to update when the API moves.
const apiHost = process.env.PREP_API_URL
  ? new URL(process.env.PREP_API_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // The workspace root holds an unrelated package-lock.json; without this,
  // Turbopack walks up and infers the wrong project root.
  turbopack: { root: __dirname },
  images: apiHost
    ? { remotePatterns: [{ protocol: "https", hostname: apiHost }] }
    : undefined,
};

export default nextConfig;
