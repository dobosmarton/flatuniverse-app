/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  experimental: {
    legacyBrowsers: false,
    outputFileTracingIgnores: ['**canvas**'],
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/**/*',
        'node_modules/@esbuild/**/*',
        'node_modules/terser/**/*',
        'node_modules/webpack/**/*',
      ],
    },
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/tiktoken/tiktoken_bg.wasm'],
    },
  },
};

export default nextConfig;
