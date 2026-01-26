import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/robots.txt",
        destination: "/robots",
      },
      {
        source: "/sitemap.xml",
        destination: "/sitemap",
      },
    ];
  },
};

export default nextConfig;
