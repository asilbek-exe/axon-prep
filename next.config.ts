import type { NextConfig } from "next";
const config: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  output: "export",
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};
export default config;
