import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/dashboard', '/chalans', '/orders', '/transactions'],
    },
    sitemap: 'https://trusttraders.com/sitemap.xml',
  };
}
