'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { ShieldCheck, MapPin, Calendar, Briefcase, Lock, CheckCircle2 } from 'lucide-react';

interface MaskedTrustData {
  uid: string;
  displayName: string;
  city: string | null;
  country: string;
  role: 'client' | 'partner';
  verificationStatus: string;
  isPhoneVerified: boolean;
  memberSince: string;
  partnerSummary?: {
    businessName?: string;
    classification: string;
    operatingRegions: string[];
    servicesOffered?: string[];
    skillNames?: string[];
    capabilities?: string;
  } | null;
  clientSummary?: {
    businessName?: string;
    businessInfo?: string;
    industryName?: string;
    requirementsPostedCount?: number;
  } | null;
}

export default function PublicTrustProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [profile, setProfile] = useState<MaskedTrustData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/trust/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Trust profile unavailable');
        }
        if (active) setProfile(data.profile || data.trustProfile || data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load trust profile');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
      <Navbar />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 animate-pulse h-72" />
          ) : error || !profile ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center">
              <h1 className="text-xl font-bold">XPO Masked Trust Profile</h1>
              <p className="mt-2 text-sm text-[#6B7280]">{error || 'Profile not found.'}</p>
              <Link
                href="/"
                className="mt-6 inline-flex px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-semibold"
              >
                Back to XPO Home
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-extrabold">{profile.displayName}</h1>
                    {profile.verificationStatus === 'verified' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> KYC Verified
                      </span>
                    )}
                  </div>
                  {(profile.partnerSummary?.businessName || profile.clientSummary?.businessName) && (
                    <p className="text-sm text-[#6B7280] mt-1">
                      {profile.partnerSummary?.businessName || profile.clientSummary?.businessName}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-bold uppercase">
                  <Briefcase className="w-3 h-3 text-[#E8192C]" />
                  {profile.role}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-[#F3F4F6] text-xs">
                <div className="flex items-center gap-2 text-[#374151]">
                  <MapPin className="w-4 h-4 text-[#6B7280]" />
                  <span>{[profile.city, profile.country].filter(Boolean).join(', ') || 'India'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#374151]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {profile.isPhoneVerified ? 'WhatsApp Phone Verified' : 'Account Registered'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#374151]">
                  <Calendar className="w-4 h-4 text-[#6B7280]" />
                  <span>
                    Member since{' '}
                    {profile.memberSince
                      ? new Date(profile.memberSince).toLocaleDateString()
                      : 'XPO'}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {profile.partnerSummary && (
                  <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs space-y-2">
                    <div className="font-bold text-[#111827]">Partner Capability Summary</div>
                    <p className="text-[#374151]">
                      Classification: <strong>{profile.partnerSummary.classification}</strong>
                    </p>
                    {profile.partnerSummary.capabilities && (
                      <p className="text-[#4B5563] leading-relaxed">
                        {profile.partnerSummary.capabilities}
                      </p>
                    )}
                    {profile.partnerSummary.operatingRegions?.length > 0 && (
                      <p className="text-[#6B7280]">
                        Operating Locations: {profile.partnerSummary.operatingRegions.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {profile.clientSummary && (
                  <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs space-y-1.5">
                    <div className="font-bold text-[#111827]">Client Summary</div>
                    {profile.clientSummary.industryName && (
                      <p className="text-[#374151]">Industry: {profile.clientSummary.industryName}</p>
                    )}
                    {profile.clientSummary.businessInfo && (
                      <p className="text-[#4B5563]">{profile.clientSummary.businessInfo}</p>
                    )}
                  </div>
                )}

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <strong>Privacy Protected by XPO Mutual Consent:</strong> Direct phone number,
                    WhatsApp link, and email address remain masked until both Client and Partner
                    accept a connection inside XPO WhatsApp or Web.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
