const fs = require('fs');
const path = require('path');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log(`Created: ${relPath}`);
}

// 1. app/(absorber)/opportunities/page.tsx
writeFile('app/(absorber)/opportunities/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Building2,
  DollarSign,
} from 'lucide-react';

export default function OpportunitiesPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ]).then(([leadsData, catData]) => {
      if (leadsData.success) setLeads(leadsData.leads || []);
      if (catData.success) setCategories(catData.categories || []);
      setLoading(false);
    });
  }, []);

  const filtered = leads.filter((l) => {
    const matchCat = selectedCat === 'all' || l.category?._id === selectedCat || l.category === selectedCat;
    const matchSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.xpoId.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-[#EBEBEB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
              Opportunity Exchange & Leads
            </h1>
            <Badge variant="outline" className="border-red-200 text-[#E8192C] bg-red-50 text-xs">
              Live Buyer Feed
            </Badge>
          </div>
          <p className="text-sm text-[#717171] mt-1">
            Discover verified buyer demands. Submit proposals and connect directly with zero commission cuts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/absorber/my-responses">
            <Button variant="outline" size="md" className="rounded-2xl font-semibold">
              My Submitted Quotes
            </Button>
          </Link>
          <Link href="/absorber/connections">
            <Button variant="secondary" size="md" className="rounded-2xl font-semibold">
              Direct Connections
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-[#717171] absolute left-3.5 top-3.5" />
          <Input
            placeholder="Search leads by keyword, XPO-ID, or requirement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 pr-4 py-3 rounded-2xl border-[#EBEBEB] text-sm"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="px-4 py-3 rounded-2xl border border-[#EBEBEB] text-sm bg-white focus:outline-none focus:border-[#222222]"
        >
          <option value="all">All Sectors & Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Leads Feed */}
      <div className="mt-8 space-y-4">
        {filtered.map((lead) => (
          <Card key={lead._id} className="p-6 rounded-3xl border border-[#EBEBEB] bg-white hover:border-[#222222] hover:shadow-md transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-[#222222]">
                    {lead.xpoId}
                  </span>
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px] font-bold">
                    VERIFIED BUYER
                  </Badge>
                  <span className="text-xs font-semibold text-[#717171]">{lead.category?.name || 'Commercial'}</span>
                  <span className="text-xs text-[#717171] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#717171]" />
                    {lead.city || lead.country || 'India'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#222222]">{lead.title}</h3>
                <p className="text-xs text-[#717171] line-clamp-2 max-w-3xl leading-relaxed">{lead.description}</p>

                {lead.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {lead.tags.map((t: string, i: number) => (
                      <span key={i} className="text-[10px] bg-[#F7F7F7] px-2 py-0.5 rounded-full text-[#717171] border border-[#EBEBEB]">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#EBEBEB]">
                {lead.budgetMax && (
                  <div className="text-left lg:text-right">
                    <div className="text-[11px] text-[#717171]">Target Budget</div>
                    <div className="text-base font-extrabold text-[#222222]">
                      {lead.budgetCurrency === 'USD' ? '$' : '₹'}{lead.budgetMax.toLocaleString()}
                    </div>
                  </div>
                )}

                <Link href={\`/absorber/opportunities/\${lead.xpoId || lead._id}\`}>
                  <Button variant="primary" size="md" className="rounded-2xl text-xs font-semibold flex items-center gap-1.5">
                    View & Submit Proposal <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
`);

// 2. app/(absorber)/opportunities/[id]/page.tsx
writeFile('app/(absorber)/opportunities/[id]/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PaywallModal, PaywallCard } from '@/components/ui/paywall';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Phone,
  MessageCircle,
  Mail,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function SingleOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [lead, setLead] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasConnection, setHasConnection] = useState(false);
  const [userResponse, setUserResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paywallOpen, setPaywallOpen] = useState(false);

  // Proposal form state
  const [message, setMessage] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [deliveryTimeline, setDeliveryTimeline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchLead = () => {
    fetch(\`/api/leads/\${id}\`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLead(data.lead);
          setIsSubscribed(data.isSubscribed);
          setHasConnection(data.hasConnection);
          setUserResponse(data.userResponse);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchLead();
  }, [id]);

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch(\`/api/leads/\${lead._id}/responses\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          quoteAmount: quoteAmount ? Number(quoteAmount) : undefined,
          deliveryTimeline,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit proposal');
      }

      setSubmittedSuccess(true);
      fetchLead();
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#717171]">
        Loading opportunity details...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold">Opportunity not found</h2>
        <Link href="/absorber/opportunities" className="mt-4 text-[#E8192C] font-semibold text-sm">
          Return to opportunities
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <Link href="/absorber/opportunities" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#717171] hover:text-[#222222] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to opportunities feed
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 rounded-3xl border border-[#EBEBEB] bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-[#222222]">
                {lead.xpoId}
              </span>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px] font-bold">
                LIVE BUYER OPPORTUNITY
              </Badge>
              <span className="text-xs text-[#717171]">{lead.category?.name}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
              {lead.title}
            </h1>

            <div className="mt-6 pt-6 border-t border-[#EBEBEB]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#717171] mb-2">
                Detailed Requirement & Specifications
              </h3>
              <p className="text-sm text-[#484848] leading-relaxed whitespace-pre-line">
                {lead.description}
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-[#EBEBEB] grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] text-[#717171] block">Location</span>
                <span className="text-xs font-semibold text-[#222222]">{lead.city || lead.country}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#717171] block">Budget Range</span>
                <span className="text-xs font-semibold text-[#222222]">
                  {lead.budgetMin ? \`₹\${lead.budgetMin.toLocaleString()} - \` : ''}₹{lead.budgetMax ? lead.budgetMax.toLocaleString() : 'Negotiable'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#717171] block">Opportunity Type</span>
                <span className="text-xs font-semibold text-[#222222] capitalize">{lead.type || 'Buy'}</span>
              </div>
            </div>
          </Card>

          {/* Proposal Submission Form */}
          <Card className="p-8 rounded-3xl border border-[#EBEBEB] bg-white shadow-sm">
            <h2 className="text-xl font-bold text-[#222222] mb-1">
              Submit Commercial Quotation & Proposal
            </h2>
            <p className="text-xs text-[#717171] mb-6">
              The buyer will receive your proposal directly in their review dashboard. When they connect, you both unlock full direct contact details.
            </p>

            {userResponse || submittedSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Your Proposal Has Been Submitted
                </div>
                <p className="text-xs text-emerald-700 mt-1">
                  Status: <span className="font-semibold uppercase">{userResponse?.status || 'Pending Review'}</span>. You will receive an instant notification when the creator reviews your bid.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitProposal} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-1">
                    Your Commercial Bid / Quote (INR)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 425000"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="rounded-xl border-[#EBEBEB] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-1">
                    Estimated Delivery / Turnaround Timeline
                  </label>
                  <Input
                    placeholder="e.g. 14 calendar days / 3 weeks"
                    value={deliveryTimeline}
                    onChange={(e) => setDeliveryTimeline(e.target.value)}
                    className="rounded-xl border-[#EBEBEB] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-1">
                    Proposal Details & Qualifications *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Highlight your manufacturing machinery, past client references, certifications (ISO, etc.), and quality guarantees..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-4 rounded-xl border border-[#EBEBEB] text-sm focus:outline-none focus:border-[#222222] resize-y"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-semibold rounded-2xl"
                  isLoading={submitting}
                >
                  Send Quotation to Buyer
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* Sidebar / Paywall Contact Card (1 col) */}
        <div className="space-y-6">
          <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white shadow-sm">
            <h3 className="text-base font-bold text-[#222222] mb-3">Buyer Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-[#717171] block">Company</span>
                <span className="text-xs font-semibold text-[#222222]">{lead.creator?.company || 'Verified Enterprise'}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#717171] block">Contact Person</span>
                <span className="text-xs font-semibold text-[#222222]">{lead.creator?.name}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#EBEBEB]">
              {hasConnection ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Connected & Unmasked
                  </div>
                  <a
                    href={\`https://wa.me/\${lead.creator?.phone?.replace(/[^0-9]/g, '')}\`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                  </a>
                  <div className="text-xs text-[#717171] text-center">{lead.creator?.phone}</div>
                </div>
              ) : (
                <PaywallCard
                  role="absorber"
                  onUnlockClick={() => setPaywallOpen(true)}
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        role="absorber"
        onSuccess={() => fetchLead()}
      />
    </div>
  );
}
`);

// 3. app/(absorber)/my-responses/page.tsx
writeFile('app/(absorber)/my-responses/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, Phone, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export default function MyResponsesPage() {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/responses')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setResponses(data.responses || []);
        } else {
          // Fallback demo responses
          setResponses([
            {
              _id: 'resp_abs_1',
              lead: {
                xpoId: 'XPO-10021',
                title: 'Requirement for 5,000 Precision CNC Machined Aluminum Flanges',
                budgetCurrency: 'INR',
              },
              quoteAmount: 425000,
              quoteCurrency: 'INR',
              deliveryTimeline: '14 calendar days',
              status: 'connected',
              isConnected: true,
              message: 'We have 15+ years experience in aerospace and industrial precision CNC machining. Ready to deliver within 14 days.',
            }
          ]);
        }
      })
      .catch(() => {
        setResponses([
          {
            _id: 'resp_abs_1',
            lead: {
              xpoId: 'XPO-10021',
              title: 'Requirement for 5,000 Precision CNC Machined Aluminum Flanges',
              budgetCurrency: 'INR',
            },
            quoteAmount: 425000,
            quoteCurrency: 'INR',
            deliveryTimeline: '14 calendar days',
            status: 'connected',
            isConnected: true,
            message: 'We have 15+ years experience in aerospace and industrial precision CNC machining. Ready to deliver within 14 days.',
          }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Link href="/absorber/opportunities" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#717171] hover:text-[#222222] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to opportunities feed
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
          My Submitted Proposals & Quotations
        </h1>
        <p className="text-sm text-[#717171] mt-1">Track the review status of your bids. Connect directly with buyers once accepted.</p>
      </div>

      <div className="space-y-4">
        {responses.map((r) => (
          <Card key={r._id} className="p-6 rounded-3xl border border-[#EBEBEB] bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-[#222222]">
                  {r.lead?.xpoId}
                </span>
                <Badge
                  variant="outline"
                  className={\`text-[10px] font-bold \${
                    r.status === 'connected'
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                      : 'border-yellow-200 text-yellow-700 bg-yellow-50'
                  }\`}
                >
                  {r.status?.toUpperCase()}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-[#222222]">{r.lead?.title}</h3>
              <p className="text-xs text-[#717171] line-clamp-1 max-w-2xl">"{r.message}"</p>
            </div>

            <div className="flex flex-row md:flex-col items-baseline md:items-end justify-between gap-2 shrink-0">
              <div className="text-lg font-black text-[#222222]">
                ₹{r.quoteAmount?.toLocaleString()}
              </div>
              <div className="text-xs text-[#717171] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {r.deliveryTimeline}
              </div>

              {r.isConnected && (
                <Link href="/absorber/connections">
                  <Button variant="primary" size="sm" className="rounded-xl text-xs font-semibold mt-2">
                    Open Direct Contact
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
`);

// 4. app/(absorber)/connections/page.tsx
writeFile('app/(absorber)/connections/page.tsx', `'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, Phone, Mail, Building2, CheckCircle2 } from 'lucide-react';

export default function AbsorberConnectionsPage() {
  const connections = [
    {
      id: 'conn_buyer_1',
      name: 'Rajesh Sharma (Industrial Supplies)',
      company: 'Sharma Heavy Engineering Ltd',
      phone: '+91 9820011223',
      email: 'creator@xpoindia.com',
      sector: 'Manufacturing & Industrial',
      leadId: 'XPO-10021',
      dateConnected: '28 Sep 2026',
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Link href="/absorber/opportunities" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#717171] hover:text-[#222222] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to opportunities feed
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
          Direct Buyer Connections
        </h1>
        <p className="text-sm text-[#717171] mt-1">
          Unmasked buyers who accepted your bids. Communicate and execute deals directly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connections.map((c) => (
          <Card key={c.id} className="p-6 rounded-3xl border border-[#EBEBEB] bg-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-[#222222]">
                  {c.leadId}
                </span>
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Handshake Complete
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-[#222222]">{c.name}</h3>
              <div className="text-xs text-[#717171] mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#717171]" />
                {c.company} • {c.sector}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EBEBEB] flex flex-wrap gap-2">
              <a
                href={\`https://wa.me/\${c.phone.replace(/[^0-9]/g, '')}?text=Hello%20\${encodeURIComponent(c.name)},%20connecting%20from%20XPO%20India%20regarding%20\${c.leadId}\`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
              <a
                href={\`tel:\${c.phone}\`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#222222] text-white text-xs font-semibold hover:bg-black"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
              <a
                href={\`mailto:\${c.email}\`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EBEBEB] text-[#222222] text-xs font-semibold hover:bg-[#F7F7F7]"
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
`);

// 5. app/(absorber)/subscription/page.tsx
writeFile('app/(absorber)/subscription/page.tsx', `'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaywallModal } from '@/components/ui/paywall';
import { CheckCircle2, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';

export default function AbsorberSubscriptionPage() {
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [autoPay, setAutoPay] = useState(true);

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Link href="/absorber/opportunities" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#717171] hover:text-[#222222] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to opportunities feed
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
          Absorber Membership & AutoPay
        </h1>
        <p className="text-sm text-[#717171] mt-1">Manage active plans, domestic Razorpay or international PayPal billing.</p>
      </div>

      <Card className="p-8 rounded-3xl border border-[#EBEBEB] bg-white shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#EBEBEB]">
          <div>
            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-xs font-semibold mb-2">
              Active Annual Plan
            </Badge>
            <h2 className="text-xl font-bold text-[#222222]">Lead Absorber Annual (India)</h2>
            <div className="text-xs text-[#717171] mt-1">Billed at ₹999 / year via Razorpay</div>
          </div>

          <div className="text-right">
            <span className="text-3xl font-black text-[#222222]">₹999</span>
            <div className="text-xs text-[#717171]">Renews on 28 Sep 2027</div>
          </div>
        </div>

        {/* AutoPay toggle */}
        <div className="py-6 flex items-center justify-between border-b border-[#EBEBEB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center">
              <RefreshCw className={\`w-5 h-5 \${autoPay ? 'animate-spin-slow' : ''}\`} />
            </div>
            <div>
              <div className="text-sm font-bold text-[#222222]">Razorpay AutoPay (Recurring Renewal)</div>
              <div className="text-xs text-[#717171]">Seamless renewal without service interruption. Cancel anytime.</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAutoPay(!autoPay)}
            className={\`w-12 h-6 rounded-full transition-colors relative \${
              autoPay ? 'bg-[#E8192C]' : 'bg-gray-300'
            }\`}
          >
            <span
              className={\`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform \${
                autoPay ? 'translate-x-6' : 'translate-x-0'
              }\`}
            />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <Button
            variant="outline"
            size="md"
            className="rounded-2xl font-semibold"
            onClick={() => setPaywallOpen(true)}
          >
            Switch to International PayPal ($49/yr)
          </Button>
        </div>
      </Card>

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        role="absorber"
      />
    </div>
  );
}
`);

console.log('Absorber pages written successfully!');
