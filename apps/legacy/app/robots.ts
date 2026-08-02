import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/articles'],
      disallow: ['/terms', '/privacy', '/chat'],
    },
    sitemap: 'https://www.flatuniverse.app/sitemap.xml',
  };
}
