// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/private/', '/cart', '/profile', '/orders'],
    },
    sitemap: 'https://neelamrit.in/sitemap.xml',
  };
}