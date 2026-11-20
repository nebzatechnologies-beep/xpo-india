import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'XPO India — Verified B2B Leads & 5-Minute Partner Matching',
    short_name: 'XPO India',
    description:
      'Post what your business needs in plain words and connect with GST-verified Indian partners in 5-minute waves. Zero commission.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F6F4',
    theme_color: '#C8102E',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
