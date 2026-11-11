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
              <span className="text-[12.5px] font-extrabold tracking-[0.11em] uppercase text-[#C8102E] block mb-4">
                B2B sourcing, without the middleman
              </span>
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

              <p className="mt-3.5 text-[13.5px] text-[#8A8F98]">
                Free to post · No commission · Your number stays private until you both agree
              </p>
            </div>

            {/* RIGHT COLUMN: INTERACTIVE CORE MODEL ILLUSTRATION */}
            <div className="flex flex-col items-center">
              <svg
                className="illo"
                viewBox="0 0 460 522"
                role="img"
                aria-label="How XPO works: you post a requirement, XPO matches it to GST-verified suppliers who reply with quotes, and you connect directly with no commission"
              >
                {/* 1 · your requirement */}
                <rect x="34" y="14" width="392" height="98" rx="16" className="il-sf" />
                <rect x="34" y="14" width="392" height="98" rx="16" className="il-stroke" strokeWidth="2" />
                <circle cx="66" cy="48" r="17" className="il-ink" />
                <text x="66" y="53" textAnchor="middle" className="il-white" style={{ font: "800 13px var(--font-jakarta), sans-serif" }}>P</text>
                <text x="94" y="43" className="il-ink" style={{ font: "700 13.5px var(--font-jakarta), sans-serif" }}>You · Test Traders</text>
                <text x="94" y="61" className="il-mut" style={{ font: "600 12px var(--font-jakarta), sans-serif" }}>&ldquo;Need 10,000 corrugated boxes, Pune&rdquo;</text>
                <rect x="94" y="74" width="42" height="18" rx="9" className="il-sf2" />
                <text x="115" y="87" textAnchor="middle" className="il-mut" style={{ font: "700 10px var(--font-jakarta), sans-serif" }}>Web</text>
                <rect x="142" y="74" width="42" height="18" rx="9" className="il-sf2" />
                <text x="163" y="87" textAnchor="middle" className="il-mut" style={{ font: "700 10px var(--font-jakarta), sans-serif" }}>App</text>
                <rect x="190" y="74" width="74" height="18" rx="9" className="il-sf2" />
                <text x="227" y="87" textAnchor="middle" className="il-mut" style={{ font: "700 10px var(--font-jakarta), sans-serif" }}>WhatsApp</text>
                <text x="414" y="33" textAnchor="end" className="il-mut" style={{ font: "700 10px var(--font-jakarta), sans-serif" }}>post from anywhere</text>

                {/* flow into engine */}
                <path className="flow" d="M230 112 V150" />

                {/* 2 · XPO matches */}
                <circle cx="230" cy="188" r="47" fill="#C8102E" opacity="0.10" />
                <rect x="200" y="158" width="60" height="60" rx="17" className="il-red" />
                <g fill="#fff">
                  <circle cx="230" cy="188" r="3.6" />
                  <circle cx="216" cy="176" r="2.8" />
                  <circle cx="244" cy="176" r="2.8" />
                  <circle cx="230" cy="205" r="2.8" />
                </g>
                <path d="M230 188 L216 176 M230 188 L244 176 M230 188 L230 205" stroke="#fff" strokeWidth="2" fill="none" />
                <text x="230" y="244" textAnchor="middle" className="il-ink" style={{ font: "800 14px var(--font-jakarta), sans-serif" }}>XPO matches it — in minutes</text>
                <text x="230" y="262" textAnchor="middle" className="il-mut" style={{ font: "600 12px var(--font-jakarta), sans-serif" }}>to verified suppliers in your sector</text>

                {/* fan to suppliers */}
                <path className="flow" d="M230 274 V290" />
                <path d="M86 290 H374" className="il-stroke" strokeWidth="2" />
                <path className="flow" d="M86 290 V314" />
                <path className="flow" d="M230 290 V314" />
                <path className="flow" d="M374 290 V314" />

                {/* 3 · supplier replies */}
                {/* card 1 */}
                <rect x="22" y="314" width="128" height="150" rx="14" className="il-sf" />
                <rect x="22" y="314" width="128" height="150" rx="14" className="il-stroke" strokeWidth="2" />
                <circle cx="44" cy="340" r="10" className="il-g" />
                <path d="M40 340l3 3 6-7" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <text x="60" y="344" className="il-glab">Verified</text>
                <text x="38" y="374" className="il-ink" style={{ font: "700 13px var(--font-jakarta), sans-serif" }}>BoxCraft</text>
                <text x="38" y="391" className="il-mut" style={{ font: "600 11px var(--font-jakarta), sans-serif" }}>Ahmedabad</text>
                <rect x="38" y="408" width="96" height="30" rx="9" className="il-sf2" />
                <text x="86" y="427" textAnchor="middle" className="il-mut" style={{ font: "700 11.5px var(--font-jakarta), sans-serif" }}>Quoted ₹1.2L</text>

                {/* card 2 (interested) */}
                <rect x="166" y="310" width="128" height="156" rx="14" className="il-sf" />
                <rect x="166" y="310" width="128" height="156" rx="14" className="il-redl" strokeWidth="2.5" />
                <circle cx="188" cy="338" r="10" className="il-g" />
                <path d="M184 338l3 3 6-7" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <text x="204" y="342" className="il-glab">Verified</text>
                <text x="182" y="372" className="il-ink" style={{ font: "700 13px var(--font-jakarta), sans-serif" }}>Ankur Pkg</text>
                <text x="182" y="389" className="il-mut" style={{ font: "600 11px var(--font-jakarta), sans-serif" }}>Rajkot</text>
                <rect x="182" y="406" width="96" height="30" rx="9" className="il-red" />
                <text x="230" y="425" textAnchor="middle" className="il-white" style={{ font: "800 11.5px var(--font-jakarta), sans-serif" }}>Interested</text>
                <text x="230" y="453" textAnchor="middle" className="il-mut" style={{ font: "700 10px var(--font-jakarta), sans-serif" }}>best fit · 96%</text>

                {/* card 3 */}
                <rect x="310" y="314" width="128" height="150" rx="14" className="il-sf" />
                <rect x="310" y="314" width="128" height="150" rx="14" className="il-stroke" strokeWidth="2" />
                <circle cx="332" cy="340" r="10" className="il-g" />
                <path d="M328 340l3 3 6-7" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <text x="348" y="344" className="il-glab">Verified</text>
                <text x="326" y="374" className="il-ink" style={{ font: "700 13px var(--font-jakarta), sans-serif" }}>PrintPro</text>
                <text x="326" y="391" className="il-mut" style={{ font: "600 11px var(--font-jakarta), sans-serif" }}>Pune</text>
                <rect x="326" y="408" width="96" height="30" rx="9" className="il-sf2" />
                <text x="374" y="427" textAnchor="middle" className="il-mut" style={{ font: "700 11.5px var(--font-jakarta), sans-serif" }}>Quoted ₹1.3L</text>

                {/* caption */}
                <text x="230" y="502" textAnchor="middle" className="il-mut" style={{ font: "700 12px var(--font-jakarta), sans-serif" }}>You pick · connect directly · 0% commission</text>
              </svg>
              <p className="il-cap">
                Post a need → XPO matches it to GST-verified suppliers → they reply → you connect, commission-free.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 1: HOW IT WORKS (#how) */}
        <section className="band alt" id="how">
          <div className="wrap max-w-[1140px] mx-auto px-6">
            <div className="head">
              <h2>Three steps. No forms, no phone tag.</h2>
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
