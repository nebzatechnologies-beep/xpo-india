import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'XPO — WhatsApp-First B2B Client & Partner Marketplace',
  description:
    'XPO connects Clients and verified Partners across industries through AI-guided WhatsApp onboarding, 5-minute lead distribution, and mutual-consent contact privacy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen bg-[#F8F9FA] text-[#111827] antialiased selection:bg-[#E8192C] selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
