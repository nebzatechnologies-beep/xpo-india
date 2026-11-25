'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { getXpoWhatsAppBotUrl } from '@/lib/whatsapp/demo-bot-link';

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [flashOpen, setFlashOpen] = useState(false);

  const sampleChips = [
    'Corrugated boxes, Pune',
    'ERP + Tally, Mumbai',
    'Rooftop solar, Nagpur',
  ];

  const handlePost = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim();
    if (clean.length < 4) {
      const input = document.getElementById('hero-q') as HTMLInputElement | null;
      if (input) input.focus();
      return;
    }
    setFlashOpen(true);
  };

  const handleChipClick = (text: string) => {
    setQuery(text);
    const input = document.getElementById('hero-q') as HTMLInputElement | null;
    if (input) {
      input.value = text;
      input.focus();
    }
  };

  const handleProceedToWorkspace = () => {
    const clean = query.trim();
    if (clean) {
      router.push(`/dashboard/client?q=${encodeURIComponent(clean)}`);
    } else {
      router.push('/dashboard/client');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] text-[#15171C]">
      <Navbar />

      <main id="top" className="flex-1">
        {/* HERO SECTION */}
        <section className="py-12 sm:py-16">
          <div className="max-w-[1140px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.03fr_0.97fr] gap-10 lg:gap-12 items-center">
            {/* LEFT COLUMN: HERO CONTENT & COMPOSE */}
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-balance">
                Describe what you need.
                <br />
                <em className="not-italic text-[#C8102E]">Verified suppliers reply.</em>
              </h1>
              <p className="mt-4 text-[17.5px] text-[#565B63] max-w-[48ch] leading-relaxed">
                Post in plain words. XPO matches it to GST-verified businesses across India — freelancers to factories. No commission on your deal.
              </p>

              {/* POST BOX */}
              <form onSubmit={handlePost} className="post-box">
                <input
                  id="hero-q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. 10,000 printed corrugated boxes in Pune"
                  aria-label="What do you need?"
                />
                <button type="submit" className="btn b1 lg" style={{ background: '#C8102E', color: '#fff', borderRadius: 14 }}>
                  Post free
                </button>
              </form>

              {/* TRY CHIPS */}
              <div className="mt-3.5 flex flex-wrap gap-2 items-center">
                <span className="text-[13px] text-[#8A8F98] font-semibold">Try:</span>
                {sampleChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    className="chipb"
                    style={{
                      borderRadius: 999,
                      border: '1.5px solid #D6D6D0',
                      background: '#FFFFFF',
                      fontSize: '13.5px',
                      padding: '0 14px',
                      minHeight: '36px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* FLASH NOTIFICATION AFTER POSTING */}
              {flashOpen && (
                <div className="flash-box">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex-1 text-sm text-emerald-950">
                    <b>That&apos;s all it takes.</b> XPO drafts this into a clear requirement and starts matching verified suppliers in 5-minute waves.
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleProceedToWorkspace}
                        className="btn b1 sm"
                        style={{ background: '#1D7A45', color: '#fff', borderRadius: 8, fontSize: 12.5 }}
                      >
                        Open requirement in Client Workspace →
                      </button>
                      <a
                        href={getXpoWhatsAppBotUrl('client', query ? `Post requirement: ${query}` : undefined)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn sm"
                        style={{ border: '1px solid #1D7A45', background: '#fff', color: '#1D7A45', borderRadius: 8, fontSize: 12.5 }}
                      >
                        💬 Confirm on WhatsApp Bot
                      </a>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: HUMAN ILLUSTRATION */}
            <div className="flex flex-col items-center justify-center">
              <img
                src="/illustrations/connect.svg"
                alt="A buyer and a verified supplier connecting directly on XPO"
                className="w-full max-w-[440px] h-auto select-none"
                draggable={false}
              />
            </div>
          </div>
        </section>

        {/* SECTION 1: HOW IT WORKS (#how) */}
        <section className="band alt" id="how">
          <div className="wrap max-w-[1140px] mx-auto px-6">
            <div className="head">
              <h2>Three steps. No forms, no phone tag.</h2>
            </div>
            <div className="flex justify-center mb-8 sm:mb-10">
              <img
                src="/illustrations/deal-handshake.svg"
                alt="A buyer and a verified supplier closing a deal"
                className="w-full max-w-[380px] h-auto select-none"
                draggable={false}
              />
            </div>
            <div className="steps-grid">
              <div className="step-card">
                <div className="k">1</div>
                <h3>Describe it</h3>
                <p>Type what you need in plain words, or send a voice note. No category trees to hunt through.</p>
              </div>
              <div className="step-card">
                <div className="k">2</div>
                <h3>Get matched</h3>
                <p>Verified suppliers who do exactly this are alerted first, a few at a time, and reply with a quote.</p>
              </div>
              <div className="step-card">
                <div className="k">3</div>
                <h3>Choose &amp; connect</h3>
                <p>Compare replies, pick who you like, and connect directly once you both agree. No middleman, no cut.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: CATEGORIES (#cats) */}
        <section className="band" id="cats">
          <div className="wrap max-w-[1140px] mx-auto px-6">
            <div className="head">
              <h2>From a freelancer to a factory.</h2>
              <p className="sub">150+ categories across India. A few of the busiest:</p>
            </div>
            <div className="cats-grid">
              <Link className="cat-pill" href="/categories"><span className="d" />Industrial packaging</Link>
              <Link className="cat-pill" href="/categories"><span className="d" />Web, mobile &amp; ERP</Link>
              <Link className="cat-pill" href="/categories"><span className="d" />Solar &amp; renewable EPC</Link>
              <Link className="cat-pill" href="/categories"><span className="d" />CNC &amp; fabrication</Link>
              <Link className="cat-pill" href="/categories"><span className="d" />GST, tax &amp; compliance</Link>
              <Link className="cat-pill" href="/categories"><span className="d" />Freight &amp; logistics</Link>
              <Link className="cat-pill" href="/categories"><span className="d" />Marketing &amp; design</Link>
              <Link className="cat-pill" href="/categories"><span className="d" />Staffing &amp; HR</Link>
            </div>
            <div className="mt-6 text-center">
              <Link href="/categories" className="btn b2" style={{ textDecoration: 'none' }}>
                Browse all 150+ categories →
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 3: SPLIT PANELS (#partners) */}
        <section className="band alt" id="partners">
          <div className="wrap max-w-[1140px] mx-auto px-6">
            <div className="split-panels">
              {/* CLIENT PANEL */}
              <div className="panel-card">
                <div className="rounded-2xl bg-white border border-[#EAE9E5] mb-5 px-4 py-3 flex items-center justify-center">
                  <img
                    src="/illustrations/post-requirement.svg"
                    alt="A buyer describing what they need"
                    className="h-[128px] w-auto select-none"
                    draggable={false}
                  />
                </div>
                <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#C8102E]">
                  Need a supplier?
                </span>
                <h3>Post free and get replies</h3>
                <ul>
                  <li>
                    <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>5 free connections to start</span>
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>Suppliers can&apos;t see your number until you unlock them</span>
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>Everything in one place — web, app or WhatsApp</span>
                  </li>
                </ul>
                <div className="mt-auto pt-4">
                  <Link href="/dashboard/client" className="btn b1" style={{ background: '#C8102E', color: '#fff', borderRadius: 12, textDecoration: 'none' }}>
                    Post a requirement
                  </Link>
                </div>
              </div>

              {/* PARTNER PANEL */}
              <div className="panel-card dark">
                <div className="rounded-2xl bg-white mb-5 px-4 py-3 flex items-center justify-center">
                  <img
                    src="/illustrations/matched-lead.svg"
                    alt="A verified supplier receiving a matched lead"
                    className="h-[128px] w-auto select-none"
                    draggable={false}
                  />
                </div>
                <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#FF9AA8]">
                  Offer a service?
                </span>
                <h3>Get leads that fit you</h3>
                <ul>
                  <li>
                    <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>Only requirements in your sector and area</span>
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>Verify your GSTIN, get the trusted badge</span>
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>Start with free lead replies, 0% commission</span>
                  </li>
                </ul>
                <div className="mt-auto pt-4">
                  <Link href="/dashboard/partner" className="btn b1" style={{ background: '#FFFFFF', color: '#15171C', borderRadius: 12, textDecoration: 'none' }}>
                    Become a partner
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: QUESTIONS (#faq) */}
        <section className="band" id="faq">
          <div className="wrap max-w-[1140px] mx-auto px-6">
            <div className="head">
              <h2>Questions</h2>
            </div>
            <div className="faq-wrap">
              <details open>
                <summary>How does matching work?</summary>
                <p>
                  You describe your need in plain words. XPO turns it into a clear requirement and alerts verified suppliers in that sector a few at a time, so you get genuine replies quickly instead of a flood.
                </p>
              </details>
              <details>
                <summary>What does it cost to post?</summary>
                <p>
                  Posting is always free, and XPO never takes a commission on your deal. You get free connections to start; plans with more are shown once you&apos;re in, so pricing only comes up when you actually need it.
                </p>
              </details>
              <details>
                <summary>When is my phone number shared?</summary>
                <p>
                  Only when you both agree. Numbers stay masked until you choose a supplier and they accept, so you&apos;re never cold-called from a public listing.
                </p>
              </details>
              <details>
                <summary>How are suppliers verified?</summary>
                <p>
                  Each supplier verifies their GSTIN, which XPO checks against the GST portal, and is rated by clients after every connection. Verified businesses are shown first.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* SECTION 5: CLOSING BANNER */}
        <section className="band alt pb-16">
          <div className="wrap max-w-[1140px] mx-auto px-6">
            <div className="closing-banner w-full">
              <h2>Post your first requirement — free.</h2>
              <p className="text-[#C2C6CD] text-lg max-w-[44ch]">
                Describe what you need. Verified suppliers across India do the rest.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/dashboard/client" className="btn b1 lg" style={{ background: '#C8102E', color: '#fff', borderRadius: 14, textDecoration: 'none' }}>
                  Post a requirement
                </Link>
                <Link
                  href="/dashboard/partner"
                  className="btn lg"
                  style={{ background: 'transparent', color: '#fff', border: '1.5px solid #4a4f57', borderRadius: 14, textDecoration: 'none' }}
                >
                  Become a partner
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
