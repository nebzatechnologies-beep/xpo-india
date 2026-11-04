import React from 'react';
import { XpoClientApp } from '@/components/creator/xpo-client-app';

export const metadata = {
  title: 'XPO India — End-to-End Client & Partner Workspace',
  description:
    'Tell us what you need in plain words. We match up to 10 verified Indian businesses in 5-minute waves and connect you directly on WhatsApp.',
};

export default function HomePage() {
  return <XpoClientApp initialScreen="home" />;
}
