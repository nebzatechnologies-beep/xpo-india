'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Search,
  Send,
  Building2,
  Phone,
  CheckCheck,
  Bot,
  Sparkles,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'inbound' | 'outbound';
  text: string;
  timestamp: string;
  status: string;
  providerMode?: 'simulated' | 'meta';
  interactiveOptions?: { id: string; title: string; description?: string }[];
}

interface Conversation {
  id: string;
  contactName: string;
  company: string;
  whatsapp: string;
  industry: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
}

export default function WhatsAppInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [simCustomerInput, setSimCustomerInput] = useState('');
  const [simCampaign, setSimCampaign] = useState('direct');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadInbox = useCallback((preserveSelected = true) => {
    fetch('/api/whatsapp/inbox')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setConversations(res.data);
          setSessions(res.sessions || []);
          if (!preserveSelected && res.data.length > 0) {
            setSelectedId(res.data[0].id);
          } else if (res.data.length > 0 && !selectedId) {
            setSelectedId(res.data[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(() => {
    loadInbox(false);
  }, [loadInbox]);

  const activeConv = conversations.find((c) => c.id === selectedId) || conversations[0];
  const activeSession = sessions.find((s) => s.phone === activeConv?.whatsapp);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    setSending(true);
    const textToSend = inputText;
    setInputText('');

    const res = await fetch('/api/whatsapp/inbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConv.id, text: textToSend }),
    });
    const data = await res.json();
    if (data.success) {
      loadInbox(true);
    }
    setSending(false);
  };

  const handleSimulateInbound = async (customText?: string, customCampaign?: string) => {
    const text = customText ?? simCustomerInput;
    if (!text.trim()) return;
    setSending(true);
    setSimCustomerInput('');

    const targetPhone = activeConv?.whatsapp || '+919820011223';
    const res = await fetch('/api/whatsapp/inbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direction: 'inbound_simulated',
        phone: targetPhone,
        text,
        campaignSource: customCampaign || simCampaign,
      }),
    });
    const data = await res.json();
    if (data.success) {
      loadInbox(true);
    }
    setSending(false);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EBEBEB]">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">
            WhatsApp Automation & Omnichannel Inbox
          </h1>
          <p className="text-xs text-[#717171] mt-0.5">
            Stateful conversation engine (4 ad-entry journeys, progressive onboarding, and live/simulated messaging).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-800 font-bold">
            <FlaskConical className="w-3 h-3 mr-1" />
            SIMULATED MESSAGES LABELED EXPLICITLY
          </Badge>
        </div>
      </div>

      {/* Interactive Bot & Ad-Journey Simulator Bar (Modules 3, 4, 5) */}
      <Card className="p-4 rounded-2xl border border-[#EBEBEB] bg-white shadow-none space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#222222]">
            <Bot className="w-4 h-4 text-[#E8192C]" />
            <span>Interactive WhatsApp Journey & Command Simulator (Customer → XPO Bot)</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#717171] uppercase mr-1">Ad Entry Journeys:</span>
            {[
              { label: '1. Find Clients (Partner)', text: 'Find Clients', camp: 'ig_find_clients' },
              { label: '2. Find Service Providers (Client)', text: 'Find Service Providers', camp: 'fb_find_providers' },
              { label: '3. Hire Employees (Employer)', text: 'Hire Employees', camp: 'li_hire_employees' },
              { label: '4. Find a Job (Job Seeker)', text: 'Find a Job', camp: 'wa_find_jobs' },
            ].map((j) => (
              <button
                key={j.camp}
                type="button"
                onClick={() => handleSimulateInbound(j.text, j.camp)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-[#E8192C] hover:bg-red-100 border border-red-200 transition-colors"
              >
                {j.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F4F4F4]">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold text-[#717171] uppercase mr-1">Engine Commands:</span>
            {['MENU', 'PROFILE', 'MY LEADS', 'MY JOBS', 'SUBSCRIPTION', 'HELP', 'PAUSE', 'START', 'STOP', 'CONFIRM'].map(
              (cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => handleSimulateInbound(cmd)}
                  className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-[#222222] font-mono text-[10px] font-bold"
                >
                  {cmd}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <select
              value={simCampaign}
              onChange={(e) => setSimCampaign(e.target.value)}
              className="px-2 py-1.5 text-[11px] rounded-lg border border-[#EBEBEB] bg-neutral-50 font-semibold"
            >
              <option value="direct">Source: Direct</option>
              <option value="ig_find_clients">Ad: IG Find Clients</option>
              <option value="fb_find_providers">Ad: FB Find Providers</option>
              <option value="li_hire_employees">Ad: LinkedIn Hire</option>
              <option value="wa_find_jobs">Ad: Find Jobs</option>
            </select>
            <input
              type="text"
              value={simCustomerInput}
              onChange={(e) => setSimCustomerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSimulateInbound();
                }
              }}
              placeholder="Simulate customer reply (e.g. name, city, skills)..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#EBEBEB] outline-none focus:border-[#E8192C]"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => handleSimulateInbound()}
              isLoading={sending}
              className="bg-[#222222] hover:bg-black text-white text-xs rounded-xl"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Simulate Reply
            </Button>
          </div>
        </div>
      </Card>

      {/* 3-COLUMN INBOX LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[640px]">
        {/* Left Column: Conversation List */}
        <div className="lg:col-span-3 h-full">
          <Card className="h-full rounded-2xl border border-[#EBEBEB] bg-white shadow-none flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[#EBEBEB]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#717171] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search chats, companies..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#EBEBEB] outline-none focus:border-[#E8192C]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#F0F0F0]">
              {conversations.map((c) => {
                const isSelected = c.id === activeConv?.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-red-50/40 border-l-4 border-[#E8192C]' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#222222] truncate">{c.contactName}</span>
                      <span className="text-[10px] text-[#717171]">{c.lastMessageTime}</span>
                    </div>
                    <div className="text-[11px] text-[#555555] font-semibold truncate">{c.company}</div>
                    <div className="text-[11px] text-[#717171] truncate mt-0.5 italic">&quot;{c.lastMessage}&quot;</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Centre Column: Chat Thread & Composer */}
        <div className="lg:col-span-6 h-full">
          <Card className="h-full rounded-2xl border border-[#DDD5C7] bg-[#EFEAE2] shadow-none flex flex-col justify-between overflow-hidden">
            {activeConv ? (
              <>
                {/* Chat Header */}
                <div className="p-3 bg-white border-b border-[#EBEBEB] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      {activeConv.contactName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#222222]">{activeConv.contactName}</div>
                      <div className="text-[10px] text-[#717171] font-mono">{activeConv.whatsapp}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold">
                    {activeSession?.currentState || 'ACTIVE SESSION'}
                  </Badge>
                </div>

                {/* Messages Thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeConv.messages.map((m) => {
                    const isSimulated = m.status === 'simulated' || m.providerMode === 'simulated';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.sender === 'outbound' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`p-3 rounded-2xl max-w-md text-xs shadow-xs space-y-1.5 ${
                            m.sender === 'outbound'
                              ? 'bg-[#D9FDD3] text-[#111B21] rounded-tr-none'
                              : 'bg-white text-[#111B21] rounded-tl-none'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{m.text}</div>

                          {m.interactiveOptions && m.interactiveOptions.length > 0 && (
                            <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap gap-1.5">
                              {m.interactiveOptions.map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleSimulateInbound(opt.title)}
                                  className="px-2.5 py-1 rounded-lg bg-white text-emerald-800 border border-emerald-300 text-[10px] font-bold hover:bg-emerald-50"
                                >
                                  {opt.title}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="text-[9px] text-[#667781] text-right flex items-center justify-end gap-1.5">
                            <span>{m.timestamp}</span>
                            {m.sender === 'outbound' &&
                              (isSimulated ? (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono font-bold text-[8px]">
                                  SIMULATED (NOT META DELIVERED)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                                  <CheckCheck className="w-3 h-3 text-[#53BDEB]" /> {m.status.toUpperCase()}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Composer */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-white border-t border-[#EBEBEB] flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Send manual Superadmin WhatsApp message..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#EBEBEB] outline-none focus:border-[#E8192C]"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={sending}
                    className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs rounded-xl px-4"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" /> Send
                  </Button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#717171]">
                Select a conversation to view messages.
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Stateful Session Inspector (Module 4) */}
        <div className="lg:col-span-3 h-full">
          <Card className="h-full rounded-2xl border border-[#EBEBEB] bg-white shadow-none p-4 overflow-y-auto space-y-4">
            <div className="pb-3 border-b border-[#EBEBEB]">
              <div className="font-black text-xs text-[#222222] uppercase tracking-wider">
                Stateful Conversation Engine
              </div>
              <div className="text-[11px] text-[#717171] mt-0.5">
                Live Firebase/CRM session state & progressive onboarding tracker
              </div>
            </div>

            {activeConv && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#717171] font-semibold">Phone (E.164):</span>
                    <span className="font-mono font-bold text-[#222222]">{activeConv.whatsapp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#717171] font-semibold">Journey Role:</span>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {activeSession?.role ? activeSession.role.toUpperCase() : 'UNSELECTED'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#717171] font-semibold">Engine State:</span>
                    <span className="font-mono font-bold text-[#E8192C]">
                      {activeSession?.currentState || 'IDLE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#717171] font-semibold">Campaign Source:</span>
                    <span className="font-mono text-[11px]">{activeSession?.campaignSource || 'direct'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#717171] font-semibold">Account Identity:</span>
                    <span className="text-[10px] font-bold text-amber-700">
                      {activeSession?.isVerifiedAccount ? 'Verified User' : 'Phone Only (Unverified)'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-[11px] text-[#222222] uppercase tracking-wider">
                    Saved Progressive Responses ({Object.keys(activeSession?.savedResponses || {}).length})
                  </div>
                  {activeSession && Object.keys(activeSession.savedResponses || {}).length > 0 ? (
                    <div className="p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB] space-y-1 text-[11px]">
                      {Object.entries(activeSession.savedResponses).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2">
                          <span className="text-[#717171] font-medium">{k}:</span>
                          <span className="font-bold text-[#222222] text-right truncate">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB] text-[11px] text-[#717171]">
                      Click any Ad Entry Journey button above to start progressive onboarding.
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
