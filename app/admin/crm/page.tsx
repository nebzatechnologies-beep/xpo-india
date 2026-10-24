'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  MessageCircle,
  Copy,
  Plus,
  UploadCloud,
  CheckCircle2,
  Eye,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { ContactDetailModal } from '@/components/crm/contact-detail-modal';

interface CrmContact {
  id: string;
  name: string;
  company: string;
  phone: string;
  whatsapp: string;
  email: string;
  website?: string;
  country: string;
  city?: string;
  industry: string;
  sectorCode: string;
  source: string;
  status: string;
  consentStatus: string;
  campaignHistoryCount: number;
  createdAt: string;
}

export default function CrmContactsPage() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchContacts = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('q', search);
    if (selectedStatus !== 'all') query.set('status', selectedStatus);
    if (selectedCountry !== 'all') query.set('country', selectedCountry);

    fetch(`/api/crm/contacts?${query.toString()}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setContacts(res.data);
          setStats(res.stats);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContacts();
  }, [selectedStatus, selectedCountry]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts();
  };

  const copyInvite = (contact: CrmContact) => {
    const text = `Hi ${contact.name}, explore verified buyers and industrial demands on XPO India: https://xpoindia.com?ref=${contact.id}`;
    navigator.clipboard.writeText(text);
    setCopiedId(contact.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Company Database & CRM</h1>
          <p className="text-xs text-[#717171] mt-0.5">
            Full prospect lifecycle from initial acquisition to platform conversion and subscription.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/import/companies">
            <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-[#E8192C]" /> Import Excel
            </Button>
          </Link>
          <Link href="/admin/crm/segments">
            <Button size="sm" className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Audience Segments
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
            <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Total Prospects</div>
            <div className="text-xl font-black text-[#222222] mt-1">{stats.total}</div>
          </Card>
          <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
            <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Not Contacted</div>
            <div className="text-xl font-black text-neutral-600 mt-1">{stats.notContacted}</div>
          </Card>
          <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Contacted</div>
            <div className="text-xl font-black text-amber-600 mt-1">{stats.contacted}</div>
          </Card>
          <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Registered</div>
            <div className="text-xl font-black text-blue-600 mt-1">{stats.registered}</div>
          </Card>
          <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Subscribed</div>
            <div className="text-xl font-black text-emerald-600 mt-1">{stats.subscribed}</div>
          </Card>
          <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Opt-In Consent</div>
            <div className="text-xl font-black text-emerald-600 mt-1">{stats.optedInConsent}</div>
          </Card>
        </div>
      )}

      {/* Filter & Search Bar */}
      <Card className="p-4 rounded-2xl border border-[#EBEBEB] bg-white shadow-none flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#717171] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, name, phone, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-[#EBEBEB] bg-white outline-none"
          >
            <option value="all">All Lifecycle Stages</option>
            <option value="not_contacted">Not Contacted</option>
            <option value="contacted">Contacted</option>
            <option value="responded">Responded</option>
            <option value="interested">Interested</option>
            <option value="registered">Registered</option>
            <option value="subscribed">Subscribed</option>
            <option value="opted_out">Opted Out</option>
          </select>

          <select
            value={selectedCountry}
            onChange={e => setSelectedCountry(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-[#EBEBEB] bg-white outline-none"
          >
            <option value="all">All Geographies</option>
            <option value="India">India Domestic</option>
            <option value="United States">United States</option>
            <option value="Germany">Germany</option>
            <option value="UAE">UAE</option>
          </select>
        </div>
      </Card>

      {/* Contacts Table */}
      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Company & Location</th>
                <th className="p-4">Contact Person</th>
                <th className="p-4">WhatsApp / Phone</th>
                <th className="p-4">Industry Sector</th>
                <th className="p-4">Lifecycle Status</th>
                <th className="p-4">Consent</th>
                <th className="p-4 text-right">Outreach Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-[#FDFDFD] transition-colors">
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedContact(contact)}
                      className="font-bold text-[#222222] hover:text-[#E8192C] text-left block"
                    >
                      {contact.company}
                    </button>
                    <div className="text-[10px] text-[#717171]">
                      {contact.city ? `${contact.city}, ` : ''}{contact.country}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-[#333333]">{contact.name}</div>
                    <div className="text-[10px] text-[#717171] font-mono">{contact.email}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-[#333333]">
                    {contact.whatsapp}
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-[#555555]">{contact.industry}</span>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={
                        contact.status === 'subscribed' ? 'success' :
                        contact.status === 'registered' ? 'primary' :
                        contact.status === 'opted_out' ? 'neutral' : 'warning'
                      }
                      className="text-[10px]"
                    >
                      {contact.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={contact.consentStatus === 'opted_in' ? 'success' : 'neutral'} className="text-[10px]">
                      {contact.consentStatus === 'opted_in' ? 'OPT-IN' : 'OPT-OUT'}
                    </Badge>
                  </td>
                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => copyInvite(contact)}
                      title="Copy Platform Invite"
                      className="p-1.5 rounded-lg border border-[#EBEBEB] hover:bg-neutral-50 text-[#555555] inline-flex items-center"
                    >
                      {copiedId === contact.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${contact.name}, greeting from XPO India. We have live opportunities in ${contact.industry} matching your capabilities.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open WhatsApp"
                      className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 inline-flex items-center"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => setSelectedContact(contact)}
                      title="View Complete Dossier"
                      className="p-1.5 rounded-lg border border-[#EBEBEB] hover:bg-neutral-50 text-[#555555] inline-flex items-center"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Contact Dossier Modal */}
      {selectedContact && (
        <ContactDetailModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onStatusChange={() => fetchContacts()}
        />
      )}
    </div>
  );
}
