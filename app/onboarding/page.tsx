'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import type { CustomerRole, PartnerClassification } from '@/lib/types/domain';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profiles, refreshSession } = useAuth();

  const resolvedRole: CustomerRole =
    user?.role || (searchParams.get('role') === 'partner' ? 'partner' : 'client');

  const [displayName, setDisplayName] = useState('');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessInfo, setBusinessInfo] = useState('');
  const [partnerClassification, setPartnerClassification] =
    useState<PartnerClassification>('Software Agency');
  const [operatingRegions, setOperatingRegions] = useState('Pan-India');
  const [servicesText, setServicesText] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [capabilities, setCapabilities] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydratedRef = useRef(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!user || hydratedRef.current) return;
    hydratedRef.current = true;

    if (user.displayName) setDisplayName(user.displayName);
    if (user.phoneE164) setPhoneRaw(user.phoneE164);
    if (user.primaryCity) setCity(user.primaryCity);
    if (user.state) setStateName(user.state);

    if (resolvedRole === 'client' && profiles.client) {
      if (profiles.client.businessName) setCompanyName(profiles.client.businessName);
      if (profiles.client.businessInfo) setBusinessInfo(profiles.client.businessInfo);
    }
    if (resolvedRole === 'partner' && profiles.partner) {
      if (profiles.partner.businessName) setCompanyName(profiles.partner.businessName);
      if (profiles.partner.servicesOffered?.length) {
        setServicesText(profiles.partner.servicesOffered.join(', '));
      }
      if (profiles.partner.skillNames?.length) {
        setSkillsText(profiles.partner.skillNames.join(', '));
      }
      if (profiles.partner.capabilities) {
        setCapabilities(profiles.partner.capabilities);
      }
    }
  }, [user, profiles, resolvedRole]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    let redirected = false;
    try {
      setSaving(true);
      const profileUpdates: Record<string, unknown> = {};
      if (resolvedRole === 'partner') {
        const servicesOffered = servicesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const skillNames = skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        profileUpdates.name = displayName.trim();
        profileUpdates.businessName = companyName.trim();
        profileUpdates.partnerClassification = partnerClassification;
        profileUpdates.city = city.trim();
        profileUpdates.operatingRegions = operatingRegions
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        profileUpdates.servicesOffered = servicesOffered;
        profileUpdates.skillNames = skillNames.length > 0 ? skillNames : servicesOffered;
        profileUpdates.capabilities =
          capabilities.trim() || servicesOffered.join(', ');
        profileUpdates.availability = 'available';
      } else {
        profileUpdates.contactName = displayName.trim();
        profileUpdates.businessName = companyName.trim();
        profileUpdates.businessInfo = businessInfo.trim();
        profileUpdates.city = city.trim();
        profileUpdates.location = city.trim();
      }

      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          role: resolvedRole,
          userUpdates: {
            displayName: displayName.trim(),
            primaryCity: city.trim(),
            state: stateName.trim(),
            ...(phoneRaw.trim() && !user?.phoneE164 ? { phoneRaw: phoneRaw.trim() } : {}),
          },
          businessUpdates: companyName.trim()
            ? {
                companyName: companyName.trim(),
                city: city.trim() || undefined,
                state: stateName.trim() || undefined,
                businessInfo: businessInfo.trim() || undefined,
              }
            : undefined,
          profileUpdates,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save onboarding profile');
      }
      await refreshSession();
      redirected = true;
      router.push(resolvedRole === 'partner' ? '/dashboard/partner' : '/dashboard/client');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      if (!redirected) {
        submittingRef.current = false;
        setSaving(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />{' '}
          {resolvedRole === 'partner' ? 'Partner Profile Setup' : 'Client Profile Setup'}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-[#111827]">
          Activate Your XPO {resolvedRole === 'partner' ? 'Partner' : 'Client'} Profile
        </h1>
        <p className="mt-1 text-xs text-[#6B7280]">
          {resolvedRole === 'partner'
            ? 'Set up your services, expertise, and operating locations so XPO sends matching 5-minute Client leads to your WhatsApp.'
            : 'Complete your business & location details to post requirements free and connect with verified Partners.'}
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Location / City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bengaluru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">State / Region</label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="Karnataka"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Business / Organization Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Ventures Pvt Ltd"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
              />
            </div>
          </div>

          {!user?.phoneE164 && (
            <div>
              <label className="block text-xs font-semibold mb-1">
                WhatsApp / Mobile Number {resolvedRole === 'partner' ? '(Required for 5-Min Lead Matching)' : '(Recommended)'}
              </label>
              <input
                type="tel"
                required={resolvedRole === 'partner'}
                value={phoneRaw}
                onChange={(e) => setPhoneRaw(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
              />
            </div>
          )}

          {resolvedRole === 'client' ? (
            <div>
              <label className="block text-xs font-semibold mb-1">
                Business Information (Products / Services You Typically Procure)
              </label>
              <textarea
                rows={3}
                value={businessInfo}
                onChange={(e) => setBusinessInfo(e.target.value)}
                placeholder="Briefly describe your company and the types of vendors or professionals you work with..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1">Partner Classification</label>
                <select
                  value={partnerClassification}
                  onChange={(e) => setPartnerClassification(e.target.value as PartnerClassification)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-sm"
                >
                  <option value="Software Agency">Software Agency</option>
                  <option value="Agency">Marketing / Service Agency</option>
                  <option value="Consultant">Consultant / Advisory Firm</option>
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Supplier">Supplier / Distributor</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Freelancer">Freelancer / Independent Specialist</option>
                  <option value="Design Studio">Design Studio</option>
                  <option value="Other Professional">Other Professional</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Services Offered (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={servicesText}
                  onChange={(e) => setServicesText(e.target.value)}
                  placeholder="Web Development, ERP Implementation, Industrial Packaging"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Expertise & Skill Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="Next.js, Cloud Architecture, GST Audit, CNC Machining"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Operating Locations (comma-separated)
                </label>
                <input
                  type="text"
                  value={operatingRegions}
                  onChange={(e) => setOperatingRegions(e.target.value)}
                  placeholder="Bengaluru, Mumbai, Pan-India, Global"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Capability Summary
                </label>
                <textarea
                  rows={2}
                  value={capabilities}
                  onChange={(e) => setCapabilities(e.target.value)}
                  placeholder="Short pitch shown to Clients once they unlock your Partner profile..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Activating Profile...</span>
              </>
            ) : (
              <>
                <span>Activate & Open Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
