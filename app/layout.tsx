import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'XPO India — Sector-Agnostic Opportunity & Lead Exchange',
  description:
    'Client meets Partner. Someone needs something. Someone provides it. XPO India connects Clients and Partners across all industries directly with zero platform commission.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className={`${jakarta.className} min-h-screen bg-[#F8F9FA] text-[#111827] antialiased selection:bg-[#E8192C] selection:text-white`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}