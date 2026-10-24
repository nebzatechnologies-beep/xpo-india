'use client';

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

  // Expression of Interest form state (NO BIDDING / NO AUCTION)
  const [capabilityPitch, setCapabilityPitch] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchLead = () => {
    fetch(`/api/leads/${id}`)
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

  const handleExpressInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    if (!capabilityPitch.trim()) {
      setErrorMsg('Please describe your capability, experience, or suitability.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch(`/api/leads/${lead._id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'express_interest',
          capabilityPitch,
          portfolioLink,
          experienceYears,
          message: capabilityPitch,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to express interest');
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <Link href="/absorber/opportunities" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#717171] hover:text-[#222222]">
        <ArrowLeft className="w-4 h-4" /> Back to opportunities feed
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 sm:p-8 rounded-3xl border border-[#EBEBEB] bg-white shadow-xs">
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

            <div className="mt-6 pt-6 border-t border-[#EBEBEB] grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] text-[#717171] block">Location</span>
                <span className="text-xs font-semibold text-[#222222]">{lead.city || lead.country || 'Pan-India'}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#717171] block">Budget / Price</span>
                <span className="text-xs font-semibold text-[#222222]">
                  {lead.budgetOpenForDiscussion || (!lead.budgetMin && !lead.budgetMax)
                    ? 'Open for Discussion'
                    : `${lead.budgetCurrency === 'USD' ? '$' : '₹'}${lead.budgetMin?.toLocaleString() || ''} - ${lead.budgetCurrency === 'USD' ? '$' : '₹'}${lead.budgetMax?.toLocaleString() || ''}`}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#717171] block">Required Quantity</span>
                <span className="text-xs font-semibold text-[#222222]">{lead.quantity || 'Open / As Per Scope'}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#717171] block">Deadline</span>
                <span className="text-xs font-semibold text-[#222222]">{lead.deadline || 'Flexible'}</span>
              </div>
            </div>

            {lead.attachments && lead.attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#EBEBEB]">
                <span className="text-[11px] text-[#717171] block mb-1">Specifications & Drawings</span>
                <a
                  href={lead.attachments[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#E8192C] hover:underline inline-flex items-center gap-1"
                >
                  🔗 View Attached Drawing / Spec Sheet
                </a>
              </div>
            )}
          </Card>

          {/* Express Interest Card (NO BIDDING / NO AUCTION) */}
          <Card className="p-5 sm:p-8 rounded-3xl border border-[#EBEBEB] bg-white shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-[#E8192C]" />
                <h2 className="text-xl font-bold text-[#222222]">
                  Express Interest in this Requirement
                </h2>
              </div>
              <p className="text-xs text-[#717171]">
                XPO is not an auction or bidding platform. Simply register your interest and share your capabilities. The Client will review your profile and can initiate a Connection Request.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 leading-relaxed">
              <span className="font-bold">⚡ How XPO Works:</span> Partners do NOT bid against each other. Click <strong>&quot;I&apos;m Interested&quot;</strong> below to introduce your capabilities. When the Client connects, direct WhatsApp and phone contact details are exchanged to negotiate terms off-platform with <strong>0% deal commission</strong>.
            </div>

            {userResponse || submittedSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Your Interest Has Been Registered!
                </div>

                <div className="text-xs space-y-1.5 text-emerald-800">
                  <div>
                    Status:{' '}
                    <span className="font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {userResponse?.status || 'INTERESTED'}
                    </span>
                  </div>
                  {userResponse?.status === 'connection_requested' ? (
                    <div className="p-3 rounded-xl bg-white border border-emerald-300 space-y-2">
                      <p className="font-bold text-emerald-900">
                        🎉 Great news! The Client has sent you a Connection Request.
                      </p>
                      <Link href="/absorber/my-responses">
                        <Button size="sm" className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                          Accept Connection Request
                        </Button>
                      </Link>
                    </div>
                  ) : userResponse?.status === 'connected' ? (
                    <div className="p-3 rounded-xl bg-white border border-emerald-300 space-y-1">
                      <p className="font-bold text-emerald-900">
                        ✅ Handshake Complete! Direct contact unmasked.
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        You can now reach out directly to the Client via WhatsApp or phone.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-700">
                      The Client has been notified. When they send a Connection Request, you can accept to immediately unmask direct WhatsApp and phone numbers.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleExpressInterest} className="space-y-4 pt-2">
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-1.5">
                    Capability Statement & Relevant Experience *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Highlight your infrastructure, machinery, team capacity, certifications (e.g. ISO 9001), past deliverables, and why your firm is suited to fulfill this requirement..."
                    value={capabilityPitch}
                    onChange={(e) => setCapabilityPitch(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-[#EBEBEB] text-xs focus:outline-none focus:border-[#E8192C] resize-y bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-1.5">
                      Relevant Track Record / Experience (Optional)
                    </label>
                    <Input
                      placeholder="e.g. 12+ years in Precision CNC"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="rounded-xl border-[#EBEBEB] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-1.5">
                      Portfolio / Case Studies URL (Optional)
                    </label>
                    <Input
                      placeholder="e.g. https://yourcompany.com/portfolio"
                      value={portfolioLink}
                      onChange={(e) => setPortfolioLink(e.target.value)}
                      className="rounded-xl border-[#EBEBEB] text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold text-xs rounded-2xl bg-[#E8192C] hover:bg-[#C0111F] text-white flex items-center justify-center gap-2 shadow-sm"
                  isLoading={submitting}
                >
                  <Sparkles className="w-4 h-4" /> I&apos;m Interested
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* Sidebar / Paywall Contact Card (1 col) */}
        <div className="space-y-6">
          <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white shadow-sm">
            <h3 className="text-base font-bold text-[#222222] mb-3">Client Information</h3>
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
                    href={`https://wa.me/${lead.creator?.phone?.replace(/[^0-9]/g, '')}`}
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