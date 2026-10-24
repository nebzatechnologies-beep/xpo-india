'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminCategoriesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/taxonomy/categories');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-[#717171]">
      Redirecting to Taxonomy Categories Engine...
    </div>
  );
}