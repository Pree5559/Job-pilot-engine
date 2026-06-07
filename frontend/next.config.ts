import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serverless function configuration for Vercel
  serverExternalPackages: ["@react-pdf/renderer", "groq-sdk"],
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Enable React strict mode
  reactStrictMode: true,
};

export default nextConfig;