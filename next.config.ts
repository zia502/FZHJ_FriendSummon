import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/uploads/**", search: "?v=*" },
    ],
  },
};

export default nextConfig;
