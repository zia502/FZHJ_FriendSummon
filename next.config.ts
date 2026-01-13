import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: "25mb",
  },
  images: {
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/uploads/**", search: "?v=*" },
    ],
  },
};

export default nextConfig;
