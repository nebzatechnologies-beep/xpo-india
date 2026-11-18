import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://xpoindia.com'),
  applicationName: 'XPO India',
  title: {
    default: 'XPO India — Verified B2B Leads & 5-Minute Partner Matching',
    template: '%s · XPO India',
  },
  description:
    'Tell us what your business needs in plain words. We match GST-verified Indian partners in 5-minute waves and connect you directly — zero commission.',
  appleWebApp: {
    capable: true,
    title: 'XPO India',
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    siteName: 'XPO India',
    url: 'https://xpoindia.com',
    title: 'XPO India — Verified B2B Leads & 5-Minute Partner Matching',
    description:
      'Post what you need in plain words. Connect with GST-verified Indian partners in 5-minute waves. Zero commission.',
  },
};

export const viewport: Viewport = {
  themeColor: '#C8102E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#F6F6F4] text-[#15171C] antialiased selection:bg-[#C8102E] selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
