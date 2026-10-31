import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#EBEBEB] p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#222222]">Access Restricted</h1>
        <p className="mt-2 text-sm text-[#717171]">
          Your current session does not have permission to view this control module. Switch roles
          from your XPO Workspace or sign in with an authorized Superadmin account.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-xl bg-[#222222] text-white text-xs font-semibold hover:bg-black"
          >
            Go to Customer Workspace
          </Link>
          <Link
            href="/login"
            className="px-4 py-2.5 rounded-xl border border-[#DDDDDD] text-[#222222] text-xs font-semibold hover:bg-[#F7F7F7]"
          >
            Sign In Again
          </Link>
        </div>
      </div>
    </div>
  );
}
