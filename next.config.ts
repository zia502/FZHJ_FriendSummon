import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/uploads/**", search: "?v=*" },
    ],
  },
};

export default nextConfig;
