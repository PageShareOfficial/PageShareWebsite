import { withSentryConfig } from '@sentry/nextjs';
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Custom loader to handle SSL certificate issues
    loader: 'default',
    // Disable strict SSL checking for image optimization (development only)
    // This helps with self-signed certificates
    ...(process.env.NODE_ENV === 'development' && {
      // In development, we can be more lenient with SSL
    }),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
      },
      // Allow images from common news sources
      {
        protocol: 'https',
        hostname: 'static.india.com',
      },
      {
        protocol: 'https',
        hostname: '**.static.india.com',
      },
      {
        protocol: 'https',
        hostname: '**.cdn.ampproject.org',
      },
      {
        protocol: 'https',
        hostname: '**.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.wp.com',
      },
      {
        protocol: 'https',
        hostname: '**.blogspot.com',
      },
      {
        protocol: 'https',
        hostname: '**.medium.com',
      },
      {
        protocol: 'https',
        hostname: '**.reuters.com',
      },
      // Google profile pictures (OAuth)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Supabase Storage (profile pictures, media)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.bbc.com',
      },
      {
        protocol: 'https',
        hostname: '**.cnn.com',
      },
    ],
    // Allow any external image domain (required for news articles from various sources)
    // We'll use unoptimized images in NewsCard to handle unknown domains gracefully
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  ...(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
    ? { org: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT }
    : {}),
});
