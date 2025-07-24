/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during build for advanced features MVP
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable static generation for auth pages to prevent prerender errors
  output: 'standalone',
  
  // Enable experimental features for better performance
  experimental: {
    // Enable optimizePackageImports for faster builds
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      '@hookform/resolvers',
      'react-hook-form',
      'zod',
      'sonner'
    ],
  },
  
  // External packages for server components
  serverExternalPackages: ['sharp'],
  
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    // Enable image optimization
    formats: ['image/webp', 'image/avif'],
    // Add domains for external images if needed
    domains: ['images.unsplash.com'],
    // Allow SVG images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Configure sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Configure remote patterns for Cloudinary and Unsplash
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            enforce: true,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 20,
            enforce: true,
          },
          ui: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            priority: 15,
            enforce: true,
          },
          admin: {
            test: /[\\/]src[\\/]features[\\/]admin[\\/]/,
            name: 'admin',
            priority: 12,
            enforce: true,
          },
        },
      }
      
      // Enable tree shaking
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }
    
    // Alias for better import resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    }
    
    return config
  },
  
  // Enable static optimization
  trailingSlash: false,
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
