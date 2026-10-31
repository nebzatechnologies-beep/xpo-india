'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExcelImporterPanel } from '@/components/admin/excel-importer-panel';
import { ContactDetailDrawer } from '@/components/crm/contact-detail-modal';
import type {
  CrmContact,
  CrmDatabaseType,
  WhatsAppCampaign,
  WhatsAppTemplateRecord,
} from '@/lib/types/domain';
import type { RoleInvitePreview } from '@/lib/services/campaigns';
import {
  CheckCircle2,
  Database,
  Plus,
  Search,
  Send,
  ShieldCheck,
  UploadCloud,
  UserCheck,
} from 'lucide-react';

interface RoleDatabaseWorkspaceProps {
  databaseType: CrmDatabaseType;
}

export function RoleDatabaseWorkspace({ databaseType }: RoleDatabaseWorkspaceProps) {
  const isClient = databaseType === 'client';
  const roleLabel = isClient ? 'Client' : 'Partner';

  const [activeTab, setActiveTab] = useState<'directory' | 'upload' | 'invitations'>('directory');
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [consentFilter, setConsentFilter] = useState('');
  const [inviteStatusFilter, setInviteStatusFilter] = useState('');

  // Quick Add Inline Form
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [phoneRaw, setPhoneRaw] = useState('');
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [hasConsent, setHasConsent] = useState(true);
  const [quickAddBusy, setQuickAddBusy] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Bulk Invitations Tab State
  const [templates, setTemplates] = useState<WhatsAppTemplateRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    isClient ? 'tpl_client_invite' : 'tpl_partner_invite'
  );
  const [inviteCity, setInviteCity] = useState('');
  const [onlyUninvited, setOnlyUninvited] = useState(true);
  const [campaignName, setCampaignName] = useState('');
  const [invitePreview, setInvitePreview] = useState<RoleInvitePreview | null>(null);
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [inviteBusy, setInviteBusy] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams({ databaseType });
      if (search.trim()) q.set('search', search.trim());
      if (consentFilter) q.set('consentStatus', consentFilter);
      if (inviteStatusFilter) q.set('invitationStatus', inviteStatusFilter);
      const res = await fetch(`/api/crm/contacts?${q.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setContacts(d.contacts || []);
      }
    } finally {
      setLoading(false);
    }
  }, [databaseType, search, consentFilter, inviteStatusFilter]);

  const loadInvitationsData = useCallback(async () => {
    const q = new URLSearchParams({
      previewRoleInvite: databaseType,
      onlyUninvited: String(onlyUninvited),
    });
    if (inviteCity.trim()) q.set('city', inviteCity.trim());

    const [prevRes, campRes, tplRes] = await Promise.all([
      fetch(`/api/admin/whatsapp/campaigns?${q.toString()}`),
      fetch(`/api/admin/whatsapp/campaigns?databaseType=${databaseType}`),
      fetch('/api/admin/whatsapp/templates'),
    ]);

    if (prevRes.ok) {
      const d = await prevRes.json();
      setInvitePreview(d.preview || null);
    }
    if (campRes.ok) {
      const d = await campRes.json();
      setCampaigns(d.campaigns || []);
    }
    if (tplRes.ok) {
      const tpls: WhatsAppTemplateRecord[] = ((await tplRes.json()).templates || []).filter(
        (t: WhatsAppTemplateRecord) => t.metaStatus === 'APPROVED'
      );
      setTemplates(tpls);
    }
  }, [databaseType, inviteCity, onlyUninvited]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (activeTab === 'invitations') {
      void loadInvitationsData();
    }
  }, [activeTab, loadInvitationsData]);

  const stats = useMemo(() => {
    const total = contacts.length;
    const consented = contacts.filter((c) => c.consentStatus === 'opted_in').length;
    const invited = contacts.filter(
      (c) => c.invitationStatus && c.invitationStatus !== 'not_invited'
    ).length;
    const registered = contacts.filter(
      (c) => Boolean(c.linkedUid) || c.invitationStatus === 'registered'
    ).length;
    return { total, consented, invited, registered };
  }, [contacts]);

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    setBannerMsg(null);
    try {
      setQuickAddBusy(true);
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          databaseType,
          phoneRaw,
          confirmedCountry: 'IN',
          contactName,
          companyName,
          city,
          ...(isClient
            ? { businessInfo: extraInfo }
            : {
                servicesOffered: extraInfo
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
                categoryName,
              }),
          roles: [databaseType],
          consentStatus: hasConsent ? 'opted_in' : 'none',
          source: `Superadmin ${roleLabel} Database`,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Could not add contact');
      setPhoneRaw('');
      setContactName('');
      setCompanyName('');
      setCity('');
      setExtraInfo('');
      setCategoryName('');
      setShowQuickAdd(false);
      setBannerMsg({
        type: 'ok',
        text: `${roleLabel} contact saved to ${roleLabel} Database.`,
      });
      await loadContacts();
    } catch (err) {
      setBannerMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to save contact',
      });
    } finally {
      setQuickAddBusy(false);
    }
  }

  async function handleLaunchInvitations(e: React.FormEvent) {
    e.preventDefault();
    setBannerMsg(null);
    try {
      setInviteBusy(true);
      const res = await fetch('/api/admin/whatsapp/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'launch_role_invitations',
          databaseType,
          name: campaignName.trim() || undefined,
          templateId: selectedTemplateId,
          city: inviteCity.trim() || undefined,
          onlyUninvited,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Bulk invitation dispatch failed');
      setCampaignName('');
      setBannerMsg({
        type: 'ok',
        text: `Sent ${d.campaign?.sentCount || 0} WhatsApp invitations to consented ${roleLabel}s!`,
      });
      await Promise.all([loadInvitationsData(), loadContacts()]);
    } catch (err) {
      setBannerMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Bulk invitation dispatch failed',
      });
    } finally {
      setInviteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111827]">
            {roleLabel} Database
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            {isClient
              ? 'Upload potential Clients (names, WhatsApp numbers, locations & business info) and send approved WhatsApp invitations.'
              : 'Upload potential Partners (names, WhatsApp numbers, locations, services, categories & subcategories) and send approved WhatsApp invitations.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white hover:bg-gray-50 text-xs font-bold text-[#111827]"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#E8192C]" /> Upload {roleLabel} Excel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invitations')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E8192C] hover:bg-[#c81324] text-white text-xs font-bold shadow-xs"
          >
            <Send className="w-3.5 h-3.5" /> Bulk WhatsApp Invitations
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Uploaded {roleLabel}s</span>
            <Database className="w-4 h-4 text-[#111827]" />
          </div>
          <div className="text-2xl font-black text-[#111827] mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Verified Consent (Opt-In)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.consented}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>WhatsApp Invited</span>
            <Send className="w-4 h-4 text-[#E8192C]" />
          </div>
          <div className="text-2xl font-black text-[#111827] mt-1">{stats.invited}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Activated Accounts</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#111827] mt-1">{stats.registered}</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1.5 border-b border-[#E5E7EB] pb-2 text-xs">
        {[
          { id: 'directory', label: `1. ${roleLabel} Directory (${contacts.length})` },
          { id: 'upload', label: `2. ${roleLabel} Excel Upload` },
          { id: 'invitations', label: `3. Bulk WhatsApp Invitations` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl font-bold transition ${
              activeTab === tab.id
                ? 'bg-[#111827] text-white'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {bannerMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium ${
            bannerMsg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {bannerMsg.text}
        </div>
      )}

      {/* TAB 1: DIRECTORY & INLINE DOSSIER */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search ${roleLabel.toLowerCase()} name, phone, city...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D1D5DB] text-xs"
                  />
                </div>
                <select
                  value={consentFilter}
                  onChange={(e) => setConsentFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
                >
                  <option value="">All Consent Statuses</option>
                  <option value="opted_in">Opted In (Ready to Invite)</option>
                  <option value="none">Missing Consent</option>
                  <option value="opted_out">Opted Out (Suppressed)</option>
                </select>
                <select
                  value={inviteStatusFilter}
                  onChange={(e) => setInviteStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
                >
                  <option value="">All Invitation Stages</option>
                  <option value="not_invited">Not Invited Yet</option>
                  <option value="invited">Invited on WhatsApp</option>
                  <option value="responded">Responded</option>
                  <option value="registered">Registered Account</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowQuickAdd((prev) => !prev)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-bold shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add {roleLabel}
              </button>
            </div>

            {showQuickAdd && (
              <form
                onSubmit={handleQuickAdd}
                className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
              >
                <input
                  type="text"
                  required
                  placeholder={`${roleLabel} Name *`}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
                />
                <input
                  type="tel"
                  required
                  placeholder="WhatsApp Number (+919876543210) *"
                  value={phoneRaw}
                  onChange={(e) => setPhoneRaw(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
                />
                <input
                  type="text"
                  placeholder="Location / City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
                />
                <input
                  type="text"
                  placeholder="Business / Agency Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
                />
                {!isClient && (
                  <input
                    type="text"
                    placeholder="Primary Category (e.g., CNC Machining)"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
                  />
                )}
                <input
                  type="text"
                  placeholder={
                    isClient
                      ? 'Business Information (products/services needed)'
                      : 'Services Offered (comma-separated)'
                  }
                  value={extraInfo}
                  onChange={(e) => setExtraInfo(e.target.value)}
                  className={`px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white ${
                    isClient ? 'sm:col-span-2' : ''
                  }`}
                />
                <label className="inline-flex items-center gap-2 text-xs text-[#374151] sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => setHasConsent(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Recipient has provided WhatsApp opt-in consent
                </label>
                <button
                  type="submit"
                  disabled={quickAddBusy}
                  className="px-4 py-2 rounded-xl bg-[#E8192C] text-white font-bold hover:bg-[#c81324] disabled:opacity-50"
                >
                  {quickAddBusy ? 'Saving...' : `Save ${roleLabel}`}
                </button>
              </form>
            )}
          </div>

          <div
            className={`grid grid-cols-1 ${
              selectedContact ? 'xl:grid-cols-12' : ''
            } gap-4 items-start`}
          >
            <div
              className={`bg-white rounded-2xl border border-[#E5E7EB] p-5 ${
                selectedContact ? 'xl:col-span-7' : ''
              }`}
            >
              {loading ? (
                <p className="text-xs text-[#6B7280] py-4">
                  Loading {roleLabel} Database records...
                </p>
              ) : contacts.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm font-bold text-[#111827]">
                    No {roleLabel} contacts uploaded yet
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    Upload an Excel sheet or add a {roleLabel} manually above to begin sending
                    WhatsApp invitations.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                        <th className="py-2 pr-3">{roleLabel}</th>
                        <th className="py-2 pr-3">WhatsApp</th>
                        <th className="py-2 pr-3">Location</th>
                        <th className="py-2 pr-3">
                          {isClient ? 'Business Info' : 'Services & Category'}
                        </th>
                        <th className="py-2 pr-3">Consent</th>
                        <th className="py-2">Invitation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {contacts.map((c) => {
                        const isSelected = selectedContact?.id === c.id;
                        return (
                          <tr
                            key={c.id}
                            onClick={() => setSelectedContact(c)}
                            className={`cursor-pointer transition ${
                              isSelected ? 'bg-red-50/40' : 'hover:bg-[#F9FAFB]'
                            }`}
                          >
                            <td className="py-2.5 pr-3">
                              <div className="font-bold text-[#111827]">{c.contactName}</div>
                              {c.companyName && (
                                <div className="text-[11px] text-[#6B7280]">{c.companyName}</div>
                              )}
                            </td>
                            <td className="py-2.5 pr-3 font-mono font-semibold text-[#111827]">
                              {c.phoneE164}
                            </td>
                            <td className="py-2.5 pr-3 text-[#4B5563]">
                              {c.city || '—'}
                              {c.countryIso2 ? `, ${c.countryIso2}` : ''}
                            </td>
                            <td className="py-2.5 pr-3 text-[#4B5563] max-w-[220px] truncate">
                              {isClient
                                ? c.businessInfo || c.sectorName || '—'
                                : [
                                    c.categoryName,
                                    c.subcategoryName,
                                    ...(c.servicesOffered || []),
                                  ]
                                    .filter(Boolean)
                                    .join(' • ') || '—'}
                            </td>
                            <td className="py-2.5 pr-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  c.consentStatus === 'opted_in'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : c.consentStatus === 'opted_out'
                                      ? 'bg-red-50 text-red-700'
                                      : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {c.consentStatus || 'none'}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                  c.linkedUid || c.invitationStatus === 'registered'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : c.invitationStatus === 'invited' ||
                                        c.invitationStatus === 'responded'
                                      ? 'bg-amber-50 text-amber-800'
                                      : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {c.linkedUid
                                  ? 'registered'
                                  : (c.invitationStatus || 'not_invited').replace(/_/g, ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedContact && (
              <div className="xl:col-span-5">
                <ContactDetailDrawer
                  key={selectedContact.id}
                  contact={selectedContact}
                  onClose={() => setSelectedContact(null)}
                  onUpdated={(updated) => {
                    setSelectedContact(updated);
                    setContacts((prev) =>
                      prev.map((item) => (item.id === updated.id ? updated : item))
                    );
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXCEL UPLOAD */}
      {activeTab === 'upload' && (
        <ExcelImporterPanel
          compactHeader
          title={`Upload ${roleLabel} Database Excel Sheet`}
          subtitle={
            isClient
              ? "Import potential Clients' names, WhatsApp numbers, locations, business information, and consent status."
              : "Import potential Partners' names, WhatsApp numbers, locations, services offered, categories, subcategories, and consent status."
          }
          endpoint="/api/crm/import"
          importType={isClient ? 'client_database' : 'partner_database'}
          templateDownloadHref={`/api/crm/import?download=template&type=${databaseType}`}
          templateLabel={`Download ${roleLabel} Excel Template (.xlsx)`}
          onImportComplete={() => {
            void loadContacts();
          }}
        />
      )}

      {/* TAB 3: BULK WHATSAPP INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="space-y-5">
          <form
            onSubmit={handleLaunchInvitations}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5"
          >
            <div>
              <h2 className="text-base font-extrabold text-[#111827]">
                Initiate {roleLabel} Bulk WhatsApp Invitations
              </h2>
              <p className="text-xs text-[#6B7280] mt-1">
                Uses Meta APPROVED templates and contacts strictly recipients with verified{' '}
                <code>opted_in</code> consent (automatically skipping unconsented and suppressed
                numbers).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#111827] mb-1">
                  Invitation Batch Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`e.g., ${roleLabel} Invite Wave — Mumbai`}
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111827] mb-1">
                  Approved Meta Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.purpose.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#111827] mb-1">
                  Filter by City (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank for all cities"
                  value={inviteCity}
                  onChange={(e) => setInviteCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB]"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#374151]">
              <input
                type="checkbox"
                checked={onlyUninvited}
                onChange={(e) => setOnlyUninvited(e.target.checked)}
                className="rounded border-gray-300"
              />
              Only invite prospects who have not been invited yet
            </label>

            {invitePreview && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-emerald-800 font-semibold">Consented & Eligible</div>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">
                    {invitePreview.consentedEligibleCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-amber-800 font-semibold">Skipped (No Consent)</div>
                  <div className="text-xl font-black text-amber-700 mt-0.5">
                    {invitePreview.missingConsentCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <div className="text-red-800 font-semibold">Skipped (Opted Out)</div>
                  <div className="text-xl font-black text-red-700 mt-0.5">
                    {invitePreview.suppressedCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                  <div className="text-[#6B7280] font-semibold">Already Invited / Active</div>
                  <div className="text-xl font-black text-[#111827] mt-0.5">
                    {invitePreview.alreadyInvitedCount + invitePreview.alreadyRegisteredCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                  <div className="text-[#6B7280] font-semibold">Estimated Meta Cost</div>
                  <div className="text-xl font-black text-[#111827] mt-0.5">
                    ₹{invitePreview.estimatedCostInr}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#F3F4F6]">
              <p className="text-[11px] text-[#6B7280]">
                When recipients reply on WhatsApp, XPO pre-fills their uploaded {roleLabel} details
                and collects only missing fields.
              </p>
              <button
                type="submit"
                disabled={inviteBusy || (invitePreview?.consentedEligibleCount || 0) === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#E8192C] hover:bg-[#c81324] text-white text-xs font-bold disabled:opacity-50 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                {inviteBusy
                  ? 'Sending Invitations...'
                  : `Send ${invitePreview?.consentedEligibleCount || 0} ${roleLabel} Invitations`}
              </button>
            </div>
          </form>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-[#111827]">
              {roleLabel} WhatsApp Invitation History
            </h3>
            {campaigns.length === 0 ? (
              <p className="text-[#6B7280]">
                No bulk WhatsApp invitations sent for the {roleLabel} Database yet.
              </p>
            ) : (
              campaigns.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-[#111827]">{c.name}</div>
                    <div className="text-[#6B7280] mt-0.5">
                      Template: <span className="font-mono">{c.templateName}</span> • Sent:{' '}
                      <strong>{c.sentCount}</strong> • Skipped (Unconsented/Suppressed):{' '}
                      {c.suppressedSkippedCount}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
