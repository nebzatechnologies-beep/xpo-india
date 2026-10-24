'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDatabaseRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/crm');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-[#717171]">
      Redirecting to Company CRM Database...
    </div>
  );
}