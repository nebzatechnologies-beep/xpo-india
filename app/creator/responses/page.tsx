'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  Mail,
  ShieldCheck,
  Send,
  Lock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export default function CreatorResponsesPage() {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchResponses = () => {
    fetch('/api/responses')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.responses?.length > 0) {
          setResponses(data.responses);
        } else {
          setResponses([
            {
              _id: 'resp_demo_01',
              lead: {
                xpoId: 'XPO-10021',
                title: 'Requirement for 5,000 Precision CNC Machined Aluminum Flanges',
              },
              absorber: {
                name: 'Anil Patel',
                company: 'Patel Precision Manufacturing & Tech',
                phone: '+91 9910044556',
                email: 'absorber@xpoindia.com',
                isVerified: true,
              },
              experienceYears: '15+ years',
              portfolioLink: 'https://patelprecision.com/portfolio',
              message:
                'We have 15+ years experience in aerospace and industrial precision CNC machining. We operate 5-axis Mazak machines, have in-house anodizing, and hold ISO 9001:2015 certification. Ready to schedule technical review.',
              status: 'interested',
            },
            {
              _id: 'resp_demo_02',
              lead: {
                xpoId: 'XPO-10022',
                title: 'Full-Stack Next.js SaaS Platform Architecture & Cloud Migration',
              },
              absorber: {
                name: 'Vikram Joshi',
                company: 'CloudSphere Solutions Pvt Ltd',
                phone: '+91 9845012345',
                email: 'vikram@cloudsphere.io',
                isVerified: true,
              },
              experienceYears: '9+ years',
              portfolioLink: 'https://cloudsphere.io/case-studies',
              message:
                'Our AWS Certified DevOps Architects have migrated 40+ fintech and logistics platforms. We specialize in Next.js 15, microservices, and MongoDB caching.',
              status: 'connected',
            },
          ]);
        }
      })
      .catch(() => {
        setResponses([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const handleSendConnectionRequest = async (responseId: string) => {
    try {
      setActionLoading(responseId);
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_connection_request',
          responseId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchResponses();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Interested Partners
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 text-blue-700 bg-blue-50">
              Expressions of Interest
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Review qualified partners who expressed interest in your requirements. Send a Connection Request to unlock direct WhatsApp and phone details for off-platform negotiation.
          </p>
        </div>

        <Link href="/creator/connections">
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold border-[#E5E7EB] hover:bg-[#F9FAFB] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#E8192C]" /> View Connected Partners
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-[#6B7280]">
          Loading interested partners...
        </div>
      ) : responses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E7EB] space-y-3">
          <Users className="w-10 h-10 text-[#9CA3AF] mx-auto" />
          <h3 className="text-base font-bold text-[#111827]">No partner interests yet</h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            Once verified partners review your posted requirements, their capability pitches will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {responses.map((resp) => {
            const isConnected = resp.status === 'connected';
            const isRequested = resp.status === 'connection_requested';
            const leadXpoId = resp.lead?.xpoId || resp.leadId || 'XPO-REQ';
            const leadTitle = resp.lead?.title || resp.leadTitle || 'Commercial Requirement';
            const partner = resp.absorber || {
              name: resp.providerName,
              company: resp.company,
              phone: resp.phone,
              email: resp.email,
              isVerified: resp.isVerified,
            };

            return (
              <Card
                key={resp._id}
                className="p-7 rounded-3xl border border-[#EBEBEB] bg-white shadow-xs hover:shadow-md transition-all space-y-5"
              >
                {/* Header: Lead info & Partner Profile */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-4 border-b border-[#F3F4F6]">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-[#222222]">
                        {leadXpoId}
                      </span>
                      <span className="text-xs font-semibold text-[#717171]">{leadTitle}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#111827] flex items-center gap-1.5">
                        {partner.name}
                        {partner.isVerified && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </h3>
                      {resp.experienceYears && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-[#4B5563]">
                          {resp.experienceYears}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#6B7280] mt-0.5">{partner.company}</div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {isConnected ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 text-emerald-800 bg-emerald-50 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected & Unmasked
                      </span>
                    ) : isRequested ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full border border-amber-200 text-amber-800 bg-amber-50 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Connection Request Sent
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 rounded-full border border-blue-200 text-blue-800 bg-blue-50 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Partner Interested
                      </span>
                    )}
                  </div>
                </div>

                {/* Partner Capability Statement */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                    Partner Capability Pitch & Track Record
                  </div>
                  <p className="text-xs sm:text-sm text-[#374151] leading-relaxed bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB]">
                    &ldquo;{resp.message}&rdquo;
                  </p>
                </div>

                {/* Portfolio Link if present */}
                {resp.portfolioLink && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[#6B7280]">Credentials & Portfolio:</span>
                    <a
                      href={resp.portfolioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#E8192C] hover:underline inline-flex items-center gap-1"
                    >
                      {resp.portfolioLink} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Action Area: Contact Unmask or Send Connection Request */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[#F3F4F6]">
                  {isConnected ? (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <a
                        href={`https://wa.me/${partner.phone?.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(partner.name)},%20I%20reviewed%20your%20interest%20on%20XPO%20for%20${encodeURIComponent(leadXpoId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                      <a
                        href={`tel:${partner.phone}`}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-bold shadow-xs transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                      <a
                        href={`mailto:${partner.email}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#111827] hover:bg-[#F9FAFB]"
                      >
                        <Mail className="w-3.5 h-3.5" /> Email
                      </a>
                    </div>
                  ) : isRequested ? (
                    <div className="text-xs text-amber-800 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200 w-full sm:w-auto">
                      Connection request sent. You will be able to message this partner directly as soon as they accept.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <Lock className="w-4 h-4 text-[#E8192C] shrink-0" />
                      <span>Send connection request to unlock direct WhatsApp & phone.</span>
                    </div>
                  )}

                  {!isConnected && !isRequested && (
                    <Button
                      size="sm"
                      className="w-full sm:w-auto rounded-xl font-bold text-xs bg-[#E8192C] hover:bg-[#C0111F] text-white flex items-center justify-center gap-1.5 shadow-sm py-2.5 sm:py-1.5"
                      isLoading={actionLoading === resp._id}
                      onClick={() => handleSendConnectionRequest(resp._id)}
                    >
                      <Send className="w-3.5 h-3.5" /> Send Connection Request
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}