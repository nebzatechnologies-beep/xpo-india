'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { PartnerClassification, PartnerRoleProfile } from '@/lib/types/domain';
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';

interface TaxonomyCategoryOption {
  id: string;
  name: string;
  sectorName: string;
}

const CLASSIFICATIONS: PartnerClassification[] = [
  'Freelancer',
  'Software Agency',
  'Design Studio',
  'Consultant',
  'Manufacturer',
  'Supplier',
  'Contractor',
  'Distributor',
  'Agency',
  'Other Professional',
];

export default function PartnerCapabilityProfilePage() {
  const { user, profiles, refreshSession } = useAuth();
  const partner = profiles.partner as PartnerRoleProfile | null;

  const [categories, setCategories] = useState<TaxonomyCategoryOption[]>([]);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>(partner?.categoryIds || []);
  const [classification, setClassification] = useState<PartnerClassification>(
    partner?.partnerClassification || 'Software Agency'
  );
  const [businessName, setBusinessName] = useState(partner?.businessName || '');
  const [city, setCity] = useState(partner?.city || user?.primaryCity || '');
  const [phoneRaw, setPhoneRaw] = useState(user?.phoneE164 || '');
  const [servicesOffered, setServicesOffered] = useState(
    (partner?.servicesOffered || []).join(', ')
  );
  const [skills, setSkills] = useState((partner?.skillNames || []).join(', '));
  const [regions, setRegions] = useState(
    (partner?.operatingRegions || ['Pan India']).join(', ')
  );
  const [capabilities, setCapabilities] = useState(partner?.capabilities || '');
  const [portfolioUrl, setPortfolioUrl] = useState(partner?.portfolioUrl || '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const savingRef = useRef(false);

  useEffect(() => {
    async function loadCats() {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        const flat: TaxonomyCategoryOption[] = [];
        for (const s of data.tree || []) {
          for (const c of s.categories || []) {
            flat.push({ id: c.id, name: c.name, sectorName: s.name });
          }
        }
        setCategories(flat);
      }
    }
    void loadCats();
  }, []);

  useEffect(() => {
    if (partner) {
      setSelectedCatIds(partner.categoryIds || []);
      setClassification(partner.partnerClassification || 'Software Agency');
      if (partner.businessName) setBusinessName(partner.businessName);
      if (partner.city) setCity(partner.city);
      setServicesOffered((partner.servicesOffered || []).join(', '));
      setSkills((partner.skillNames || []).join(', '));
      setRegions((partner.operatingRegions || ['Pan India']).join(', '));
      setCapabilities(partner.capabilities || '');
      setPortfolioUrl(partner.portfolioUrl || '');
    }
    if (user?.primaryCity && !city) setCity(user.primaryCity);
    if (user?.phoneE164 && !phoneRaw) setPhoneRaw(user.phoneE164);
  }, [partner, user, city, phoneRaw]);

  function toggleCategory(id: string) {
    setSelectedCatIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      setSaving(true);
      setSavedMsg(null);
      setErrorMsg(null);
      const parsedServices = servicesOffered
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedSkills = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          role: 'partner',
          userUpdates: {
            primaryCity: city.trim(),
            ...(phoneRaw.trim() && !user?.phoneE164 ? { phoneRaw: phoneRaw.trim() } : {}),
          },
          businessUpdates: businessName.trim()
            ? {
                companyName: businessName.trim(),
                city: city.trim() || undefined,
              }
            : undefined,
          profileUpdates: {
            name: user?.displayName,
            businessName: businessName.trim(),
            city: city.trim(),
            partnerClassification: classification,
            categoryIds: selectedCatIds,
            servicesOffered: parsedServices,
            skillNames: parsedSkills,
            operatingRegions: regions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            capabilities: capabilities.trim(),
            portfolioUrl: portfolioUrl.trim(),
          },
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update profile');
      }
      await refreshSession();
      setSavedMsg('Partner services, categories & locations saved successfully.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">Partner Services & Profile</h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Select your services, expertise, categories, and locations for automatic 5-minute WhatsApp
          lead matching ({user?.phoneE164 || 'Account'}).
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5">
              Business / Studio / Brand Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="CloudCraft Studio Ltd"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5">
              Base City / Headquarters
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bengaluru"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
            />
          </div>
        </div>

        {!user?.phoneE164 && (
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5">
              WhatsApp / Mobile Number * (Required for 5-minute lead alerts)
            </label>
            <input
              type="tel"
              required
              value={phoneRaw}
              onChange={(e) => setPhoneRaw(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#111827] mb-1.5">
            Partner Classification
          </label>
          <select
            value={classification}
            onChange={(e) => setClassification(e.target.value as PartnerClassification)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs"
          >
            {CLASSIFICATIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111827] mb-1.5">
            Services & Products Offered (comma-separated)
          </label>
          <input
            type="text"
            value={servicesOffered}
            onChange={(e) => setServicesOffered(e.target.value)}
            placeholder="Custom SaaS Development, CNC Turning, Corrugated Packaging, Solar EPC"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111827] mb-2">
            Categories ({selectedCatIds.length} selected)
          </label>
          <div className="max-h-56 overflow-y-auto p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map((cat) => {
              const checked = selectedCatIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`text-left px-3 py-2 rounded-lg text-xs border transition ${
                    checked
                      ? 'bg-[#111827] text-white border-[#111827] font-semibold'
                      : 'bg-white text-[#374151] border-[#E5E7EB]'
                  }`}
                >
                  <div>{cat.name}</div>
                  <div className={`text-[10px] ${checked ? 'text-gray-300' : 'text-[#9CA3AF]'}`}>
                    {cat.sectorName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111827] mb-1.5">
            Locations / Operating Regions (comma-separated)
          </label>
          <input
            type="text"
            value={regions}
            onChange={(e) => setRegions(e.target.value)}
            placeholder="Bengaluru, Mumbai, Delhi NCR, Pan India, Remote"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111827] mb-1.5">
            Expertise & Technical Skills (comma-separated)
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="ISO 9001, Next.js, Sheet Metal, Statutory Audit"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111827] mb-1.5">
            Capabilities Summary
          </label>
          <textarea
            rows={3}
            value={capabilities}
            onChange={(e) => setCapabilities(e.target.value)}
            placeholder="Describe capacity, turnaround timelines, certifications, and past work..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111827] mb-1.5">
            Portfolio / Website URL (optional)
          </label>
          <input
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://yourcompany.in"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111827] text-white text-xs font-bold hover:bg-black disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save Partner Profile'}</span>
        </button>
      </form>
    </div>
  );
}
