'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ContactDetailDrawer } from '@/components/crm/contact-detail-modal';
import type { CrmContact, CrmDatabaseType } from '@/lib/types/domain';
import { Search, Database, ArrowRight } from 'lucide-react';

export default function AdminCrmDirectoryPage() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);
  const [databaseType, setDatabaseType] = useState<'' | CrmDatabaseType>('');
  const [search, setSearch] = useState('');
  const [consentStatus, setConsentStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      if (databaseType) q.set('databaseType', databaseType);
      if (search.trim()) q.set('search', search.trim());
      if (consentStatus) q.set('consentStatus', consentStatus);
      const res = await fetch(`/api/crm/contacts?${q.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setContacts(d.contacts || []);
      }
    } finally {
      setLoading(false);
    }
  }, [databaseType, search, consentStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111827]">
            All CRM Contacts
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Unified view across your separate Client Database and Partner Database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white hover:bg-gray-50 text-xs font-bold text-[#111827]"
          >
            <Database className="w-3.5 h-3.5 text-[#E8192C]" /> Client Database{' '}
            <ArrowRight className="w-3 h-3" />
          </Link>
          <Link
            href="/admin/partners"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-bold"
          >
            <Database className="w-3.5 h-3.5 text-[#E8192C]" /> Partner Database{' '}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, company, phone, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D1D5DB] text-xs"
            />
          </div>
          <select
            value={databaseType}
            onChange={(e) => setDatabaseType(e.target.value as '' | CrmDatabaseType)}
            className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
          >
            <option value="">Both Databases (Clients & Partners)</option>
            <option value="client">Client Database Only</option>
            <option value="partner">Partner Database Only</option>
          </select>
          <select
            value={consentStatus}
            onChange={(e) => setConsentStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
          >
            <option value="">All Consent Statuses</option>
            <option value="opted_in">Opted In</option>
            <option value="consent_pending">Consent Pending</option>
            <option value="none">None</option>
            <option value="opted_out">Opted Out (Suppressed)</option>
          </select>
        </div>

        <div
          className={`grid grid-cols-1 ${
            selectedContact ? 'xl:grid-cols-12' : ''
          } gap-4 items-start`}
        >
          <div className={selectedContact ? 'xl:col-span-7' : ''}>
            {loading ? (
              <p className="text-xs text-[#6B7280] py-4">Loading CRM contacts...</p>
            ) : contacts.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-4">No CRM contacts found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                      <th className="py-2 pr-3">Database</th>
                      <th className="py-2 pr-3">Contact / Company</th>
                      <th className="py-2 pr-3">WhatsApp</th>
                      <th className="py-2 pr-3">Location</th>
                      <th className="py-2 pr-3">Consent</th>
                      <th className="py-2">Invitation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {contacts.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedContact(c)}
                        className="cursor-pointer hover:bg-[#F9FAFB]"
                      >
                        <td className="py-2.5 pr-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              c.databaseType === 'partner'
                                ? 'bg-gray-900 text-white'
                                : 'bg-red-50 text-[#E8192C]'
                            }`}
                          >
                            {c.databaseType || 'client'}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="font-bold text-[#111827]">{c.contactName}</div>
                          <div className="text-[11px] text-[#6B7280]">{c.companyName}</div>
                        </td>
                        <td className="py-2.5 pr-3 font-mono font-bold">{c.phoneE164}</td>
                        <td className="py-2.5 pr-3">
                          {c.city || '—'}, {c.countryIso2}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.consentStatus === 'opted_in'
                                ? 'bg-emerald-50 text-emerald-700'
                                : c.consentStatus === 'opted_out'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-[#F3F4F6] text-[#4B5563]'
                            }`}
                          >
                            {c.consentStatus || 'none'}
                          </span>
                        </td>
                        <td className="py-2.5 capitalize text-[11px]">
                          {c.linkedUid
                            ? 'registered'
                            : (c.invitationStatus || 'not_invited').replace(/_/g, ' ')}
                        </td>
                      </tr>
                    ))}
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
    </div>
  );
}
