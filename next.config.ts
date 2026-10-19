import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false,
  partialPrefetching: false,
  experimental: {
    inlineCss: true,
  },
};

export default nextConfig;
