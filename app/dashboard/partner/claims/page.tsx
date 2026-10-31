'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PartnerClaimsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/partner/offers?tab=applied');
  }, [router]);

  return (
    <div className="min-h-[200px] flex items-center justify-center text-xs text-[#6B7280]">
      <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#E8192C]" />
      Redirecting to Applied Leads...
    </div>
  );
}
