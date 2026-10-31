'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CrmContact, CrmContactState } from '@/lib/types/domain';
import {
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';

interface ContactDetailDrawerProps {
  contact: CrmContact;
  onClose: () => void;
  onUpdated?: (updated: CrmContact) => void;
}

const CRM_STATES: CrmContactState[] = [
  'imported_prospect',
  'registered_customer',
  'verification_pending',
  'verified_customer',
  'eligible_matching_recipient',
  'opted_out_contact',
  'suspended_contact',
];

/**
 * Inline Contact Dossier Panel (Zero blocking modal overlay).
 */
export function ContactDetailDrawer({
  contact,
  onClose,
  onUpdated,
}: ContactDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'consent' | 'account'>(
    'overview'
  );
  const [copied, setCopied] = useState(false);
  const [crmState, setCrmState] = useState<CrmContactState>(
    contact.crmState || 'imported_prospect'
  );
  const [consentStatus, setConsentStatus] = useState(contact.consentStatus || 'none');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setCrmState(contact.crmState || 'imported_prospect');
    setConsentStatus(contact.consentStatus || 'none');
  }, [contact.crmState, contact.consentStatus]);

  const handleCopyInvite = () => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://xpo.in';
    const roleLabel = contact.databaseType === 'partner' ? 'Partner' : 'Client';
    const text = `Hi ${contact.contactName}, join XPO as a verified ${roleLabel} to connect directly on WhatsApp: ${appUrl}/register`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStateChange = async (nextState: CrmContactState) => {
    try {
      setSaving(true);
      const res = await fetch('/api/crm/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneE164: contact.phoneE164,
          patch: { crmState: nextState },
        }),
      });
      const data = await res.json();
      if (res.ok && data.contact) {
        setCrmState(nextState);
        onUpdated?.(data.contact);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConsentChange = async (newStatus: 'opted_in' | 'opted_out') => {
    try {
      setSaving(true);
      const res = await fetch('/api/crm/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneE164: contact.phoneE164,
          newStatus,
          evidenceNote: `Superadmin manual update in ${contact.databaseType || 'CRM'} Contact Dossier`,
        }),
      });
      if (res.ok) {
        setConsentStatus(newStatus);
        const nextState = newStatus === 'opted_out' ? 'opted_out_contact' : crmState;
        if (newStatus === 'opted_out') setCrmState('opted_out_contact');
        onUpdated?.({
          ...contact,
          consentStatus: newStatus,
          crmState: nextState,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4 shadow-xs">
      <div className="flex items-start justify-between pb-3 border-b border-[#E5E7EB] gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E8192C] flex items-center justify-center font-bold text-sm shrink-0">
            {(contact.companyName || contact.contactName || 'X').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-[#111827] truncate">
                {contact.companyName || contact.contactName}
              </h3>
              <Badge
                variant={
                  crmState === 'verified_customer'
                    ? 'success'
                    : crmState === 'opted_out_contact' || crmState === 'suspended_contact'
                      ? 'neutral'
                      : 'warning'
                }
                className="text-[10px]"
              >
                {(crmState || 'imported_prospect').replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-[#6B7280] truncate">
              {contact.contactName} • {contact.city || 'Location N/A'}, {contact.country}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#6B7280] hover:text-[#111827] p-1 rounded-lg hover:bg-gray-100"
          aria-label="Close contact panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#E5E7EB] text-xs">
        {[
          { id: 'overview', label: 'Overview' },
          {
            id: 'details',
            label: contact.databaseType === 'partner' ? 'Services & Categories' : 'Business Info',
          },
          { id: 'consent', label: 'WhatsApp Consent' },
          { id: 'account', label: 'Account Status' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[#111827] text-white'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="text-xs space-y-4">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-1.5">
                <div className="text-[10px] text-[#6B7280] uppercase font-bold">
                  WhatsApp & Contact
                </div>
                <div className="font-bold text-[#111827]">{contact.contactName}</div>
                <div className="text-[11px] text-[#374151] flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-[#6B7280]" /> {contact.phoneE164} (
                  {contact.countryIso2})
                </div>
                {contact.email && (
                  <div className="text-[11px] text-[#374151] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#6B7280]" /> {contact.email}
                  </div>
                )}
                {contact.website && (
                  <div className="text-[11px] text-[#E8192C] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> {contact.website}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-1.5">
                <div className="text-[10px] text-[#6B7280] uppercase font-bold">
                  Invitation & Consent
                </div>
                <div className="font-bold text-[#111827]">{contact.source}</div>
                <div className="text-[11px] text-[#374151] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#6B7280]" /> Invitation:{' '}
                  <strong className="capitalize">
                    {(contact.invitationStatus || 'not_invited').replace(/_/g, ' ')}
                  </strong>
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Consent:{' '}
                  {(consentStatus || 'none').replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex flex-wrap gap-2 items-center justify-between">
              <div className="font-bold text-[#111827]">Direct Outreach</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleCopyInvite} className="text-xs rounded-xl">
                  {copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-1" />
                  )}
                  {copied ? 'Copied!' : 'Copy Invite Link'}
                </Button>
                <a
                  href={`https://wa.me/${(contact.whatsappE164 || contact.phoneE164 || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="sm" variant="outline" className="text-xs rounded-xl">
                    <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Open WhatsApp
                  </Button>
                </a>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-[11px] text-[#6B7280] uppercase">Lifecycle Stage</div>
              <div className="flex flex-wrap gap-1.5">
                {CRM_STATES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={saving}
                    onClick={() => void handleStateChange(st)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                      crmState === st
                        ? 'border-[#111827] bg-[#111827] text-white'
                        : 'border-[#E5E7EB] hover:bg-gray-50 text-[#4B5563]'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'details' && (
          <div className="space-y-3">
            {contact.businessInfo && (
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="text-[10px] text-[#6B7280] uppercase font-bold">
                  Business Information
                </div>
                <p className="text-xs text-[#111827] mt-1">{contact.businessInfo}</p>
              </div>
            )}

            {contact.servicesOffered && contact.servicesOffered.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="text-[10px] text-[#6B7280] uppercase font-bold mb-1.5">
                  Services Offered
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {contact.servicesOffered.map((srv) => (
                    <Badge key={srv} variant="outline">
                      {srv}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-[#E5E7EB]">
                <div className="text-[10px] text-[#6B7280] uppercase font-bold">Sector</div>
                <div className="font-bold text-[#111827] mt-1">{contact.sectorName || '—'}</div>
              </div>
              <div className="p-3 rounded-xl border border-[#E5E7EB]">
                <div className="text-[10px] text-[#6B7280] uppercase font-bold">Category</div>
                <div className="font-bold text-[#111827] mt-1">{contact.categoryName || '—'}</div>
              </div>
              <div className="p-3 rounded-xl border border-[#E5E7EB]">
                <div className="text-[10px] text-[#6B7280] uppercase font-bold">Subcategory</div>
                <div className="font-bold text-[#111827] mt-1">
                  {contact.subcategoryName || '—'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[#E5E7EB]">
              <div className="text-[10px] text-[#6B7280] uppercase font-bold mb-1.5">
                Database Role & Expertise Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="primary">
                  {(contact.databaseType || contact.roles?.[0] || 'client').toUpperCase()}
                </Badge>
                {(contact.skills || []).map((sk) => (
                  <Badge key={sk} variant="outline">
                    {sk}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consent' && (
          <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
            <div className="font-bold text-[#111827] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> WhatsApp Consent Status:{' '}
              <span className="uppercase text-[#E8192C]">
                {(consentStatus || 'none').replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[11px] text-[#4B5563]">
              XPO bulk WhatsApp invitations strictly contact only <code>opted_in</code> recipients.
              Opted-out contacts are added to <code>suppression_list</code> immediately.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={consentStatus === 'opted_in' ? 'primary' : 'outline'}
                disabled={saving || consentStatus === 'opted_in'}
                onClick={() => void handleConsentChange('opted_in')}
                className={consentStatus === 'opted_in' ? 'bg-emerald-600 hover:bg-emerald-600 cursor-default text-white' : ''}
              >
                {consentStatus === 'opted_in' ? '✓ Currently Opted In' : 'Mark Verified Opt-In'}
              </Button>
              <Button
                size="sm"
                variant={consentStatus === 'opted_out' ? 'danger' : 'outline'}
                disabled={saving || consentStatus === 'opted_out'}
                onClick={() => void handleConsentChange('opted_out')}
                className={
                  consentStatus === 'opted_out'
                    ? 'cursor-default'
                    : 'text-red-600 border-red-200 hover:bg-red-50'
                }
              >
                {consentStatus === 'opted_out' ? '✕ Currently Suppressed' : 'Opt-Out / Suppress'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="p-4 rounded-2xl border border-[#E5E7EB] space-y-2">
            <div className="font-bold text-[#111827] flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#E8192C]" /> Linked XPO Account
            </div>
            <p className="text-xs text-[#6B7280]">
              {contact.linkedUid
                ? `Registered & linked via E.164 phone_index to UID: ${contact.linkedUid}`
                : 'Not yet registered. When this contact replies on WhatsApp or registers on Web, XPO automatically recognizes their uploaded profile, collects only missing details, and activates their account.'}
            </p>
            <div className="pt-2">
              <Link
                href={`/admin/users?search=${encodeURIComponent(contact.phoneE164)}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
              >
                {contact.linkedUid
                  ? 'Manage User, Roles & Quota Allowances in User Directory →'
                  : 'Search Phone in User Directory →'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const ContactDetailModal = ContactDetailDrawer;
