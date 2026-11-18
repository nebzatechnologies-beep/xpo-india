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
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
