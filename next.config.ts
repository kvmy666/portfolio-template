import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
        condition: {
          not: { path: /internal[\\/]font[\\/]google/ },
        },
      },
    },
  },
};

export default nextConfig;
