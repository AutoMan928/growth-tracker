import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma"],
  // 跳过构建时 TypeScript 类型检查（节省服务器内存）
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
