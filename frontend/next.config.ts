import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serverless function configuration for Vercel
  serverExternalPackages: ["@react-pdf/renderer", "groq-sdk"],
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Enable React strict mode
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            // Explicitly define a secure Content Security Policy that restricts execution to safe sources
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' *;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;