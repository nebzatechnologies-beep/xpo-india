'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { getXpoWhatsAppBotUrl } from '@/lib/whatsapp/demo-bot-link';
import { fetchMarketplaceState, subscribeMarketplaceSync, type MarketplaceLiveState } from '@/lib/marketplace/sync-client';
import {
  CheckCircle2,
  Building2,
  Handshake,
  MessageCircle,
  ChevronDown,
  Search,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'client' | 'partner' | 'whatsapp'>('client');
  const [searchVal, setSearchVal] = useState('');
  const [pricingPeriod, setPricingPeriod] = useState<'INR' | 'USD'>('INR');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [liveAdmin, setLiveAdmin] = useState<MarketplaceLiveState['admin'] | null>(null);

  useEffect(() => {
    void fetchMarketplaceState().then((s) => {
      if (s?.admin) setLiveAdmin(s.admin);
    });
    const unsub = subscribeMarketplaceSync((state) => {
      if (state.admin) {
        setLiveAdmin(state.admin);
      }
    });
    return unsub;
  }, []);

  const sampleChips = [
    { label: '📦 10,000 Corrugated Boxes, Pune', query: '10,000 printed 3-ply corrugated boxes Pune' },
    { label: '💻 Custom ERP & Tally Sync, Mumbai', query: 'Custom ERP inventory sync Tally Prime Mumbai' },
    { label: '☀ 50 kW Rooftop Solar, Nagpur', query: '50 kW on-grid rooftop solar warehouse Nagpur' },
    { label: '📊 Monthly GST & ROC, Bengaluru', query: 'Monthly GST filing statutory audit Bengaluru' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/dashboard/client?q=${encodeURIComponent(searchVal.trim())}`);
    } else {
      router.push('/dashboard/client');
    }
  };

  const categories = [
    {
      title: 'Industrial Packaging & Boxes',
      desc: 'Corrugated cartons, mono boxes, offset printing, and bubble wrap.',
      leads: '42 active requirements',
      sample: '10,000 printed 3-ply boxes · Pune MIDC',
      tag: '₹1.8L average deal',
      icon: '📦',
    },
    {
      title: 'Web, Mobile & Custom ERP',
      desc: 'Next.js web apps, Shopify Plus, Tally integrations, and SaaS portals.',
      leads: '38 active requirements',
      sample: 'Shopify Plus & warehouse sync · 5 stores',
      tag: '₹3.5L average deal',
      icon: '💻',
    },
    {
      title: 'Solar & Renewable Energy EPC',
      desc: 'Rooftop solar, net metering approvals, and industrial HT substation work.',
      leads: '19 active requirements',
      sample: '50 kW on-grid solar on warehouse shed · Nagpur',
      tag: '₹22L average deal',
      icon: '☀',
    },
    {
      title: 'CNC Machining & Fabrication',
      desc: 'Laser cutting, sheet metal bending, brass components, and castings.',
      leads: '27 active requirements',
      sample: '500 pcs SS 304 machined flanges · Rajkot',
      tag: '₹4.2L average deal',
      icon: '⚙️',
    },
    {
      title: 'GST, Virtual CFO & Compliance',
      desc: 'Statutory audits, monthly GST filing, ROC compliance, and tax advisory.',
      leads: '31 active requirements',
      sample: 'Monthly GST books for 3 corporate entities',
      tag: '₹90,000 / yr retainer',
      icon: '📊',
    },
    {
      title: 'Freight, Logistics & Warehousing',
      desc: 'Full-truckload (FTL), cold storage, 3PL fulfillment, and fleet leasing.',
      leads: '24 active requirements',
      sample: '32ft multi-axle freight Pune to Hyderabad',
      tag: '₹1.2L per trip',
      icon: '🚚',
    },
  ];

  const baseFaqs = [
    {
      q: 'How does XPO match clients and partners in 5 minutes?',
      a: 'When a Client posts a requirement (on Web, Mobile, or WhatsApp), our 4-tier taxonomy engine scores verified Partners based on category, location, and past delivery track record. Wave 1 offers are delivered to the top 3 matched Partners via WhatsApp with a 5-minute priority window. If a Partner is busy, the lead cascades to the next eligible Partner without any penalty.',
    },
    {
      q: 'Does XPO take any commission or percentage from closed deals?',
      a: 'No. Never. XPO is a 100% zero-commission platform. Once mutual consent is established, Client and Partner connect directly and execute their contracts, billing, and work without XPO taking any percentage or cut from the deal.',
    },
    {
      q: 'How is contact privacy protected against spam?',
      a: 'Phone numbers and email addresses are never published publicly or sold to lead lists. Clients view masked Partner quotes (capabilities, timeline, estimated quote). Direct contact details are released only when the Client spends a view credit and the Partner accepts the mutual connection request.',
    },
    {
      q: 'Can I use XPO entirely on WhatsApp without installing an app?',
      a: 'Yes! Both Clients and Partners can complete their entire workflow on WhatsApp via the official Meta Cloud API. Clients can post requirements in plain English, Hindi, or Hinglish (even voice notes), while Partners receive lead alerts with interactive quick-reply buttons.',
    },
    {
      q: 'What is the difference between Free and Paid plans?',
      a: 'Posting requirements is 100% free forever for Clients, including 5 free Partner unlocks. Partners get free registration with 5 starter lead reply credits. Paid plans (Client Plus at ₹299/mo and Partner Pro at ₹999/mo) offer higher monthly quotas, priority waves, and dedicated coordinator support.',
    },
  ];
  const cmsFaqs = liveAdmin?.siteCms?.faqs;
  const faqs = cmsFaqs && cmsFaqs.length > 0 ? cmsFaqs : baseFaqs;
  const clientMonthlyInr = liveAdmin?.pricing?.clientMonthly ? `₹${liveAdmin.pricing.clientMonthly}` : '₹299';
  const clientMonthlyUsd = liveAdmin?.pricing?.clientUsdMonthly ? `$${liveAdmin.pricing.clientUsdMonthly}` : '$9.99';
  const partnerMonthlyInr = liveAdmin?.pricing?.partnerMonthly ? `₹${liveAdmin.pricing.partnerMonthly}` : '₹999';
  const partnerMonthlyUsd = liveAdmin?.pricing?.partnerUsdMonthly ? `$${liveAdmin.pricing.partnerUsdMonthly}` : '$19.99';
  const clientQuota = String(liveAdmin?.pricing?.clientMonthlyViews || 30);
  const partnerQuota = String(liveAdmin?.pricing?.partnerMonthlyReplies || 50);

  return (
    <div
      className="xt"
      style={{
        minHeight: '100vh',
        background: '#FAFBFD',
        color: '#15171C',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />

      <main style={{ flex: '1 0 auto' }}>
        {/* ========================================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================================= */}
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #FFF6F7 0%, #FAFBFD 60%, #F6F6F4 100%)',
            padding: '56px 20px 72px',
            borderBottom: '1px solid #E4E5E9',
          }}
        >
          <div
            style={{
              maxWidth: 1120,
              margin: '0 auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24,
            }}
          >
            {/* Trust Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 999,
                background: '#FFFFFF',
                border: '1px solid #F3B8C0',
                boxShadow: '0 2px 8px rgba(200, 16, 46, 0.08)',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#C8102E',
                  boxShadow: '0 0 0 3px rgba(200, 16, 46, 0.2)',
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#15171C' }}>
                Zero-Commission B2B Marketplace · WhatsApp + Web &amp; Mobile Workspace
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(32px, 5.5vw, 64px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.08,
                maxWidth: 960,
              }}
            >
              Source verified Indian suppliers. <br />
              <span style={{ color: '#C8102E' }}>Win qualified B2B clients in 5 minutes.</span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                margin: 0,
                fontSize: 'clamp(16px, 2vw, 20px)',
                color: '#4A4F59',
                maxWidth: 760,
                lineHeight: 1.55,
                fontWeight: 400,
              }}
            >
              Buyers post requirements in plain words. Top verified suppliers receive 5-minute priority waves directly on WhatsApp. Connect directly with <b>0% commission</b>.
            </p>

            {/* Interactive Search & Requirement Intake Box */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                width: '100%',
                maxWidth: 780,
                background: '#FFFFFF',
                borderRadius: 20,
                border: '1.5px solid #E4E5E9',
                padding: '8px 10px 8px 18px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 16px 36px -12px rgba(21, 23, 28, 0.1)',
                margin: '12px 0 4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 280px' }}>
                <Search style={{ width: 20, height: 20, color: '#C8102E', flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="What do you need? e.g. 10,000 corrugated boxes Pune, Shopify developer..."
                  style={{
                    width: '100%',
                    border: 0,
                    outline: 'none',
                    fontSize: 15,
                    fontFamily: 'inherit',
                    background: 'transparent',
                    color: '#15171C',
                  }}
                />
              </div>
              <button
                type="submit"
                className="btn b1"
                style={{
                  minHeight: 46,
                  padding: '0 24px',
                  borderRadius: 14,
                  fontSize: 14.5,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                Post Requirement Free →
              </button>
            </form>

            {/* Sample Requirement Chips */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 12.5,
                color: '#4A4F59',
              }}
            >
              <span style={{ fontWeight: 700, color: '#15171C' }}>Try live examples:</span>
              {sampleChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchVal(chip.query);
                    router.push(`/dashboard/client?q=${encodeURIComponent(chip.query)}`);
                  }}
                  style={{
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    borderRadius: 99,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                justifyContent: 'center',
                paddingTop: 8,
              }}
            >
              <Link
                href="/dashboard/client"
                className="btn b1"
                style={{
                  minHeight: 48,
                  padding: '0 26px',
                  borderRadius: 14,
                  fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                <Building2 style={{ width: 18, height: 18 }} />
                <span>Client App (Post Free)</span>
              </Link>
              <Link
                href="/dashboard/partner"
                className="btn b2"
                style={{
                  minHeight: 48,
                  padding: '0 26px',
                  borderRadius: 14,
                  fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                <Handshake style={{ width: 18, height: 18, color: '#1E3A8A' }} />
                <span>Partner Lead Feed (5 Free)</span>
              </Link>
              <a
                href={getXpoWhatsAppBotUrl('general')}
                target="_blank"
                rel="noreferrer"
                className="btn"
                style={{
                  minHeight: 48,
                  padding: '0 22px',
                  borderRadius: 14,
                  fontSize: 14.5,
                  background: '#16A34A',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                }}
              >
                <MessageCircle style={{ width: 18, height: 18, color: '#FFFFFF' }} />
                <span>💬 Chat on XPO WhatsApp Bot →</span>
              </a>
            </div>

            {/* 4 Feature Highlights */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 12,
                width: '100%',
                maxWidth: 960,
                paddingTop: 20,
              }}
            >
              {[
                { title: '0% Deal Commission', desc: 'Keep 100% of contract value' },
                { title: '5-Minute Lead Waves', desc: 'Controlled, fair distribution' },
                { title: 'Mutual-Consent Privacy', desc: 'Zero spam, phone masked until approved' },
                { title: 'GST & Udyam Verified', desc: 'Genuine registered businesses only' },
              ].map((pill, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: '#FFFFFF',
                    border: '1px solid #E4E5E9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    textAlign: 'left',
                  }}
                >
                  <CheckCircle2 style={{ width: 18, height: 18, color: '#16A34A', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{pill.title}</div>
                    <div style={{ fontSize: 11.5, color: '#6B7280' }}>{pill.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. INTERACTIVE LIVE PRODUCT DEMO SHOWCASE (3 WORKSPACES) */}
        {/* ========================================================================= */}
        <section style={{ padding: '64px 20px', maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span
              className="chip"
              style={{ background: '#E8EEF9', color: '#1E3A8A', fontWeight: 800, marginBottom: 8 }}
            >
              Unified Platform
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 40px)', fontWeight: 900, margin: '4px 0 8px' }}>
              One experience across Web, Mobile App &amp; WhatsApp
            </h2>
            <p style={{ fontSize: 16, color: '#4A4F59', maxWidth: 640, margin: '0 auto' }}>
              Switch between workspaces to see how requirements flow instantly from intake to quote to mutual handshake.
            </p>

            {/* Tab Switcher */}
            <div
              style={{
                display: 'inline-flex',
                gap: 6,
                padding: 4,
                borderRadius: 14,
                background: '#EDEDEA',
                marginTop: 20,
                flexWrap: 'wrap',
              }}
            >
              {[
                { id: 'client', label: '👤 Client Workspace (Post & Compare)' },
                { id: 'partner', label: '🏭 Partner Feed (5-Min Wave Offers)' },
                { id: 'whatsapp', label: '💬 WhatsApp Bot (18-State Engine)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    minHeight: 38,
                    padding: '0 18px',
                    borderRadius: 10,
                    border: 0,
                    background: activeTab === t.id ? '#15171C' : 'transparent',
                    color: activeTab === t.id ? '#FFFFFF' : '#4A4F59',
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Card Preview */}
          <div
            className="card"
            style={{
              padding: '28px 24px',
              background: '#FFFFFF',
              border: '1.5px solid #E4E5E9',
              boxShadow: '0 20px 48px -18px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {activeTab === 'client' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <span className="chip" style={{ background: '#E3F2E8', color: '#14532D', alignSelf: 'flex-start' }}>
                    100% Free for Buyers
                  </span>
                  <h3 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
                    Post in 30 seconds. Review masked quotes with zero spam.
                  </h3>
                  <p style={{ fontSize: 14.5, color: '#4A4F59', lineHeight: 1.5, margin: 0 }}>
                    Write one sentence or upload a spec sheet. Our 4-tier taxonomy engine categorizes your requirement and matches up to 3 verified suppliers per 5-minute round.
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5 }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#16A34A' }} />
                      <span>5 starter partner view credits included free</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#16A34A' }} />
                      <span>Suppliers cannot see your phone until you unlock them</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#16A34A' }} />
                      <span>Instant sync between web dashboard, mobile app &amp; WhatsApp</span>
                    </li>
                  </ul>
                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <Link href="/dashboard/client" className="btn b1 sm" style={{ textDecoration: 'none' }}>
                      Open Client Dashboard →
                    </Link>
                    <a
                      href={getXpoWhatsAppBotUrl('client')}
                      target="_blank"
                      rel="noreferrer"
                      className="btn b2 sm"
                      style={{ textDecoration: 'none' }}
                    >
                      💬 Post via WhatsApp Chatbot →
                    </a>
                  </div>
                </div>

                {/* Sample Requirement Card Preview */}
                <div style={{ background: '#F6F6F4', padding: 20, borderRadius: 16, border: '1px solid #E4E5E9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="mono" style={{ fontSize: 12, color: '#8A8E97' }}>XPO-REQ-41208</span>
                    <span className="chip" style={{ background: '#E3F2E8', color: '#14532D' }}>1 Interested Partner</span>
                  </div>
                  <b style={{ fontSize: 17, color: '#C8102E', display: 'block', marginBottom: 4 }}>
                    10,000 printed 3-ply corrugated boxes
                  </b>
                  <div style={{ fontSize: 13, color: '#4A4F59', marginBottom: 12 }}>
                    Pune · Within 2-4 Weeks · Budget ₹1,80,000
                  </div>
                  <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1px solid #E4E5E9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <b style={{ fontSize: 14 }}>Klo Tech Pvt Ltd</b>
                      <span className="chip g" style={{ fontSize: 11 }}>GST Verified</span>
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#4A4F59', fontStyle: 'italic' }}>
                      &ldquo;We manufacture 3-ply boxes in Chakan MIDC with in-house flexo printing. Delivery in 10 days.&rdquo;
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span className="mono" style={{ fontWeight: 800 }}>Quote: ₹1,72,000</span>
                      <span style={{ color: '#16A34A', fontWeight: 700 }}>Ready to connect</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'partner' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <span className="chip" style={{ background: '#E8EEF9', color: '#1E3A8A', alignSelf: 'flex-start' }}>
                    5-Minute Priority Response
                  </span>
                  <h3 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
                    Get high-value B2B leads. Lock exclusivity with 1-tap reply.
                  </h3>
                  <p style={{ fontSize: 14.5, color: '#4A4F59', lineHeight: 1.5, margin: 0 }}>
                    Never compete against 50 agencies on an open job board. Wave 1 leads arrive directly on your phone, giving you 5 minutes to submit your quote before anyone else.
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5 }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#16A34A' }} />
                      <span>5 free starter reply credits on registration</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#16A34A' }} />
                      <span>Pass anytime with 0 credit deduction</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#16A34A' }} />
                      <span>0% commission on deal closures</span>
                    </li>
                  </ul>
                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <Link href="/dashboard/partner" className="btn b1 sm" style={{ textDecoration: 'none' }}>
                      Open Partner Feed →
                    </Link>
                    <a
                      href={getXpoWhatsAppBotUrl('partner')}
                      target="_blank"
                      rel="noreferrer"
                      className="btn b2 sm"
                      style={{ textDecoration: 'none' }}
                    >
                      💬 Reply via WhatsApp Chatbot →
                    </a>
                  </div>
                </div>

                {/* Partner Feed Card Preview */}
                <div style={{ background: '#15171C', color: '#FFFFFF', padding: 20, borderRadius: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, background: '#C8102E', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>
                      ⚡ WAVE 1 · NEW
                    </span>
                    <span className="mono" style={{ fontSize: 12, color: '#FBBF24', fontWeight: 800 }}>
                      ⏱ 04:32 left
                    </span>
                  </div>
                  <b style={{ fontSize: 17, display: 'block', marginBottom: 4 }}>
                    E-commerce website for a 5-store retail chain
                  </b>
                  <div style={{ fontSize: 13, color: '#A9ADB6', marginBottom: 12 }}>
                    Hyderabad · Budget ₹2,00,000 · Match: 98%
                  </div>
                  <p style={{ fontSize: 12.5, color: '#D1D5DB', lineHeight: 1.4, margin: '0 0 14px' }}>
                    &ldquo;Product catalogue for 5 stores, UPI checkout, store pickup and stock sync with our billing software.&rdquo;
                  </p>
                  <button type="button" className="btn b1" style={{ width: '100%', minHeight: 38, fontSize: 13 }}>
                    Send Quote (1 Reply Credit)
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <span className="chip" style={{ background: '#E3F2E8', color: '#14532D', alignSelf: 'flex-start' }}>
                    Meta Cloud API Verified
                  </span>
                  <h3 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
                    The entire marketplace works right inside WhatsApp.
                  </h3>
                  <p style={{ fontSize: 14.5, color: '#4A4F59', lineHeight: 1.5, margin: 0 }}>
                    18-state conversational engine handles requirement intake, Hinglish voice note translation, 5-minute lead alerts, and mutual contact sharing without opening a browser.
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5 }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#16A34A' }} />
                      <span>Natural language &amp; voice note requirement intake</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#16A34A' }} />
                      <span>Interactive buttons &amp; 1-tap quote submission</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#16A34A' }} />
                      <span>Automatic opt-out on STOP and coordinator escalation on SUPPORT</span>
                    </li>
                  </ul>
                  <div style={{ display: 'flex', gap: 10, paddingTop: 4, flexWrap: 'wrap' }}>
                    <a
                      href={getXpoWhatsAppBotUrl('client')}
                      target="_blank"
                      rel="noreferrer"
                      className="btn b1 sm"
                      style={{ textDecoration: 'none', background: '#16A34A' }}
                    >
                      💬 Open Dummy XPO Chatbot (Client) →
                    </a>
                    <a
                      href={getXpoWhatsAppBotUrl('partner')}
                      target="_blank"
                      rel="noreferrer"
                      className="btn b2 sm"
                      style={{ textDecoration: 'none' }}
                    >
                      💬 Open Dummy XPO Chatbot (Partner) →
                    </a>
                  </div>
                </div>

                {/* WhatsApp Chat Preview */}
                <div style={{ background: '#E5DDD5', padding: 16, borderRadius: 18, border: '1px solid #D4C8BE' }}>
                  <div style={{ background: '#075E54', color: '#fff', padding: '10px 14px', borderRadius: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#C8102E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                      XPO
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>XPO Assistant ✔ (+91 98490 00112)</div>
                      <div style={{ fontSize: 10.5, opacity: 0.85 }}>Meta Verified Business Account · Dummy Bot</div>
                    </div>
                  </div>
                  <div style={{ background: '#DCF8C6', padding: 10, borderRadius: '12px 12px 2px 12px', fontSize: 12.5, marginBottom: 8, marginLeft: 32 }}>
                    <b>Client (You):</b> Need 10,000 printed 3-ply corrugated boxes in Pune within 2 weeks, budget ₹1.8L
                  </div>
                  <div style={{ background: '#FFFFFF', padding: 12, borderRadius: '12px 12px 12px 2px', fontSize: 13, marginBottom: 8 }}>
                    <b style={{ color: '#075E54', display: 'block', marginBottom: 2 }}>⚡ NEW WAVE 1 LEAD · XPO-REQ-41208</b>
                    <b>10,000 printed 3-ply corrugated boxes (Pune)</b>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#4A4F59' }}>
                      ⏱ 5-Minute Wave 1 Clock active. Dispatched to 3 verified Partners. Tap to reply on WhatsApp:
                    </p>
                  </div>
                  <a
                    href={getXpoWhatsAppBotUrl('partner')}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'block',
                      background: '#075E54',
                      color: '#fff',
                      textAlign: 'center',
                      padding: '9px 12px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    ✓ Interested · Send Quote on WhatsApp (1 Reply) →
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. 4-TIER SECTOR & CATEGORY SHOWCASE */}
        {/* ========================================================================= */}
        <section style={{ padding: '64px 20px', background: '#FFFFFF', borderTop: '1px solid #E4E5E9', borderBottom: '1px solid #E4E5E9' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <span className="chip" style={{ background: '#FFF4DF', color: '#7A4A00', fontWeight: 800, marginBottom: 8 }}>
                Pan-India Network
              </span>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, margin: '4px 0 8px' }}>
                Key B2B Sectors &amp; Live Industry Categories
              </h2>
              <p style={{ fontSize: 15, color: '#4A4F59', margin: 0 }}>
                Over 150+ subcategories across major industrial and technology hubs.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {categories.map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    border: '1px solid #E4E5E9',
                    background: '#FAFBFD',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'border-color 0.15s, transform 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 24 }}>{c.icon}</span>
                    <span className="chip" style={{ background: '#FFFFFF', border: '1px solid #E4E5E9', fontSize: 11.5 }}>
                      {c.leads}
                    </span>
                  </div>
                  <b style={{ fontSize: 17 }}>{c.title}</b>
                  <p style={{ margin: 0, fontSize: 13, color: '#4A4F59', lineHeight: 1.45 }}>{c.desc}</p>
                  <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #E4E5E9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <span style={{ color: '#8A8E97' }}>Sample: {c.sample}</span>
                    <b style={{ color: '#C8102E' }}>{c.tag}</b>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Link href="/categories" className="btn b2" style={{ textDecoration: 'none' }}>
                Browse All 150+ Categories &amp; Skills →
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. HOW IT WORKS (THE 4-STEP FAIR MARKETPLACE) */}
        {/* ========================================================================= */}
        <section style={{ padding: '72px 20px', maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="chip" style={{ background: '#FDECEE', color: '#8E0B20', fontWeight: 800, marginBottom: 8 }}>
              Simple &amp; Transparent
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 40px)', fontWeight: 900, margin: '4px 0 8px' }}>
              How XPO Connects Buyers &amp; Suppliers in 4 Steps
            </h2>
            <p style={{ fontSize: 15.5, color: '#4A4F59', margin: 0 }}>
              No spam. No middleman markup. Real Indian businesses dealing directly.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              {
                step: '01',
                title: 'Post in Plain Words',
                desc: 'Describe what you need in one sentence or send a voice note on WhatsApp. Posting is 100% free.',
                color: '#C8102E',
              },
              {
                step: '02',
                title: '5-Minute Lead Waves',
                desc: 'Offers go to the top 3 ranked partners in 5-minute windows. If a partner is busy, the lead cascades to the next.',
                color: '#1E3A8A',
              },
              {
                step: '03',
                title: 'Review Masked Quotes',
                desc: 'Compare quotes, turnaround times, and verified credentials with your contact details completely private.',
                color: '#D97706',
              },
              {
                step: '04',
                title: 'Mutual Handshake',
                desc: 'Unlock your chosen partner. Direct WhatsApp & phone numbers are revealed only when both sides accept.',
                color: '#15803D',
              },
            ].map((s, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  position: 'relative',
                  borderTop: `4px solid ${s.color}`,
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, opacity: 0.9 }}>{s.step}</div>
                <b style={{ fontSize: 17 }}>{s.title}</b>
                <p style={{ margin: 0, fontSize: 13.5, color: '#4A4F59', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. TRANSPARENT PRICING */}
        {/* ========================================================================= */}
        <section style={{ padding: '64px 20px', background: '#F6F6F4', borderTop: '1px solid #E4E5E9', borderBottom: '1px solid #E4E5E9' }}>
          <div style={{ maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
            <span className="chip" style={{ background: '#E3F2E8', color: '#14532D', fontWeight: 800, marginBottom: 8 }}>
              Fair Pricing
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 38px)', fontWeight: 900, margin: '4px 0 8px' }}>
              Transparent Quotas. Zero Deal Commission.
            </h2>
            <p style={{ fontSize: 15, color: '#4A4F59', maxWidth: 600, margin: '0 auto 24px' }}>
              We never take a percentage from contracts. You only pay for partner view or lead reply quotas.
            </p>

            {/* Currency Switcher */}
            <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 12, background: '#EDEDEA', marginBottom: 32 }}>
              <button
                type="button"
                onClick={() => setPricingPeriod('INR')}
                style={{
                  minHeight: 34,
                  padding: '0 16px',
                  borderRadius: 9,
                  border: 0,
                  background: pricingPeriod === 'INR' ? '#15171C' : 'transparent',
                  color: pricingPeriod === 'INR' ? '#FFFFFF' : '#4A4F59',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                India (INR ₹)
              </button>
              <button
                type="button"
                onClick={() => setPricingPeriod('USD')}
                style={{
                  minHeight: 34,
                  padding: '0 16px',
                  borderRadius: 9,
                  border: 0,
                  background: pricingPeriod === 'USD' ? '#15171C' : 'transparent',
                  color: pricingPeriod === 'USD' ? '#FFFFFF' : '#4A4F59',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                International (USD $)
              </button>
            </div>

            {/* Pricing Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, textAlign: 'left' }}>
              {/* Card 1: Client Starter */}
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span className="chip" style={{ background: '#E3F2E8', color: '#14532D', alignSelf: 'flex-start' }}>
                  Client Starter
                </span>
                <b style={{ fontSize: 20 }}>Free Forever</b>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{pricingPeriod === 'INR' ? '₹0' : '$0'}</div>
                <p style={{ margin: 0, fontSize: 13, color: '#4A4F59' }}>
                  Ideal for any business posting periodic requirements.
                </p>
                <div style={{ borderTop: '1px solid #E4E5E9', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div>✓ Post unlimited requirements free</div>
                  <div>✓ 5 free partner unlocks on registration</div>
                  <div>✓ Masked contact privacy</div>
                  <div>✓ WhatsApp + Web workspace</div>
                </div>
                <Link href="/dashboard/client" className="btn b2" style={{ marginTop: 'auto', textDecoration: 'none' }}>
                  Start Posting Free
                </Link>
              </div>

              {/* Card 2: Client Plus */}
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, border: '2px solid #C8102E' }}>
                <span className="chip" style={{ background: '#FDECEE', color: '#8E0B20', alignSelf: 'flex-start' }}>
                  Client Plus
                </span>
                <b style={{ fontSize: 20 }}>Monthly Plan</b>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#C8102E' }}>
                  {pricingPeriod === 'INR' ? clientMonthlyInr : clientMonthlyUsd} <span style={{ fontSize: 14, fontWeight: 400, color: '#4A4F59' }}>/ month</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#4A4F59' }}>
                  For active purchasing teams and procurement heads.
                </p>
                <div style={{ borderTop: '1px solid #E4E5E9', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div>✓ <b>{clientQuota} partner unlocks</b> every month</div>
                  <div>✓ Priority matching queue</div>
                  <div>✓ Dedicated WhatsApp coordinator</div>
                  <div>✓ GST invoice download</div>
                </div>
                <Link href="/dashboard/client" className="btn b1" style={{ marginTop: 'auto', textDecoration: 'none' }}>
                  Get Client Plus
                </Link>
              </div>

              {/* Card 3: Partner Pro */}
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, border: '2px solid #1E3A8A' }}>
                <span className="chip" style={{ background: '#E8EEF9', color: '#1E3A8A', alignSelf: 'flex-start' }}>
                  Partner Pro
                </span>
                <b style={{ fontSize: 20 }}>Monthly Pro</b>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#1E3A8A' }}>
                  {pricingPeriod === 'INR' ? partnerMonthlyInr : partnerMonthlyUsd} <span style={{ fontSize: 14, fontWeight: 400, color: '#4A4F59' }}>/ month</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#4A4F59' }}>
                  For growing agencies, manufacturers &amp; service providers.
                </p>
                <div style={{ borderTop: '1px solid #E4E5E9', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div>✓ <b>{partnerQuota} lead replies</b> per month</div>
                  <div>✓ Wave 1 (5-minute window) priority</div>
                  <div>✓ Verified Partner badge on profile</div>
                  <div>✓ 0% commission on all contracts</div>
                </div>
                <Link href="/dashboard/partner" className="btn b1" style={{ marginTop: 'auto', background: '#1E3A8A', textDecoration: 'none' }}>
                  Join as Partner Pro
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. FREQUENTLY ASKED QUESTIONS */}
        {/* ========================================================================= */}
        <section style={{ padding: '64px 20px', maxWidth: 840, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span className="chip" style={{ background: '#EDEDEA', color: '#15171C', fontWeight: 800, marginBottom: 8 }}>
              FAQ
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, margin: '4px 0 8px' }}>
              Common Questions About XPO India
            </h2>
            <p style={{ fontSize: 15, color: '#4A4F59', margin: 0 }}>
              Everything you need to know about lead waves, privacy, and billing.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 14,
                    border: '1px solid #E4E5E9',
                    background: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      font: 'inherit',
                      color: '#15171C',
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    <span>{f.q}</span>
                    <ChevronDown
                      style={{
                        width: 18,
                        height: 18,
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        color: '#6B7280',
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  {open && (
                    <div style={{ padding: '0 20px 16px', fontSize: 14, color: '#4A4F59', lineHeight: 1.6 }}>
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. HIGH-CONVERSION BOTTOM BANNER */}
        {/* ========================================================================= */}
        <section
          style={{
            background: '#15171C',
            color: '#FFFFFF',
            padding: '64px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
              Ready to source or supply across India?
            </h2>
            <p style={{ fontSize: 16, color: '#A9ADB6', margin: 0, lineHeight: 1.55 }}>
              Join thousands of verified Indian manufacturers, agencies, and businesses winning deals in 5 minutes with zero commission.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', paddingTop: 8 }}>
              <Link
                href="/dashboard/client"
                className="btn b1"
                style={{ minHeight: 48, padding: '0 28px', borderRadius: 14, fontSize: 15, textDecoration: 'none' }}
              >
                Post a Requirement Free →
              </Link>
              <Link
                href="/dashboard/partner"
                className="btn b2"
                style={{ minHeight: 48, padding: '0 28px', borderRadius: 14, fontSize: 15, textDecoration: 'none' }}
              >
                Join as Partner (5 Free)
              </Link>
              <a
                href={getXpoWhatsAppBotUrl('general')}
                target="_blank"
                rel="noreferrer"
                className="btn"
                style={{
                  minHeight: 48,
                  padding: '0 24px',
                  borderRadius: 14,
                  fontSize: 14.5,
                  background: '#16A34A',
                  color: '#FFFFFF',
                  border: '1px solid #15803D',
                  textDecoration: 'none',
                }}
              >
                💬 Chat on XPO WhatsApp Bot
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
