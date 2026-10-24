'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PostLeadRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/creator/dashboard?openPost=true');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#E8192C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-700">Opening requirement form...</p>
        <p className="text-xs text-slate-400 mt-1">Directing you to the Client Requirement Hub</p>
      </div>
    </div>
  );
}
