'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Copy,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  UserCheck,
  ExternalLink,
  Tag
} from 'lucide-react';

interface ContactDetailModalProps {
  contact: any;
  onClose: () => void;
  onStatusChange?: (newStatus: string) => void;
}

export function ContactDetailModal({ contact, onClose, onStatusChange }: ContactDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'company' | 'preferences' | 'consent' | 'campaigns' | 'conversations' | 'account'>('overview');
  const [copied, setCopied] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(contact.status);

  const tabs = [
    { id: 'overview', label: 'Overview & Actions' },
    { id: 'company', label: 'Company Info' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'consent', label: 'Consent Audit' },
    { id: 'campaigns', label: 'Campaign History' },
    { id: 'conversations', label: 'WhatsApp Thread' },
    { id: 'account', label: 'Linked Account' },
  ];

  const handleCopyInvite = () => {
    const text = `Hi ${contact.name}, explore verified buyers and industrial demands on XPO India. Visit https://xpoindia.com?ref=${contact.id}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusUpdate = async (st: string) => {
    setCurrentStatus(st);
    if (onStatusChange) onStatusChange(st);
    await fetch('/api/crm/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', id: contact.id, status: st })
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4 border border-[#EBEBEB] shadow-2xl max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#EBEBEB]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center font-bold text-lg">
              {contact.company.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#222222]">{contact.company}</h2>
                <Badge variant={currentStatus === 'subscribed' ? 'success' : currentStatus === 'opted_out' ? 'neutral' : 'warning'} className="text-[10px]">
                  {currentStatus.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-[#717171]">{contact.name} • {contact.city || contact.country} • {contact.industry}</p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#717171] hover:text-[#222222] font-bold text-base p-1">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#EBEBEB] text-xs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-50 text-[#E8192C]'
                  : 'text-[#717171] hover:text-[#222222] hover:bg-neutral-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto pr-1 text-xs py-2">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB] space-y-1">
                  <div className="text-[10px] text-[#717171] uppercase font-bold">Contact Person</div>
                  <div className="font-bold text-[#222222]">{contact.name}</div>
                  <div className="text-[11px] text-[#555555] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#717171]" /> {contact.phone}
                  </div>
                  <div className="text-[11px] text-[#555555] flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#717171]" /> {contact.email}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB] space-y-1">
                  <div className="text-[10px] text-[#717171] uppercase font-bold">Acquisition Channel</div>
                  <div className="font-bold text-[#222222] capitalize">{contact.source.replace('_', ' ')}</div>
                  <div className="text-[11px] text-[#555555] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#717171]" /> Created: {new Date(contact.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Consent: {contact.consentStatus.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 rounded-2xl bg-red-50/30 border border-red-100 space-y-3">
                <div className="font-bold text-xs text-[#222222]">Direct Outreach Actions</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={handleCopyInvite}
                    className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied Invitation!' : 'Copy Platform Invitation'}
                  </Button>

                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${contact.name}, greeting from XPO India. We have verified buyers looking for your capabilities in ${contact.industry}. Would you like to review them?`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Open WhatsApp
                    </Button>
                  </a>
                </div>
              </div>

              {/* Status Updater */}
              <div className="space-y-1.5">
                <div className="font-bold text-[11px] text-[#717171] uppercase">Update Lifecycle Stage</div>
                <div className="flex flex-wrap gap-1.5">
                  {['not_contacted', 'contacted', 'responded', 'interested', 'registered', 'subscribed', 'opted_out'].map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusUpdate(st)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                        currentStatus === st
                          ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
                          : 'border-[#EBEBEB] hover:bg-neutral-50 text-[#555555]'
                      }`}
                    >
                      {st.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPANY INFO */}
          {activeTab === 'company' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-[#EBEBEB]">
                  <div className="text-[10px] text-[#717171] uppercase font-bold">Registered Legal Name</div>
                  <div className="font-bold text-[#222222] mt-1">{contact.company}</div>
                </div>
                <div className="p-3 rounded-xl border border-[#EBEBEB]">
                  <div className="text-[10px] text-[#717171] uppercase font-bold">Industry Sector</div>
                  <div className="font-bold text-[#222222] mt-1">{contact.industry}</div>
                </div>
                <div className="p-3 rounded-xl border border-[#EBEBEB]">
                  <div className="text-[10px] text-[#717171] uppercase font-bold">Country & Region</div>
                  <div className="font-bold text-[#222222] mt-1">{contact.city ? `${contact.city}, ${contact.country}` : contact.country}</div>
                </div>
                <div className="p-3 rounded-xl border border-[#EBEBEB]">
                  <div className="text-[10px] text-[#717171] uppercase font-bold">Official Website</div>
                  <div className="font-bold text-[#E8192C] mt-1 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {contact.website || 'https://' + contact.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-[#EBEBEB] space-y-2">
                <div className="font-bold text-[#222222]">Communication Channels</div>
                <div className="space-y-1 text-[#555555]">
                  <div className="flex justify-between"><span>WhatsApp Direct Broadcast:</span> <span className="font-bold text-emerald-600">Enabled</span></div>
                  <div className="flex justify-between"><span>Email Notifications:</span> <span className="font-bold text-emerald-600">Enabled</span></div>
                  <div className="flex justify-between"><span>Direct Phone Calls:</span> <span className="font-bold text-neutral-600">Standard Business Hours</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONSENT AUDIT */}
          {activeTab === 'consent' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-neutral-50 border border-[#EBEBEB] space-y-2">
                <div className="font-bold text-[#222222] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Digital Consent Record
                </div>
                <div className="text-[11px] text-[#555555]">
                  Opt-In timestamp recorded on {new Date(contact.createdAt).toLocaleDateString()} via {contact.source} channel.
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate('opted_out')}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl"
                >
                  Manually Opt-Out Contact
                </Button>
              </div>
            </div>
          )}

          {/* TAB 5: CAMPAIGNS */}
          {activeTab === 'campaigns' && (
            <div className="space-y-2">
              <div className="font-bold text-[#222222] mb-1">Campaigns Received ({contact.campaignHistoryCount || 1})</div>
              <div className="p-3 rounded-xl border border-[#EBEBEB] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#222222]">Direct Invitation Broadcast (Q3 2026)</div>
                  <div className="text-[10px] text-[#717171]">Template: xpo_direct_platform_invitation</div>
                </div>
                <Badge variant="success" className="text-[10px]">Delivered</Badge>
              </div>
            </div>
          )}

          {/* TAB 6: CONVERSATIONS */}
          {activeTab === 'conversations' && (
            <div className="space-y-3 p-4 bg-[#EFEAE2] rounded-2xl border border-[#DDD5C7]">
              <div className="p-3 bg-white rounded-xl shadow-xs max-w-xs space-y-1">
                <div className="text-[10px] text-[#717171]">Outbound • WhatsApp Cloud API</div>
                <div className="text-xs text-[#222222]">Hi {contact.name}, greeting from XPO India. We have verified requirements in {contact.industry}.</div>
              </div>
            </div>
          )}

          {/* TAB 7: ACCOUNT */}
          {activeTab === 'account' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-[#EBEBEB] space-y-2">
                <div className="font-bold text-[#222222] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#E8192C]" /> Platform User Binding
                </div>
                <p className="text-xs text-[#717171]">
                  {contact.linkedUserId ? `Linked User ID: ${contact.linkedUserId}` : 'Not yet converted into a registered user account.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#EBEBEB] flex justify-end">
          <Button size="sm" onClick={onClose} className="bg-neutral-900 text-white text-xs font-semibold rounded-xl">
            Close Dossier
          </Button>
        </div>
      </div>
    </div>
  );
}
