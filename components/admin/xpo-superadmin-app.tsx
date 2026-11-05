'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export type SuperadminScreen =
  | 'queue'
  | 'requests'
  | 'req_detail'
  | 'directory'
  | 'categories'
  | 'notifs'
  | 'profile'
  | 'verify_rules'
  | 'billing'
  | 'settings'
  | 'help';

interface AdminRequestItem {
  id: string;
  code: string;
  title: string;
  cat: string;
  sub: string;
  clientName: string;
  clientCompany: string;
  loc: string;
  timeline: string;
  budget: string;
  posted: string;
  spec: string;
  status: 'held' | 'finding' | 'interested' | 'connected' | 'nomatch' | 'rejected' | 'closed';
  holdReason?: string;
  wave: number;
  repliesCount: number;
  connectedWith?: string;
}

interface KycQueueItem {
  id: string;
  company: string;
  contact: string;
  role: 'Client' | 'Partner';
  city: string;
  docType: string;
  docNumber: string;
  submitted: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface DirectoryMember {
  id: string;
  company: string;
  contact: string;
  role: 'Client' | 'Partner';
  city: string;
  phone: string;
  cat: string;
  kyc: 'Verified' | 'In review' | 'Phone verified';
  plan: string;
  invitedVia: string;
}

function getInitialRequests(): AdminRequestItem[] {
  return [
    {
      id: 'r3',
      code: 'XPO-REQ-41190',
      title: 'Marketing for a fantasy sports and betting app',
      cat: 'Performance Marketing & SEO',
      sub: 'Meta, Google Ads & B2B Lead Generation',
      clientName: 'Pavan',
      clientCompany: 'Test Traders',
      loc: 'Bengaluru',
      timeline: 'Immediate (Within 7 Days)',
      budget: '₹5,00,000',
      posted: 'today, 09:12',
      spec: 'Launch campaign across Meta and Google for a real-money gaming and fantasy sports app.',
      status: 'held',
      holdReason: 'Flagged keyword: "betting" — check policy before sending to partners',
      wave: 0,
      repliesCount: 0,
    },
    {
      id: 'r1',
      code: 'XPO-REQ-40971',
      title: 'E-commerce website for a 5-store retail chain',
      cat: 'Web & Mobile Development',
      sub: 'Full-Stack & SaaS Engineering',
      clientName: 'Pavan',
      clientCompany: 'Test Traders',
      loc: 'Hyderabad',
      timeline: 'Within 2-4 Weeks',
      budget: '₹2,00,000',
      posted: 'today, 10:42',
      spec: 'Product catalogue for 5 stores, UPI checkout, store pickup and stock sync with our billing software.',
      status: 'interested',
      wave: 2,
      repliesCount: 2,
    },
    {
      id: 'r2',
      code: 'XPO-REQ-41208',
      title: '10,000 printed 3-ply corrugated boxes',
      cat: 'Industrial Packaging & Raw Materials',
      sub: 'Corrugated, Flexible & Custom Packaging',
      clientName: 'Pavan',
      clientCompany: 'Test Traders',
      loc: 'Pune',
      timeline: 'Within 2-4 Weeks',
      budget: 'Quotes invited',
      posted: 'today, 11:05',
      spec: '3-ply, 12 x 10 x 8 in, 2-colour logo print, delivered to our Pune warehouse.',
      status: 'finding',
      wave: 1,
      repliesCount: 0,
    },
    {
      id: 'r4',
      code: 'XPO-REQ-40655',
      title: '50 kW rooftop solar for a warehouse',
      cat: 'Solar & Electrical EPC',
      sub: 'Commercial & Industrial Solar Rooftop',
      clientName: 'Pavan',
      clientCompany: 'Test Traders',
      loc: 'Nagpur',
      timeline: 'Flexible / Ongoing Retainer',
      budget: '₹25,00,000',
      posted: '31 Oct',
      spec: 'Net-metered rooftop system on a 12,000 sq ft warehouse roof.',
      status: 'nomatch',
      wave: 3,
      repliesCount: 0,
    },
    {
      id: 'r5',
      code: 'XPO-REQ-39114',
      title: 'Company website developer',
      cat: 'Web & Mobile Development',
      sub: 'Full-Stack & SaaS Engineering',
      clientName: 'Pavan',
      clientCompany: 'Test Traders',
      loc: 'Hyderabad',
      timeline: 'Flexible / Ongoing Retainer',
      budget: '₹40,000',
      posted: '28 Oct',
      spec: 'Five-page company website with an enquiry form.',
      status: 'connected',
      wave: 1,
      repliesCount: 1,
      connectedWith: 'Klo Tech · Mumbai',
    },
  ];
}

function getInitialKyc(): KycQueueItem[] {
  return [
    {
      id: 'k1',
      company: 'Shree Packaging',
      contact: 'Mahesh Kulkarni',
      role: 'Partner',
      city: 'Pune',
      docType: 'GST Registration Certificate',
      docNumber: '27AABCS1429B1Z1',
      submitted: 'Today, 10:18',
      status: 'pending',
    },
    {
      id: 'k2',
      company: 'Apex Industrial Supplies',
      contact: 'Karthik Reddy',
      role: 'Client',
      city: 'Bengaluru',
      docType: 'GST Registration Certificate',
      docNumber: '29AAACA8912K1Z4',
      submitted: 'Today, 09:40',
      status: 'pending',
    },
    {
      id: 'k3',
      company: 'Klo Tech Pvt Ltd',
      contact: 'Rohan Rao',
      role: 'Partner',
      city: 'Mumbai',
      docType: 'GST Registration Certificate',
      docNumber: '27AABCK8821M1Z9',
      submitted: '28 Oct',
      status: 'verified',
    },
    {
      id: 'k4',
      company: 'Test Traders',
      contact: 'Pavan',
      role: 'Client',
      city: 'Hyderabad',
      docType: 'GST Registration Certificate',
      docNumber: '36ABCDE1234F1Z5',
      submitted: '29 Oct',
      status: 'verified',
    },
  ];
}

function getInitialDirectory(): DirectoryMember[] {
  return [
    {
      id: 'd1',
      company: 'Test Traders',
      contact: 'Pavan',
      role: 'Client',
      city: 'Hyderabad',
      phone: '+91 63015 94552',
      cat: 'Retail & Multi-Store Operations',
      kyc: 'Verified',
      plan: '4 of 5 free views left',
      invitedVia: 'Direct signup',
    },
    {
      id: 'd2',
      company: 'Klo Tech',
      contact: 'Rohan Rao',
      role: 'Partner',
      city: 'Mumbai',
      phone: '+91 56794 24578',
      cat: 'Web & Mobile Development · Shopify',
      kyc: 'Verified',
      plan: 'Partner Plan · ₹999/mo',
      invitedVia: 'WhatsApp invite (Oct batch)',
    },
    {
      id: 'd3',
      company: 'Srujan Digital',
      contact: 'Srujan K',
      role: 'Partner',
      city: 'Hyderabad',
      phone: '+91 98490 11870',
      cat: 'Web & Mobile Development',
      kyc: 'Phone verified',
      plan: '2 of 3 free replies left',
      invitedVia: 'WhatsApp invite (Oct batch)',
    },
    {
      id: 'd4',
      company: 'Shree Packaging',
      contact: 'Mahesh Kulkarni',
      role: 'Partner',
      city: 'Pune',
      phone: '+91 99870 44556',
      cat: 'Industrial Packaging & Raw Materials',
      kyc: 'In review',
      plan: '3 of 3 free replies left',
      invitedVia: 'Excel upload · Pune Manufacturers',
    },
    {
      id: 'd5',
      company: 'Apex Industrial Supplies',
      contact: 'Karthik Reddy',
      role: 'Client',
      city: 'Bengaluru',
      phone: '+91 98450 88219',
      cat: 'Hardware & Industrial Distribution',
      kyc: 'In review',
      plan: 'Client Plan · ₹299/mo',
      invitedVia: 'Excel upload · BLR Buyers',
    },
  ];
}

const TAXONOMY_SECTORS = [
  {
    sector: 'Technology & Software',
    cat: 'Web & Mobile Development',
    sub: 'Full-Stack & SaaS Engineering',
    skills: ['Next.js', 'Shopify & E-commerce', 'Custom ERP & Portals', 'Razorpay & UPI APIs'],
    partners: 18,
  },
  {
    sector: 'Manufacturing & Industrial Supply',
    cat: 'Industrial Packaging & Raw Materials',
    sub: 'Corrugated, Flexible & Custom Packaging',
    skills: ['3-Ply & 5-Ply Boxes', 'Offset Printing', 'Die-Cut Mailers', 'Food-Grade Packaging'],
    partners: 24,
  },
  {
    sector: 'Finance, Legal & HR Advisory',
    cat: 'Accounting, GST & Virtual CFO',
    sub: 'Statutory Audit, GST & ROC Compliance',
    skills: ['Multi-State GST Filing', 'Tally Prime Sync', 'ROC Annual Filings', 'Virtual CFO'],
    partners: 14,
  },
  {
    sector: 'Construction, Interiors & EPC',
    cat: 'Commercial & Office Interiors',
    sub: 'Turnkey Office & Retail Fit-Outs',
    skills: ['Turnkey Office Fit-Out', 'HVAC & Electrical', 'Modular Workstations', 'Retail Storefronts'],
    partners: 11,
  },
  {
    sector: 'Construction, Interiors & EPC',
    cat: 'Solar & Electrical EPC',
    sub: 'Commercial & Industrial Solar Rooftop',
    skills: ['50kW–500kW Rooftop Solar', 'Net Metering', 'Warehouse Sheds', 'O&M AMC'],
    partners: 9,
  },
  {
    sector: 'Design, Branding & Digital Growth',
    cat: 'Performance Marketing & SEO',
    sub: 'Meta, Google Ads & B2B Lead Generation',
    skills: ['Meta & Google Ads', 'B2B Lead Gen', 'D2C Growth', 'Brand Identity'],
    partners: 16,
  },
];

export function XpoSuperadminApp() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [screen, setScreen] = useState<SuperadminScreen>('queue');
  const [selectedReqId, setSelectedReqId] = useState<string>('r3');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);
  const [ctlOpen, setCtlOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<string>('');

  const [reqFilter, setReqFilter] = useState<'all' | 'held' | 'active' | 'connected'>('all');
  const [reqSearch, setReqSearch] = useState<string>('');
  const [dirFilter, setDirFilter] = useState<'all' | 'Client' | 'Partner'>('all');
  const [dirSearch, setDirSearch] = useState<string>('');
  const [inviteModalOpen, setInviteModalOpen] = useState<boolean>(false);
  const [inviteRole, setInviteRole] = useState<'Partner' | 'Client'>('Partner');

  const [requests, setRequests] = useState<AdminRequestItem[]>(getInitialRequests);
  const [kycItems, setKycItems] = useState<KycQueueItem[]>(getInitialKyc);
  const [directory, setDirectory] = useState<DirectoryMember[]>(getInitialDirectory);

  const go = (target: SuperadminScreen, reqId?: string) => {
    setScreen(target);
    if (reqId) setSelectedReqId(reqId);
    setMenuOpen(false);
    setNotifOpen(false);
  };

  const heldReqs = requests.filter((r) => r.status === 'held');
  const pendingKyc = kycItems.filter((k) => k.status === 'pending');
  const totalAttention = heldReqs.length + pendingKyc.length;

  const approveRequest = (id: string) => {
    const target = requests.find((r) => r.id === id);
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'finding', wave: 1 } : r))
    );
    setToast(
      `${target?.code || 'Request'} approved · Wave 1 sent to 3 matching partners on WhatsApp`
    );
  };

  const rejectRequest = (id: string) => {
    const target = requests.find((r) => r.id === id);
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
    );
    setToast(
      `${target?.code || 'Request'} sent back to ${target?.clientName || 'client'} — "Betting services can't be listed"`
    );
  };

  const widenRequest = (id: string) => {
    const target = requests.find((r) => r.id === id);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: 'finding', loc: `${r.loc} + All-India`, wave: r.wave + 1 }
          : r
      )
    );
    setToast(`${target?.code || 'Request'} widened to All-India · Wave ${(target?.wave || 3) + 1} started`);
  };

  const verifyKyc = (id: string) => {
    const target = kycItems.find((k) => k.id === id);
    setKycItems((prev) => prev.map((k) => (k.id === id ? { ...k, status: 'verified' } : k)));
    if (target) {
      setDirectory((prev) =>
        prev.map((d) => (d.company === target.company ? { ...d, kyc: 'Verified' } : d))
      );
    }
    setToast(`${target?.company || 'Business'} verified · GST badge enabled on profile`);
  };

  const rejectKyc = (id: string) => {
    const target = kycItems.find((k) => k.id === id);
    setKycItems((prev) => prev.map((k) => (k.id === id ? { ...k, status: 'rejected' } : k)));
    setToast(`Asked ${target?.company || 'business'} for a clearer GST document`);
  };

  const statusChip = (r: AdminRequestItem) => {
    if (r.status === 'held') return { label: 'Being checked', cls: 'chip a' };
    if (r.status === 'rejected') return { label: 'Needs changes', cls: 'chip r' };
    if (r.status === 'nomatch') return { label: `No partner yet · ${r.wave} waves`, cls: 'chip a' };
    if (r.status === 'connected') return { label: 'Connected', cls: 'chip g' };
    if (r.status === 'interested') return { label: `${r.repliesCount} interested`, cls: 'chip g' };
    if (r.status === 'closed') return { label: 'Closed', cls: 'chip' };
    return { label: `Finding · Wave ${r.wave}`, cls: 'chip b' };
  };

  const filteredRequests = requests.filter((r) => {
    if (reqFilter === 'held' && r.status !== 'held') return false;
    if (reqFilter === 'active' && !['finding', 'interested', 'nomatch'].includes(r.status))
      return false;
    if (reqFilter === 'connected' && r.status !== 'connected') return false;
    if (reqSearch.trim()) {
      const q = reqSearch.toLowerCase();
      return (
        r.code.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.clientCompany.toLowerCase().includes(q) ||
        r.loc.toLowerCase().includes(q) ||
        r.cat.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredDirectory = directory.filter((d) => {
    if (dirFilter !== 'all' && d.role !== dirFilter) return false;
    if (dirSearch.trim()) {
      const q = dirSearch.toLowerCase();
      return (
        d.company.toLowerCase().includes(q) ||
        d.contact.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.cat.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeReq = requests.find((r) => r.id === selectedReqId) || requests[0];
  const isAccountScreen = ['profile', 'verify_rules', 'billing', 'settings', 'help'].includes(screen);

  return (
    <div
      className={`xt ${dark ? 'dark' : ''}`}
      onClick={() => {
        if (menuOpen) setMenuOpen(false);
        if (notifOpen) setNotifOpen(false);
      }}
    >
      <div className="shell">
        {/* LEFT SIDEBAR — Clean 4-item navigation matching Client & Partner UX */}
        <aside className="side">
          <div
            style={{
              padding: '4px 10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <img
              src="/xpo-logo.png"
              alt="XPO India"
              style={{ height: 28, width: 'auto', objectFit: 'contain', cursor: 'pointer' }}
              onClick={() => go('queue')}
            />
            <span className="chip p" style={{ fontSize: 10.5 }}>
              SUPERADMIN
            </span>
          </div>

          <button
            type="button"
            className="btn b1"
            style={{ width: '100%', marginBottom: 12 }}
            onClick={() => setInviteModalOpen(true)}
          >
            + Upload &amp; invite
          </button>

          <nav aria-label="Superadmin" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button
              type="button"
              className={`nav pn ${screen === 'queue' ? 'on' : ''}`}
              onClick={() => go('queue')}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span>Review queue</span>
              {totalAttention > 0 ? (
                <span className="cnt">{totalAttention}</span>
              ) : (
                <span className="cnt muted">0</span>
              )}
            </button>

            <button
              type="button"
              className={`nav pn ${screen === 'requests' || screen === 'req_detail' ? 'on' : ''}`}
              onClick={() => go('requests')}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              <span>Requests &amp; waves</span>
              <span className="cnt muted">{requests.length}</span>
            </button>

            <button
              type="button"
              className={`nav pn ${screen === 'directory' ? 'on' : ''}`}
              onClick={() => go('directory')}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Clients &amp; partners</span>
              <span className="cnt muted">{directory.length}</span>
            </button>

            <button
              type="button"
              className={`nav pn ${screen === 'categories' ? 'on' : ''}`}
              onClick={() => go('categories')}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>Categories</span>
              <span className="cnt muted">{TAXONOMY_SECTORS.length}</span>
            </button>
          </nav>

          <div
            style={{
              marginTop: 'auto',
              padding: 12,
              borderTop: '1px solid var(--ln)',
              fontSize: 12,
              color: 'var(--tx3)',
              lineHeight: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--tx2)' }}>Switch workspace</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                href="/dashboard/client"
                style={{ color: 'var(--tx)', fontWeight: 700, textDecoration: 'none' }}
              >
                Client app →
              </Link>
              <Link
                href="/dashboard/partner"
                style={{ color: 'var(--tx)', fontWeight: 700, textDecoration: 'none' }}
              >
                Partner app →
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN COLUMN */}
        <div className="col">
          {/* TOP HEADER */}
          <header className="top" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <img
                src="/xpo-logo.png"
                alt="XPO"
                className="only-sm"
                style={{ height: 24, width: 'auto' }}
              />
              {screen === 'req_detail' && activeReq && (
                <div className="crumb fx">
                  <button
                    type="button"
                    className="bl"
                    style={{ fontSize: 13 }}
                    onClick={() => go('requests')}
                  >
                    Requests &amp; waves
                  </button>
                  <span>/</span>
                  <b>{activeReq.code}</b>
                </div>
              )}
              {isAccountScreen && (
                <div className="crumb fx">
                  <span>Account</span>
                  <span>/</span>
                  <b>
                    {screen === 'profile'
                      ? 'Profile'
                      : screen === 'verify_rules'
                      ? 'Verification & moderation'
                      : screen === 'billing'
                      ? 'Plans & billing'
                      : screen === 'settings'
                      ? 'Settings & gateways'
                      : 'Help & audit log'}
                  </b>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
              <button
                type="button"
                className="pill hide-sm"
                onClick={() => go('queue')}
              >
                <span
                  className="pdot"
                  style={{ background: totalAttention > 0 ? '#D97706' : '#16A34A' }}
                />
                <span>
                  {totalAttention > 0
                    ? `${heldReqs.length} held · ${pendingKyc.length} KYC to check`
                    : 'All queues clear'}
                </span>
              </button>

              <button
                type="button"
                className="ib"
                aria-label="Notifications"
                onClick={() => {
                  setNotifOpen((n) => !n);
                  setMenuOpen(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
                </svg>
                {totalAttention > 0 && <span className="dot">{totalAttention}</span>}
              </button>

              <button
                type="button"
                className="av"
                aria-label="Superadmin menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => {
                  setMenuOpen((m) => !m);
                  setNotifOpen(false);
                }}
              >
                SA
              </button>

              {/* NOTIFICATIONS MENU */}
              {notifOpen && (
                <div className="menu" style={{ width: 340 }}>
                  <div
                    style={{
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--tx3)',
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                    }}
                  >
                    Operations queue
                  </div>
                  <button
                    type="button"
                    className="mi"
                    style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3, borderTop: '1px solid var(--ln)' }}
                    onClick={() => go('req_detail', 'r3')}
                  >
                    <b style={{ fontSize: 13.5 }}>XPO-REQ-41190 held for review</b>
                    <span style={{ fontSize: 12, color: 'var(--tx2)' }}>
                      Contains restricted keyword &ldquo;betting&rdquo; · Today, 09:12
                    </span>
                  </button>
                  <button
                    type="button"
                    className="mi"
                    style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3, borderTop: '1px solid var(--ln)' }}
                    onClick={() => go('queue')}
                  >
                    <b style={{ fontSize: 13.5 }}>2 GST certificates awaiting verification</b>
                    <span style={{ fontSize: 12, color: 'var(--tx2)' }}>
                      Shree Packaging (Pune) &amp; Apex Supplies (Bengaluru)
                    </span>
                  </button>
                </div>
              )}

              {/* TOP-RIGHT PROFILE WINDOW (Matches Client & Partner Reference) */}
              {menuOpen && (
                <div className="menu" role="menu" aria-label="Account">
                  <div
                    style={{
                      padding: '12px 12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      borderBottom: '1px solid var(--ln)',
                      marginBottom: 6,
                    }}
                  >
                    <b style={{ fontSize: 15 }}>Pavan (Superadmin)</b>
                    <span style={{ fontSize: 13, color: 'var(--tx2)' }}>
                      XPO India · Marketplace Operations
                    </span>
                  </div>

                  <button type="button" role="menuitem" className="mi" onClick={() => go('profile')}>
                    <span>Profile</span>
                  </button>
                  <button type="button" role="menuitem" className="mi" onClick={() => go('verify_rules')}>
                    <span>Verification &amp; moderation</span>
                    <span className="chip g">Active</span>
                  </button>
                  <button type="button" role="menuitem" className="mi" onClick={() => go('billing')}>
                    <span>Account &amp; Plans</span>
                    <span className="chip">₹299 / ₹999</span>
                  </button>
                  <button type="button" role="menuitem" className="mi" onClick={() => go('settings')}>
                    <span>Settings &amp; gateways</span>
                  </button>
                  <button type="button" role="menuitem" className="mi" onClick={() => go('help')}>
                    <span>Help &amp; audit log</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="mi"
                    onClick={() => {
                      setDark((d) => !d);
                      setMenuOpen(false);
                    }}
                  >
                    <span>{dark ? 'Light mode' : 'Dark mode'}</span>
                    <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{dark ? 'On' : 'Off'}</span>
                  </button>
                  <Link
                    href="/superadmin/login"
                    role="menuitem"
                    className="mi"
                    style={{
                      color: 'var(--rtx)',
                      borderTop: '1px solid var(--ln)',
                      borderRadius: '0 0 10px 10px',
                      marginTop: 6,
                    }}
                  >
                    <span>Sign out</span>
                  </Link>
                </div>
              )}
            </div>
          </header>

          {/* TOAST BANNER */}
          {toast && (
            <div
              role="status"
              style={{
                position: 'fixed',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: 88,
                zIndex: 45,
                boxShadow: '0 16px 32px -16px rgba(0,0,0,.45)',
                background: 'var(--inv)',
                color: '#fff',
                borderRadius: 12,
                padding: '12px 14px 12px 16px',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                gap: 14,
                alignItems: 'center',
              }}
            >
              <span>{toast}</span>
              <button
                type="button"
                onClick={() => setToast('')}
                style={{
                  background: 'none',
                  border: 0,
                  color: '#9FC1FF',
                  font: "700 13.5px 'Plus Jakarta Sans', sans-serif",
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* SCREEN 1: REVIEW QUEUE & PULSE (DEFAULT HOME) */}
          {screen === 'queue' && (
            <div className="pg" style={{ maxWidth: 920 }}>
              {/* Held Request Action Needed Banner */}
              {heldReqs.map((hr) => (
                <div
                  key={hr.id}
                  className="card"
                  style={{
                    padding: '18px 22px',
                    marginBottom: 20,
                    borderLeft: '4px solid #C8102E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 380px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span className="chip r">Held for check</span>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--tx3)' }}>
                        {hr.code}
                      </span>
                      <span className="chip">{hr.cat}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>
                      {hr.title}
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--tx2)', marginBottom: 4 }}>
                      “{hr.spec}” — posted by <b>{hr.clientCompany} ({hr.clientName})</b> · {hr.loc} · Budget {hr.budget}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--atx)', fontWeight: 600 }}>
                      {hr.holdReason}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn b1 sm"
                      onClick={() => approveRequest(hr.id)}
                    >
                      Approve &amp; start Wave 1
                    </button>
                    <button
                      type="button"
                      className="btn b2 sm"
                      onClick={() => rejectRequest(hr.id)}
                    >
                      Ask for changes
                    </button>
                  </div>
                </div>
              ))}

              {/* Page Headline */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginBottom: 18,
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      letterSpacing: '-.025em',
                      margin: '0 0 4px',
                    }}
                  >
                    Marketplace operations
                  </h1>
                  <p style={{ fontSize: 13.5, color: 'var(--tx2)', margin: 0 }}>
                    {totalAttention > 0
                      ? `${totalAttention} items need a quick check. 5-minute partner waves and mutual connections run automatically.`
                      : 'All held posts and verification documents are cleared.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn b2 sm"
                    onClick={() => router.push('/superadmin/whatsapp/simulator')}
                  >
                    WhatsApp simulator
                  </button>
                  <button
                    type="button"
                    className="btn b2 sm"
                    onClick={() => setInviteModalOpen(true)}
                  >
                    Upload Excel &amp; invite
                  </button>
                </div>
              </div>

              {/* Clean 4-Metric Pulse Strip (Balanced, never noisy) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <button
                  type="button"
                  className="card"
                  onClick={() => go('requests')}
                  style={{
                    padding: '16px 18px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span className="lbl">Client requests</span>
                  <b style={{ fontSize: 26 }}>{requests.length}</b>
                  <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>
                    {requests.filter((r) => ['finding', 'interested'].includes(r.status)).length} active in 5-min waves
                  </span>
                </button>

                <button
                  type="button"
                  className="card"
                  onClick={() => go('requests')}
                  style={{
                    padding: '16px 18px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span className="lbl">Replies &amp; connections</span>
                  <b style={{ fontSize: 26 }}>3 replies · 1 connected</b>
                  <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>
                    Avg 3.2 min to first partner reply
                  </span>
                </button>

                <button
                  type="button"
                  className="card"
                  onClick={() => go('directory')}
                  style={{
                    padding: '16px 18px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span className="lbl">Clients &amp; partners</span>
                  <b style={{ fontSize: 26 }}>{directory.length} businesses</b>
                  <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>
                    {kycItems.filter((k) => k.status === 'verified').length} GST verified · {pendingKyc.length} in review
                  </span>
                </button>

                <button
                  type="button"
                  className="card"
                  onClick={() => go('billing')}
                  style={{
                    padding: '16px 18px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span className="lbl">Active plans (Nov)</span>
                  <b style={{ fontSize: 26 }}>₹1,531.64</b>
                  <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>
                    1 Client Plan (₹299) · 1 Partner Plan (₹999)
                  </span>
                </button>
              </div>

              {/* KYC Verification Queue */}
              <div style={{ marginBottom: 26 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 10,
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                    Verification documents ({pendingKyc.length} waiting)
                  </h2>
                  <button
                    type="button"
                    className="bl"
                    style={{ fontSize: 13 }}
                    onClick={() => go('directory')}
                  >
                    All businesses →
                  </button>
                </div>

                {pendingKyc.length === 0 ? (
                  <div className="card" style={{ padding: 20, fontSize: 14, color: 'var(--tx2)' }}>
                    All submitted GST &amp; business documents have been verified.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pendingKyc.map((k) => (
                      <div
                        key={k.id}
                        className="card"
                        style={{
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <b style={{ fontSize: 15.5 }}>{k.company}</b>
                            <span className="chip">{k.role} · {k.city}</span>
                            <span className="chip a">In review</span>
                          </div>
                          <div style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                            {k.docType} · <span className="mono">{k.docNumber}</span> · Contact: {k.contact} · Submitted {k.submitted}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="btn b3 sm"
                            onClick={() => verifyKyc(k.id)}
                          >
                            Verify GST
                          </button>
                          <button
                            type="button"
                            className="btn b2 sm"
                            onClick={() => rejectKyc(k.id)}
                          >
                            Ask for new doc
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Live Requests & Waves */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 10,
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                    Recent client requests &amp; waves
                  </h2>
                  <button
                    type="button"
                    className="bl"
                    style={{ fontSize: 13 }}
                    onClick={() => go('requests')}
                  >
                    See all {requests.length} requests →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {requests.slice(0, 4).map((r) => {
                    const st = statusChip(r);
                    return (
                      <div
                        key={r.id}
                        role="button"
                        tabIndex={0}
                        className="rowb"
                        style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 10 }}
                        onClick={() => go('req_detail', r.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            go('req_detail', r.id);
                          }
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span className="mono" style={{ fontSize: 12, color: 'var(--tx3)' }}>
                              {r.code}
                            </span>
                            <span className="chip">{r.cat}</span>
                            <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>
                              by <b>{r.clientCompany}</b> ({r.clientName})
                            </span>
                          </div>
                          <span className={st.cls}>{st.label}</span>
                        </div>

                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
                            {r.title}
                          </div>
                          <div style={{ fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.55 }}>
                            {r.spec}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            paddingTop: 8,
                            borderTop: '1px solid var(--ln)',
                            fontSize: 12.5,
                            color: 'var(--tx3)',
                            flexWrap: 'wrap',
                            gap: 8,
                          }}
                        >
                          <div>
                            📍 {r.loc} · ⏱ {r.timeline} · 💰{' '}
                            <b style={{ color: 'var(--tx)' }}>{r.budget}</b> · Posted {r.posted}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--tx)' }}>
                            {r.status === 'held'
                              ? 'Review & approve →'
                              : r.status === 'nomatch'
                              ? 'Widen to All-India →'
                              : 'Inspect wave →'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 2: REQUESTS & WAVES */}
          {screen === 'requests' && (
            <div className="pg" style={{ maxWidth: 920 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginBottom: 18,
                }}
              >
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', margin: '0 0 4px' }}>
                    Requests &amp; 5-minute waves
                  </h1>
                  <p style={{ fontSize: 13.5, color: 'var(--tx2)', margin: 0 }}>
                    Every requirement posted by clients, live wave progress, and partner replies.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 18,
                }}
              >
                <div className="seg-group">
                  <button
                    type="button"
                    className={reqFilter === 'all' ? 'on' : ''}
                    onClick={() => setReqFilter('all')}
                  >
                    All ({requests.length})
                  </button>
                  <button
                    type="button"
                    className={reqFilter === 'held' ? 'on' : ''}
                    onClick={() => setReqFilter('held')}
                  >
                    Held ({heldReqs.length})
                  </button>
                  <button
                    type="button"
                    className={reqFilter === 'active' ? 'on' : ''}
                    onClick={() => setReqFilter('active')}
                  >
                    In waves ({requests.filter((r) => ['finding', 'interested', 'nomatch'].includes(r.status)).length})
                  </button>
                  <button
                    type="button"
                    className={reqFilter === 'connected' ? 'on' : ''}
                    onClick={() => setReqFilter('connected')}
                  >
                    Connected ({requests.filter((r) => r.status === 'connected').length})
                  </button>
                </div>

                <input
                  className="inp"
                  style={{ maxWidth: 280, width: '100%' }}
                  placeholder="Search ID, client, city or keyword"
                  value={reqSearch}
                  onChange={(e) => setReqSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredRequests.map((r) => {
                  const st = statusChip(r);
                  return (
                    <div
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      className="rowb"
                      style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 10 }}
                      onClick={() => go('req_detail', r.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          go('req_detail', r.id);
                        }
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span className="mono" style={{ fontSize: 12, color: 'var(--tx3)' }}>
                            {r.code}
                          </span>
                          <span className="chip">{r.cat}</span>
                          <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>
                            Client: <b>{r.clientCompany}</b> ({r.clientName})
                          </span>
                        </div>
                        <span className={st.cls}>{st.label}</span>
                      </div>

                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
                          {r.title}
                        </div>
                        <div style={{ fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.55 }}>
                          {r.spec}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          paddingTop: 8,
                          borderTop: '1px solid var(--ln)',
                          fontSize: 12.5,
                          color: 'var(--tx3)',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <div>
                          📍 {r.loc} · ⏱ {r.timeline} · 💰{' '}
                          <b style={{ color: 'var(--tx)' }}>{r.budget}</b> · Posted {r.posted}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--tx)' }}>
                          Manage request →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 2B: REQUEST DETAIL & WAVE CONTROL */}
          {screen === 'req_detail' && activeReq && (
            <div className="pg" style={{ maxWidth: 840 }}>
              <button
                type="button"
                className="bl"
                style={{ marginBottom: 10, paddingLeft: 0 }}
                onClick={() => go('requests')}
              >
                ← Back to requests &amp; waves
              </button>

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--tx3)' }}>
                    {activeReq.code}
                  </span>
                  <span className="chip">{activeReq.cat}</span>
                  <span className={statusChip(activeReq).cls}>{statusChip(activeReq).label}</span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>
                  {activeReq.title}
                </h1>
                <div style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                  Client: <b>{activeReq.clientCompany} ({activeReq.clientName})</b> · 📍 {activeReq.loc} ·{' '}
                  {activeReq.timeline} · Budget: <b>{activeReq.budget}</b>
                </div>
              </div>

              <div className="card" style={{ padding: 20, marginBottom: 18 }}>
                <div className="lbl" style={{ marginBottom: 6 }}>
                  Client specification
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{activeReq.spec}</p>
              </div>

              {activeReq.status === 'held' && (
                <div
                  className="card"
                  style={{
                    padding: 22,
                    borderLeft: '4px solid #C8102E',
                    marginBottom: 18,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
                    Moderation decision required
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--tx2)', margin: '0 0 14px' }}>
                    {activeReq.holdReason || 'Held for policy check before sending to partners.'}
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn b1"
                      onClick={() => approveRequest(activeReq.id)}
                    >
                      Approve &amp; dispatch Wave 1
                    </button>
                    <button
                      type="button"
                      className="btn b2"
                      onClick={() => rejectRequest(activeReq.id)}
                    >
                      Ask client for changes
                    </button>
                  </div>
                </div>
              )}

              {activeReq.status === 'nomatch' && (
                <div
                  className="card"
                  style={{
                    padding: 22,
                    borderLeft: '4px solid #D97706',
                    marginBottom: 18,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
                    No partner replied after {activeReq.wave} local waves in {activeReq.loc}
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--tx2)', margin: '0 0 14px' }}>
                    You can widen this requirement to verified partners across All-India and start Wave {activeReq.wave + 1}.
                  </p>
                  <button
                    type="button"
                    className="btn b1"
                    onClick={() => widenRequest(activeReq.id)}
                  >
                    Widen to All-India &amp; start Wave {activeReq.wave + 1}
                  </button>
                </div>
              )}

              <div className="card" style={{ padding: 20 }}>
                <div className="lbl" style={{ marginBottom: 8 }}>
                  Wave dispatch status
                </div>
                <div style={{ fontSize: 14, color: 'var(--tx2)', lineHeight: 1.6 }}>
                  {activeReq.status === 'held'
                    ? 'Wave 1 has not started yet (waiting for moderation approval).'
                    : activeReq.status === 'connected'
                    ? `Connected with ${activeReq.connectedWith || 'Klo Tech'}. Direct phone & WhatsApp shared both ways.`
                    : `Currently in Wave ${activeReq.wave} (batches of 3 verified partners every 5 minutes). ${activeReq.repliesCount} of 3 shortlist slots filled.`}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 3: CLIENTS & PARTNERS DIRECTORY */}
          {screen === 'directory' && (
            <div className="pg" style={{ maxWidth: 920 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginBottom: 18,
                }}
              >
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', margin: '0 0 4px' }}>
                    Clients &amp; partners
                  </h1>
                  <p style={{ fontSize: 13.5, color: 'var(--tx2)', margin: 0 }}>
                    Unified directory of businesses, GST verification badges, and WhatsApp onboarding.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn b1 sm"
                    onClick={() => setInviteModalOpen(true)}
                  >
                    + Upload Excel &amp; invite
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 18,
                }}
              >
                <div className="seg-group">
                  <button
                    type="button"
                    className={dirFilter === 'all' ? 'on' : ''}
                    onClick={() => setDirFilter('all')}
                  >
                    All ({directory.length})
                  </button>
                  <button
                    type="button"
                    className={dirFilter === 'Client' ? 'on' : ''}
                    onClick={() => setDirFilter('Client')}
                  >
                    Clients ({directory.filter((d) => d.role === 'Client').length})
                  </button>
                  <button
                    type="button"
                    className={dirFilter === 'Partner' ? 'on' : ''}
                    onClick={() => setDirFilter('Partner')}
                  >
                    Partners ({directory.filter((d) => d.role === 'Partner').length})
                  </button>
                </div>

                <input
                  className="inp"
                  style={{ maxWidth: 280, width: '100%' }}
                  placeholder="Search company, name, city or category"
                  value={dirSearch}
                  onChange={(e) => setDirSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredDirectory.map((m) => (
                  <div
                    key={m.id}
                    className="card"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: m.role === 'Partner' ? 'var(--bbg)' : 'var(--sf3)',
                          color: m.role === 'Partner' ? 'var(--btx)' : 'var(--tx)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                        }}
                      >
                        {m.company.charAt(0)}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <b style={{ fontSize: 15.5 }}>{m.company}</b>
                          <span className={`chip ${m.role === 'Partner' ? 'b' : ''}`}>{m.role}</span>
                          <span
                            className={`chip ${
                              m.kyc === 'Verified' ? 'g' : m.kyc === 'In review' ? 'a' : ''
                            }`}
                          >
                            {m.kyc}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--tx2)', marginTop: 2 }}>
                          {m.contact} · {m.city} · <span className="mono">{m.phone}</span> · {m.cat}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>
                          {m.plan} · {m.invitedVia}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {m.kyc !== 'Verified' && (
                        <button
                          type="button"
                          className="btn b3 sm"
                          onClick={() => {
                            setDirectory((prev) =>
                              prev.map((x) => (x.id === m.id ? { ...x, kyc: 'Verified' } : x))
                            );
                            setToast(`${m.company} marked as GST Verified`);
                          }}
                        >
                          Verify badge
                        </button>
                      )}
                      <a
                        className="btn b2 sm"
                        href={`https://wa.me/${m.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 4: CATEGORIES & 4-TIER TAXONOMY */}
          {screen === 'categories' && (
            <div className="pg" style={{ maxWidth: 920 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginBottom: 18,
                }}
              >
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', margin: '0 0 4px' }}>
                    Categories &amp; matching skills
                  </h1>
                  <p style={{ fontSize: 13.5, color: 'var(--tx2)', margin: 0 }}>
                    4-tier taxonomy (Sector › Category › Subcategory › Skills) used to route 5-minute waves.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn b2 sm"
                  onClick={() => router.push('/superadmin/taxonomy')}
                >
                  Open full taxonomy editor →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {TAXONOMY_SECTORS.map((t, idx) => (
                  <div key={idx} className="card" style={{ padding: 20 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <div className="lbl" style={{ marginBottom: 4 }}>
                          {t.sector}
                        </div>
                        <div style={{ fontSize: 16.5, fontWeight: 800 }}>
                          {t.cat} <span style={{ color: 'var(--tx3)', fontWeight: 500 }}>›</span>{' '}
                          <span style={{ fontWeight: 600, color: 'var(--tx2)' }}>{t.sub}</span>
                        </div>
                      </div>
                      <span className="chip g">{t.partners} verified partners</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {t.skills.map((sk) => (
                        <span key={sk} className="chip">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 5: UNIFIED ACCOUNT & PLATFORM SETTINGS (From Top-Right SA Menu) */}
          {isAccountScreen && (
            <div className="pg" style={{ maxWidth: 880 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 14px' }}>Account &amp; Settings</h1>

              <div
                role="tablist"
                aria-label="Superadmin Account"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  padding: 4,
                  background: 'var(--sf3)',
                  borderRadius: 12,
                  alignSelf: 'flex-start',
                  width: 'fit-content',
                  marginBottom: 22,
                }}
              >
                {(
                  [
                    ['profile', 'Profile'],
                    ['verify_rules', 'Verification & moderation'],
                    ['billing', 'Account & Plans'],
                    ['settings', 'Settings & gateways'],
                    ['help', 'Help & audit log'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    className="seg"
                    aria-selected={screen === key}
                    onClick={() => go(key)}
                    style={
                      screen === key
                        ? {
                            background: 'var(--sf)',
                            color: 'var(--tx)',
                            boxShadow: '0 1px 2px rgba(0,0,0,.08)',
                          }
                        : { background: 'transparent', color: 'var(--tx2)' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* TAB 1: PROFILE */}
              {screen === 'profile' && (
                <section
                  className="card"
                  style={{
                    maxWidth: 760,
                    padding: 24,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 16,
                  }}
                >
                  <label className="fld">
                    Operator name
                    <input className="inp" defaultValue="Pavan" />
                  </label>
                  <label className="fld">
                    Role
                    <input className="inp" value="Superadmin · XPO India" readOnly />
                  </label>
                  <label className="fld">
                    Operations email
                    <input className="inp" defaultValue="admin@xpoindia.com" />
                  </label>
                  <label className="fld">
                    Operations WhatsApp
                    <input className="inp" defaultValue="+91 40 4917 2200" />
                  </label>
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      type="button"
                      className="btn b3"
                      onClick={() => setToast('Superadmin profile saved')}
                    >
                      Save changes
                    </button>
                  </div>
                </section>
              )}

              {/* TAB 2: VERIFICATION & MODERATION RULES */}
              {screen === 'verify_rules' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <section className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <b style={{ fontSize: 17 }}>5-minute wave &amp; shortlist rules</b>
                      <span className="chip g">Active</span>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 14,
                      }}
                    >
                      <label className="fld">
                        Partners per wave
                        <input className="inp" defaultValue="3 partners" />
                      </label>
                      <label className="fld">
                        Wave interval
                        <input className="inp" defaultValue="5 minutes" />
                      </label>
                      <label className="fld">
                        Max interested shortlist
                        <input className="inp" defaultValue="3 interested replies" />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn b3"
                      style={{ alignSelf: 'flex-start' }}
                      onClick={() => setToast('Wave & moderation rules saved')}
                    >
                      Save matching rules
                    </button>
                  </section>

                  <section className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <b style={{ fontSize: 17 }}>Automatic hold keywords</b>
                    <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                      Requirements containing these words are held for a quick human check before partners see them.
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['betting', 'gambling', 'casino', 'crypto token', 'adult', 'loan app'].map((kw) => (
                        <span key={kw} className="chip r">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 3: ACCOUNT & PLANS (PRICING & LEDGER) */}
              {screen === 'billing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: 16,
                    }}
                  >
                    <section className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <span className="lbl">XPO Client Plan</span>
                      <b style={{ fontSize: 28 }}>₹299 / mo + 18% GST</b>
                      <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                        Overseas: <b>$9.99 / month</b> via PayPal · Includes <b>5 free starter views</b> and <b>30 views / month</b> on plan.
                      </span>
                    </section>

                    <section className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <span className="lbl">XPO Partner Plan</span>
                      <b style={{ fontSize: 28 }}>₹999 / mo + 18% GST</b>
                      <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                        Overseas: <b>$19.99 / month</b> via PayPal · Includes <b>3 free starter replies</b> and <b>50 replies / month</b> on plan.
                      </span>
                    </section>
                  </div>

                  <section className="card" style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr 1fr', minWidth: 560 }}>
                      <div className="lbl" style={{ padding: '12px 18px', background: 'var(--sf2)' }}>Invoice</div>
                      <div className="lbl" style={{ padding: '12px 18px', background: 'var(--sf2)' }}>Business</div>
                      <div className="lbl" style={{ padding: '12px 18px', background: 'var(--sf2)' }}>Plan</div>
                      <div className="lbl" style={{ padding: '12px 18px', background: 'var(--sf2)' }}>Amount</div>
                      {[
                        { inv: 'XPO-INV-2611-0088', biz: 'Klo Tech Pvt Ltd', plan: 'Partner Plan', amt: '₹1,178.82 (incl. GST)' },
                        { inv: 'XPO-INV-2611-0042', biz: 'Apex Industrial Supplies', plan: 'Client Plan', amt: '₹352.82 (incl. GST)' },
                      ].map((row) => (
                        <React.Fragment key={row.inv}>
                          <div className="mono" style={{ padding: '12px 18px', borderTop: '1px solid var(--ln)', fontSize: 13 }}>{row.inv}</div>
                          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--ln)', fontSize: 13.5, fontWeight: 600 }}>{row.biz}</div>
                          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--ln)', fontSize: 13.5 }}>{row.plan}</div>
                          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--ln)', fontSize: 13.5, fontWeight: 700 }}>{row.amt}</div>
                        </React.Fragment>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 4: SETTINGS & GATEWAYS */}
              {screen === 'settings' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 16,
                  }}
                >
                  <section className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <b style={{ fontSize: 17 }}>Payment &amp; WhatsApp API gateways</b>
                    <span style={{ fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.55 }}>
                      Configure Razorpay (UPI AutoPay &amp; cards), PayPal (USD), Meta WhatsApp Cloud API, and Gemini keys.
                    </span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                      <button
                        type="button"
                        className="btn b1 sm"
                        onClick={() => router.push('/superadmin/settings/gateways')}
                      >
                        Configure API keys →
                      </button>
                      <button
                        type="button"
                        className="btn b2 sm"
                        onClick={() => router.push('/superadmin/whatsapp/simulator')}
                      >
                        WhatsApp simulator →
                      </button>
                    </div>
                  </section>

                  <section className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <b style={{ fontSize: 17 }}>Bulk Excel import &amp; campaigns</b>
                    <span style={{ fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.55 }}>
                      Upload Client or Partner spreadsheets and send consented WhatsApp onboarding invitations.
                    </span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                      <button
                        type="button"
                        className="btn b3 sm"
                        onClick={() => setInviteModalOpen(true)}
                      >
                        Quick Excel upload
                      </button>
                      <button
                        type="button"
                        className="btn b2 sm"
                        onClick={() => router.push('/superadmin/import/companies')}
                      >
                        Advanced importer →
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 5: HELP & AUDIT LOG */}
              {screen === 'help' && (
                <section className="card" style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', minWidth: 540 }}>
                    <div className="lbl" style={{ padding: '12px 18px', background: 'var(--sf2)' }}>Admin action</div>
                    <div className="lbl" style={{ padding: '12px 18px', background: 'var(--sf2)' }}>Actor</div>
                    <div className="lbl" style={{ padding: '12px 18px', background: 'var(--sf2)' }}>Time</div>
                    {[
                      { a: 'Verified GST certificate for Test Traders (36ABCDE1234F1Z5)', by: 'Pavan (SA)', t: '29 Oct, 11:20' },
                      { a: 'Verified GST certificate for Klo Tech (27AABCK8821M1Z9)', by: 'Pavan (SA)', t: '28 Oct, 16:05' },
                      { a: 'Dispatched WhatsApp Partner invite batch (Pune Packaging · 40 contacts)', by: 'Pavan (SA)', t: '28 Oct, 10:15' },
                    ].map((log, i) => (
                      <React.Fragment key={i}>
                        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--ln)', fontSize: 13.5 }}>{log.a}</div>
                        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--ln)', fontSize: 13.5 }}>{log.by}</div>
                        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--ln)', fontSize: 13.5, color: 'var(--tx2)' }}>{log.t}</div>
                      </React.Fragment>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* EXCEL UPLOAD & WHATSAPP INVITE MODAL */}
      {inviteModalOpen && (
        <div className="scrim" onClick={() => setInviteModalOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--ln)' }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Upload Excel &amp; send WhatsApp invites</div>
              <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
                Import potential Clients or Partners and send a single consented WhatsApp invitation.
              </div>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="fld">
                <span>Database target</span>
                <div className="seg-group">
                  <button
                    type="button"
                    className={inviteRole === 'Partner' ? 'on' : ''}
                    onClick={() => setInviteRole('Partner')}
                  >
                    Partner database
                  </button>
                  <button
                    type="button"
                    className={inviteRole === 'Client' ? 'on' : ''}
                    onClick={() => setInviteRole('Client')}
                  >
                    Client database
                  </button>
                </div>
              </div>

              <label className="fld">
                Default category (for Partners)
                <select className="inp">
                  <option>Industrial Packaging &amp; Raw Materials</option>
                  <option>Web &amp; Mobile Development</option>
                  <option>Accounting, GST &amp; Virtual CFO</option>
                  <option>Commercial &amp; Office Interiors</option>
                  <option>Solar &amp; Electrical EPC</option>
                </select>
              </label>

              <div
                style={{
                  border: '1.5px dashed var(--ln2)',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                  fontSize: 13.5,
                  color: 'var(--tx2)',
                }}
              >
                Drop <b>.xlsx</b> or <b>.csv</b> file here (Columns: Company, Contact, WhatsApp E.164, City, Category)
              </div>
            </div>
            <div
              style={{
                padding: '14px 22px',
                borderTop: '1px solid var(--ln)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button type="button" className="btn b2" onClick={() => setInviteModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn b1"
                onClick={() => {
                  setInviteModalOpen(false);
                  setToast(`Uploaded ${inviteRole} sheet · WhatsApp invitations queued`);
                }}
              >
                Upload &amp; send invites
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROTOTYPE CONTROLS DRAWER (Matching Client & Partner Apps) */}
      <div className="ctlwrap" onClick={(e) => e.stopPropagation()}>
        {ctlOpen ? (
          <div className="ctlp">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <b style={{ fontSize: 12.5 }}>Prototype controls (Superadmin)</b>
              <button
                type="button"
                className="bl"
                style={{ fontSize: 12 }}
                onClick={() => setCtlOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="lbl" style={{ margin: '6px 0 4px' }}>
              Simulate marketplace events
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                type="button"
                className="btn b2 sm"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => {
                  setRequests(getInitialRequests());
                  setKycItems(getInitialKyc());
                  setScreen('queue');
                  setToast('Reset queue · 1 held request + 2 pending KYC docs');
                }}
              >
                Reset review queue (1 held + 2 KYC)
              </button>
              <button
                type="button"
                className="btn b2 sm"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => {
                  const newCode = `XPO-REQ-${41310 + Math.floor(Math.random() * 90)}`;
                  setRequests((prev) => [
                    {
                      id: 'r-' + Date.now(),
                      code: newCode,
                      title: 'Crypto casino & token promotion campaign',
                      cat: 'Performance Marketing & SEO',
                      sub: 'Meta, Google Ads & B2B Lead Generation',
                      clientName: 'Vikram',
                      clientCompany: 'Alpha Ventures',
                      loc: 'Mumbai',
                      timeline: 'Immediate (Within 7 Days)',
                      budget: '₹8,00,000',
                      posted: 'just now',
                      spec: 'Need influencer and performance ads for an offshore crypto casino.',
                      status: 'held',
                      holdReason: 'Flagged keyword: "casino" — check policy before sending to partners',
                      wave: 0,
                      repliesCount: 0,
                    },
                    ...prev,
                  ]);
                  setScreen('queue');
                  setToast(`New held post ${newCode} arrived in Review Queue`);
                }}
              >
                Simulate new flagged post arriving
              </button>
            </div>

            <div className="lbl" style={{ margin: '10px 0 4px' }}>
              Other apps in this prototype
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn b2 sm"
                style={{ flex: 1 }}
                onClick={() => router.push('/dashboard/client')}
              >
                Client app →
              </button>
              <button
                type="button"
                className="btn b2 sm"
                style={{ flex: 1 }}
                onClick={() => router.push('/dashboard/partner')}
              >
                Partner app →
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="ctlt"
            onClick={() => setCtlOpen(true)}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 99,
                background: '#C8102E',
              }}
            />
            Prototype controls
          </button>
        )}
      </div>
    </div>
  );
}
