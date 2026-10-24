'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, Phone, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export default function MyResponsesPage() {
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
          // Fallback demo responses
          setResponses([
            {
              _id: 'resp_abs_1',
              lead: {
                xpoId: 'XPO-10021',
                title: 'Requirement for 5,000 Precision CNC Machined Aluminum Flanges',
                creator: {
                  name: 'Rajesh Sharma',
                  company: 'Sharma Heavy Engineering Ltd',
                  phone: '+91 9820011223',
                  email: 'creator@xpoindia.com',
                },
              },
              status: 'connection_requested',
              message: 'We have 15+ years experience in aerospace precision CNC machining with 5-axis Mazak machines and ISO 9001:2015 certification.',
            }
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

  const handleAccept = async (responseId: string) => {
    try {
      setActionLoading(responseId);
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept_connection_request',
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

  const handleDecline = async (responseId: string) => {
    try {
      setActionLoading(responseId);
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decline_connection_request',
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            My Expressions of Interest & Handshakes
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Track requirements where you expressed interest. Accept or decline connection requests from clients to unlock direct WhatsApp and phone details for off-platform negotiation.
          </p>
        </div>

        <Link href="/absorber/connections">
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold border-[#E5E7EB] hover:bg-[#F9FAFB] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> View Connected Clients
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-[#6B7280]">
          Loading your expressed interests...
        </div>
      ) : responses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E7EB] space-y-3">
          <CheckCircle2 className="w-10 h-10 text-[#9CA3AF] mx-auto" />
          <h3 className="text-base font-bold text-[#111827]">No active expressions of interest</h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            Browse the live opportunities feed to find requirements matching your capabilities and click &quot;I&apos;m Interested&quot;.
          </p>
          <Link href="/absorber/opportunities">
            <Button size="sm" className="rounded-xl text-xs font-bold bg-[#E8192C] hover:bg-[#C0111F] text-white mt-2">
              Browse Opportunities
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {responses.map((r) => {
            const isConnected = r.status === 'connected';
            const isRequested = r.status === 'connection_requested';
            const isDeclined = r.status === 'declined';
            const client = r.lead?.creator || {
              name: 'Client',
              company: 'Client Enterprise',
              phone: '+91 9820011223',
              email: 'creator@xpoindia.com',
            };

            return (
              <Card
                key={r._id}
                className={`p-6 rounded-3xl border transition-all ${
                  isRequested
                    ? 'border-blue-300 bg-blue-50/20 shadow-md ring-1 ring-blue-200'
                    : isConnected
                    ? 'border-emerald-200 bg-emerald-50/10 shadow-xs'
                    : 'border-[#EBEBEB] bg-white shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-[#222222]">
                        {r.lead?.xpoId}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          isConnected
                            ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                            : isRequested
                            ? 'border-blue-300 text-blue-700 bg-blue-50 animate-pulse'
                            : isDeclined
                            ? 'border-gray-200 text-gray-500 bg-gray-50'
                            : 'border-amber-200 text-amber-700 bg-amber-50'
                        }`}
                      >
                        {isRequested
                          ? '⚡ CONNECTION REQUEST RECEIVED'
                          : isConnected
                          ? 'CONNECTED & UNMASKED'
                          : isDeclined
                          ? 'DECLINED'
                          : 'INTEREST REGISTERED'}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-[#111827]">{r.lead?.title}</h3>

                    <div className="bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB] text-xs text-[#4B5563] space-y-1">
                      <span className="font-bold text-[#111827] block text-[11px] uppercase tracking-wider">
                        My Submitted Capability Statement:
                      </span>
                      <p className="italic leading-relaxed">&ldquo;{r.message}&rdquo;</p>
                    </div>
                  </div>

                  {/* Actions / Status Box */}
                  <div className="shrink-0 flex flex-col items-start lg:items-end justify-between gap-3 min-w-[260px] pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E5E7EB]">
                    {isRequested ? (
                      <div className="w-full space-y-2 p-3 bg-white rounded-2xl border border-blue-200 shadow-xs">
                        <div className="text-xs font-bold text-blue-900">
                          Client wants to connect!
                        </div>
                        <p className="text-[11px] text-[#6B7280]">
                          Accept this request to unlock direct WhatsApp and phone details for off-platform discussion.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            className="flex-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            isLoading={actionLoading === r._id}
                            onClick={() => handleAccept(r._id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs font-bold border-[#E5E7EB] text-[#6B7280] hover:text-red-600 hover:border-red-200"
                            isLoading={actionLoading === r._id}
                            onClick={() => handleDecline(r._id)}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ) : isConnected ? (
                      <div className="w-full space-y-2">
                        <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Handshake Complete
                        </div>
                        <div className="flex flex-wrap gap-2 w-full">
                          <a
                            href={`https://wa.me/${client.phone?.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(client.name)},%20connecting%20from%20XPO%20India%20regarding%20${encodeURIComponent(r.lead?.xpoId)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                          <a
                            href={`tel:${client.phone}`}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-bold shadow-xs transition-all"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                        </div>
                      </div>
                    ) : isDeclined ? (
                      <div className="text-xs text-gray-500 italic">
                        Connection request was declined.
                      </div>
                    ) : (
                      <div className="text-xs text-[#6B7280] bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-center">
                        <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                        Awaiting Client Review
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}