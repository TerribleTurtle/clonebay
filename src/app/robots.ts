import { MetadataRoute } from 'next';
import { SITE_URL } from '../config/constants';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/callback', '/settings', '/debug'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
