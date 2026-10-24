'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminCampaignsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/whatsapp/campaigns');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-[#717171]">
      Redirecting to WhatsApp Campaigns Manager...
    </div>
  );
}