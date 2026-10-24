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

// 1. app/(creator)/dashboard/page.tsx
writeFile('app/(creator)/dashboard/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircle,
  FileText,
  Users,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function CreatorDashboardPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeads(data.leads || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalActive = leads.filter((l) => l.status === 'live').length;

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-[#EBEBEB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#222222]">
              Lead Creator Dashboard
            </h1>
            <Badge variant="outline" className="text-xs border-red-200 text-[#E8192C] bg-red-50">
              Verified Creator
            </Badge>
          </div>
          <p className="text-sm text-[#717171] mt-1">
            Logged in as <span className="font-semibold text-[#222222]">{session?.user?.name || 'Creator'}</span> ({session?.user?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/creator/post-lead">
            <Button variant="primary" size="md" className="rounded-2xl font-semibold flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Post New Lead
            </Button>
          </Link>
          <Link href="/creator/subscription">
            <Button variant="outline" size="md" className="rounded-2xl font-semibold">
              Manage Subscription
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717171]">Active Leads</span>
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-[#222222]">{totalActive}</div>
          <div className="mt-1 text-xs text-[#717171]">Live opportunities visible to suppliers</div>
        </Card>

        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717171]">Proposals Received</span>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-[#222222]">12</div>
          <div className="mt-1 text-xs text-[#717171]">Quotations from certified suppliers</div>
        </Card>

        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717171]">Direct Connections</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-[#222222]">5</div>
          <div className="mt-1 text-xs text-[#717171]">Active vendor handshakes on WhatsApp</div>
        </Card>
      </div>

      {/* Quick Links Banner */}
      <div className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-red-500 to-[#E8192C] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Need something fabricated, built, or shipped?</h3>
          <p className="text-xs text-white/90 mt-1 max-w-xl">
            Post your specifications. Relevant verified providers will receive an instant WhatsApp broadcast and submit bids directly to you.
          </p>
        </div>
        <Link href="/creator/post-lead">
          <Button variant="secondary" size="md" className="rounded-2xl font-semibold bg-white text-[#E8192C] hover:bg-gray-100 shrink-0">
            Create Specification Now
          </Button>
        </Link>
      </div>

      {/* Posted Leads Feed */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#222222]">Your Posted Opportunities</h2>
          <Link href="/creator/my-leads" className="text-xs font-semibold text-[#E8192C] flex items-center gap-1 hover:underline">
            View all leads <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-4">
          {leads.slice(0, 4).map((lead) => (
            <Card key={lead._id} className="p-5 rounded-2xl border border-[#EBEBEB] bg-white hover:border-[#222222] transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 text-[#222222]">
                    {lead.xpoId}
                  </span>
                  <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">
                    {lead.status?.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-[#717171]">{lead.category?.name || 'Industrial'}</span>
                </div>
                <h4 className="text-sm font-bold text-[#222222]">{lead.title}</h4>
                <p className="text-xs text-[#717171] mt-1 line-clamp-1">{lead.description}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link href="/creator/responses">
                  <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                    Review Proposals
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
`);

// 2. app/(creator)/post-lead/page.tsx
writeFile('app/(creator)/post-lead/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function PostLeadPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('buy');
  const [country, setCountry] = useState('IN');
  const [city, setCity] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('INR');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.categories?.length > 0) {
          setCategories(data.categories);
          setCategory(data.categories[0]._id);
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          type,
          country,
          city,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          budgetCurrency,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to post lead');
      }

      router.push('/creator/my-leads');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to post lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Link href="/creator/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#717171] hover:text-[#222222] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-red-200 text-[#E8192C] bg-red-50 text-xs">
            Direct Opportunity
          </Badge>
          <span className="text-xs text-[#717171]">Sector-Agnostic Lead Generator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#222222] mt-1 tracking-tight">
          Post an Opportunity / Lead
        </h1>
        <p className="text-sm text-[#717171] mt-1">
          Specify what you need. XPO India will assign an official XPO-XXXXX tracking ID and broadcast it to qualified providers.
        </p>
      </div>

      <Card className="p-8 rounded-3xl border border-[#EBEBEB] shadow-xl bg-white">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Requirement Title */}
          <div>
            <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-2">
              Requirement Title *
            </label>
            <Input
              required
              placeholder="e.g. 5,000 Precision CNC Machined Aluminum Flanges or Multi-cloud AWS Migration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-[#EBEBEB] text-sm"
            />
            <p className="text-[11px] text-[#717171] mt-1">Be specific about quantity, material, or core scope of work.</p>
          </div>

          {/* Sector & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-2">
                Industry Sector / Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBEBEB] text-sm bg-white focus:outline-none focus:border-[#222222]"
                required
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-2">
                Opportunity Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBEBEB] text-sm bg-white focus:outline-none focus:border-[#222222]"
              >
                <option value="buy">Procurement / Buying</option>
                <option value="service">Contract / Service Hire</option>
                <option value="job">Bilateral Partnership</option>
                <option value="wholesale">Bulk Wholesale Supply</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-2">
              Detailed Specifications & Criteria *
            </label>
            <textarea
              required
              rows={5}
              placeholder="Provide exact technical details, required certifications (e.g. ISO 9001), delivery deadline, tolerance limits, and vendor qualifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 rounded-xl border border-[#EBEBEB] text-sm focus:outline-none focus:border-[#222222] resize-y"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-2">
                Country *
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBEBEB] text-sm bg-white focus:outline-none focus:border-[#222222]"
              >
                <option value="IN">India (Domestic)</option>
                <option value="US">United States</option>
                <option value="AE">United Arab Emirates</option>
                <option value="GB">United Kingdom</option>
                <option value="DE">Germany</option>
                <option value="GLOBAL">Global / Worldwide</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-2">
                City / Region
              </label>
              <Input
                placeholder="e.g. Pune / Bengaluru / Pan-India"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl border-[#EBEBEB] text-sm"
              />
            </div>
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-2">
                Currency
              </label>
              <select
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#EBEBEB] text-sm bg-white focus:outline-none focus:border-[#222222]"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-2">
                Target Min
              </label>
              <Input
                type="number"
                placeholder="Min budget"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="rounded-xl border-[#EBEBEB] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-2">
                Target Max
              </label>
              <Input
                type="number"
                placeholder="Max budget"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="rounded-xl border-[#EBEBEB] text-sm"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-2">
              Keywords & Tags (comma separated)
            </label>
            <Input
              placeholder="e.g. CNC, Machining, ISO9001, Aluminum, Fast Delivery"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="rounded-xl border-[#EBEBEB] text-sm"
            />
          </div>

          <div className="pt-4 border-t border-[#EBEBEB] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#717171]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Contact details remain protected until you connect.</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="font-semibold rounded-2xl"
              isLoading={loading}
            >
              Publish Opportunity (Assign XPO-ID)
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
`);

// 3. app/(creator)/my-leads/page.tsx
writeFile('app/(creator)/my-leads/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MessageSquare, ArrowLeft, ArrowRight, Eye, Calendar } from 'lucide-react';

export default function MyLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeads(data.leads || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Link href="/creator/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#717171] hover:text-[#222222] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
            My Posted Opportunities
          </h1>
          <p className="text-sm text-[#717171] mt-1">Manage specifications, check quote activity, and reveal connections.</p>
        </div>

        <Link href="/creator/post-lead">
          <Button variant="primary" size="md" className="rounded-2xl font-semibold flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Post New Lead
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {leads.map((lead) => (
          <Card key={lead._id} className="p-6 rounded-3xl border border-[#EBEBEB] bg-white hover:border-gray-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-[#222222]">
                  {lead.xpoId}
                </span>
                <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[11px] font-semibold">
                  {lead.status?.toUpperCase()}
                </Badge>
                <span className="text-xs text-[#717171]">{lead.category?.name}</span>
                <span className="text-xs text-[#717171]">• {lead.city || lead.country}</span>
              </div>
              <h3 className="text-base font-bold text-[#222222]">{lead.title}</h3>
              <p className="text-xs text-[#717171] line-clamp-2 max-w-3xl">{lead.description}</p>
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

            <div className="flex items-center gap-3 shrink-0">
              <Link href="/creator/responses">
                <Button variant="primary" size="sm" className="rounded-xl font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Review Quotes
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
`);

// 4. app/(creator)/responses/page.tsx
writeFile('app/(creator)/responses/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaywallModal } from '@/components/ui/paywall';
import {
  MessageSquareCheck,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  Mail,
  ShieldCheck,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export default function CreatorResponsesPage() {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    // In demo, fetch sample or seeded responses
    setResponses([
      {
        _id: 'resp_demo_01',
        leadId: 'XPO-10021',
        leadTitle: 'Requirement for 5,000 Precision CNC Machined Aluminum Flanges',
        providerName: 'Anil Patel (Patel Precision Tech)',
        company: 'Patel Precision Manufacturing & Tech',
        phone: '+91 9910044556',
        email: 'absorber@xpoindia.com',
        quoteAmount: 425000,
        quoteCurrency: 'INR',
        deliveryTimeline: '14 calendar days',
        message: 'We have 15+ years experience in aerospace and industrial precision CNC machining. We operate 5-axis Mazak machines and hold ISO 9001:2015 certification. Ready to deliver first batch within 14 days.',
        status: 'connected',
        isVerified: true,
      },
      {
        _id: 'resp_demo_02',
        leadId: 'XPO-10022',
        leadTitle: 'Full-Stack Next.js SaaS Platform Architecture & Cloud Migration',
        providerName: 'Vikram Joshi (CloudSphere)',
        company: 'CloudSphere Solutions Pvt Ltd',
        phone: '+91 9845012345',
        email: 'vikram@cloudsphere.io',
        quoteAmount: 750000,
        quoteCurrency: 'INR',
        deliveryTimeline: '30 working days',
        message: 'Our AWS Certified DevOps Architects have migrated 40+ fintech and logistics platforms. We specialize in Next.js 15, microservices, and MongoDB caching.',
        status: 'pending',
        isVerified: true,
      }
    ]);
    setLoading(false);
  }, []);

  const handleConnect = (respId: string) => {
    setResponses((prev) =>
      prev.map((r) => (r._id === respId ? { ...r, status: 'connected' } : r))
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Link href="/creator/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#717171] hover:text-[#222222] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
              Supplier Quotes & Responses
            </h1>
            <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
              Direct Bids
            </Badge>
          </div>
          <p className="text-sm text-[#717171] mt-1">
            Compare bids side-by-side. Connect to reveal direct contact details for WhatsApp and calls.
          </p>
        </div>

        <Link href="/creator/connections">
          <Button variant="outline" size="md" className="rounded-2xl font-semibold">
            View Direct Address Book
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {responses.map((resp) => {
          const isConnected = resp.status === 'connected';
          return (
            <Card key={resp._id} className="p-7 rounded-3xl border border-[#EBEBEB] bg-white shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-[#EBEBEB]">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-[#222222]">
                      {resp.leadId}
                    </span>
                    <span className="text-xs font-semibold text-[#717171]">{resp.leadTitle}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#222222] flex items-center gap-2">
                    {resp.providerName}
                    {resp.isVerified && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </h3>
                  <div className="text-xs text-[#717171] mt-0.5">{resp.company}</div>
                </div>

                <div className="flex flex-row lg:flex-col items-baseline lg:items-end justify-between gap-1 bg-[#F7F7F7] p-4 rounded-2xl border border-[#EBEBEB] shrink-0">
                  <div className="text-xs text-[#717171]">Proposed Quote</div>
                  <div className="text-2xl font-black text-[#222222]">
                    ₹{resp.quoteAmount.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-emerald-700 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> {resp.deliveryTimeline}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="py-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#717171] mb-1.5">Supplier Proposal</div>
                <p className="text-sm text-[#484848] leading-relaxed bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
                  "{resp.message}"
                </p>
              </div>

              {/* Contact Reveal Gate */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {isConnected ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={\`https://wa.me/\${resp.phone.replace(/[^0-9]/g, '')}?text=Hello%20\${encodeURIComponent(resp.providerName)},%20I%20reviewed%20your%20quote%20on%20XPO%20India%20for%20\${encodeURIComponent(resp.leadId)}\`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                    </a>
                    <a
                      href={\`tel:\${resp.phone}\`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#222222] hover:bg-black text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <Phone className="w-4 h-4" /> {resp.phone}
                    </a>
                    <a
                      href={\`mailto:\${resp.email}\`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EBEBEB] text-xs font-semibold text-[#222222] hover:bg-[#F7F7F7]"
                    >
                      <Mail className="w-4 h-4" /> {resp.email}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-[#717171]">
                    <Lock className="w-4 h-4 text-[#E8192C]" />
                    <span>Direct phone and WhatsApp unmask upon connecting. Zero commission cuts.</span>
                  </div>
                )}

                {!isConnected && (
                  <Button
                    variant="primary"
                    size="md"
                    className="rounded-2xl font-semibold"
                    onClick={() => handleConnect(resp._id)}
                  >
                    Accept Quote & Connect
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        role="creator"
      />
    </div>
  );
}
`);

// 5. app/(creator)/connections/page.tsx
writeFile('app/(creator)/connections/page.tsx', `'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, Phone, Mail, Building2, CheckCircle2 } from 'lucide-react';

export default function CreatorConnectionsPage() {
  const connections = [
    {
      id: 'conn_1',
      name: 'Anil Patel (Patel Precision Tech)',
      company: 'Patel Precision Manufacturing & Tech',
      phone: '+91 9910044556',
      email: 'absorber@xpoindia.com',
      sector: 'Manufacturing & Industrial',
      leadId: 'XPO-10021',
      dateConnected: '28 Sep 2026',
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Link href="/creator/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#717171] hover:text-[#222222] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
          Direct Connections Address Book
        </h1>
        <p className="text-sm text-[#717171] mt-1">
          Vendors and suppliers you have connected with. Deal directly with zero middleman commissions.
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#EBEBEB] text-[#222222] text-xs font-semibold hover:bg-[#F7F7F7]"
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

// 6. app/(creator)/subscription/page.tsx
writeFile('app/(creator)/subscription/page.tsx', `'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaywallModal } from '@/components/ui/paywall';
import { CheckCircle2, ShieldCheck, RefreshCw, ArrowLeft, CreditCard, Zap } from 'lucide-react';

export default function CreatorSubscriptionPage() {
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [autoPay, setAutoPay] = useState(true);

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Link href="/creator/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#717171] hover:text-[#222222] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
          Creator Membership & AutoPay
        </h1>
        <p className="text-sm text-[#717171] mt-1">Manage active plans, domestic Razorpay or international PayPal billing.</p>
      </div>

      <Card className="p-8 rounded-3xl border border-[#EBEBEB] bg-white shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#EBEBEB]">
          <div>
            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-xs font-semibold mb-2">
              Active Annual Plan
            </Badge>
            <h2 className="text-xl font-bold text-[#222222]">Lead Creator Annual (India)</h2>
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
        role="creator"
      />
    </div>
  );
}
`);

console.log('Creator pages written successfully!');
