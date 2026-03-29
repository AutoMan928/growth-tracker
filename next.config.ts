import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 不用 standalone（PM2 直接 next start 即可）
  serverExternalPackages: ["@prisma/client", "prisma"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
