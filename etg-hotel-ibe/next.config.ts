import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ============================================
  // NEXT.JS 16.0.1 ENTERPRISE CONFIGURATION
  // ETG Hotel IBE - 3M Hotels Scale
  // ============================================

  // React Compiler (Stable in v16) - Automatic memoization
  reactCompiler: true,

  // Cache Components (NEW in v16) - Explicit caching with "use cache"
  cacheComponents: true,

  // Turbopack Configuration (Stable in v16)
  turbopack: {
    // File system caching for faster startup
    fileSystemCache: true,
  },

  // Image Optimization for 3M hotel images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ratehawk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        pathname: '/**',
      },
    ],
    // v16 defaults
    minimumCacheTTL: 14400, // 4 hours
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Server Actions Configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },

  // Performance Optimizations
  compress: true, // Gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security

  // TypeScript Configuration
  typescript: {
    // Fail build on type errors in production
    ignoreBuildErrors: false,
  },

  // ESLint Configuration
  eslint: {
    // Fail build on lint errors in production
    ignoreDuringBuilds: false,
  },

  // Headers for Security & Performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
