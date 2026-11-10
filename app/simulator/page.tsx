'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { XpoClientApp } from '@/components/creator/xpo-client-app';
import { XpoPartnerApp } from '@/components/absorber/xpo-partner-app';
import { XpoWhatsAppAutomationLab } from '@/components/simulator/xpo-whatsapp-automation-lab';
import { postMarketplaceAction } from '@/lib/marketplace/sync-client';

type StudioTab = 'split' | 'whatsapp' | 'client_mobile' | 'partner_mobile';

export default function XpoSimulatorStudioPage() {
  const [tab, setTab] = useState<StudioTab>('split');
  const [resetMsg, setResetMsg] = useState<string>('');

  const handleResetAll = async () => {
    await postMarketplaceAction('reset', {});
    setResetMsg('All workspaces & WhatsApp states reset to clean baseline');
    setTimeout(() => setResetMsg(''), 3000);
  };

  return (
    <div
      className="xt"
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--tx)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ==================== STUDIO TOP HEADER ==================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#15171C',
          color: '#FFFFFF',
          borderBottom: '1px solid #2C2F36',
          padding: '12px clamp(16px, 3vw, 36px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/xpo-logo.png"
            alt="XPO India"
            style={{ height: 28, width: 'auto', filter: 'brightness(1.15)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <b style={{ fontSize: 16 }}>Mobile Application &amp; WhatsApp Automation Simulator</b>
              <span
                style={{
                  background: '#16A34A',
                  color: '#fff',
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 99,
                }}
              >
                LIVE FIRESTORE SYNC
              </span>
            </div>
            <span style={{ fontSize: 12, color: '#A9ADB6' }}>
              Test Client Mobile App, Partner Mobile App, and the 18-State WhatsApp Bot side-by-side in real time
            </span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          role="tablist"
          aria-label="Simulator Mode"
          style={{
            display: 'flex',
            gap: 6,
            background: '#22252D',
            padding: 4,
            borderRadius: 12,
            flexWrap: 'wrap',
          }}
        >
          {(
            [
              ['split', '📱+📱+💬 Complete Ecosystem (Side-by-Side)'],
              ['whatsapp', '💬 WhatsApp Automation Lab'],
              ['client_mobile', '📱 Client Mobile App'],
              ['partner_mobile', '📱 Partner Mobile App'],
            ] as const
          ).map(([id, label]) => {
            const on = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(id)}
                style={{
                  minHeight: 34,
                  padding: '0 12px',
                  borderRadius: 9,
                  border: 0,
                  background: on ? '#C8102E' : 'transparent',
                  color: on ? '#FFFFFF' : '#C9CBD1',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Workspace Quick Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleResetAll}
            style={{
              minHeight: 34,
              padding: '0 12px',
              borderRadius: 9,
              border: '1px solid #3D414C',
              background: '#252830',
              color: '#F3F4F6',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ↺ Reset Demo State
          </button>
          <Link
            href="/dashboard/client"
            style={{
              minHeight: 34,
              padding: '0 12px',
              borderRadius: 9,
              border: '1px solid #3D414C',
              background: '#252830',
              color: '#9FC1FF',
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            Client Web →
          </Link>
          <Link
            href="/dashboard/partner"
            style={{
              minHeight: 34,
              padding: '0 12px',
              borderRadius: 9,
              border: '1px solid #3D414C',
              background: '#252830',
              color: '#9FC1FF',
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            Partner Web →
          </Link>
          <Link
            href="/superadmin"
            style={{
              minHeight: 34,
              padding: '0 12px',
              borderRadius: 9,
              border: '1px solid #3D414C',
              background: '#252830',
              color: '#9FC1FF',
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            Superadmin →
          </Link>
        </div>
      </header>

      {resetMsg && (
        <div
          style={{
            background: '#14532D',
            color: '#fff',
            padding: '8px 16px',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ✓ {resetMsg}
        </div>
      )}

      {/* ==================== MAIN STUDIO CANVAS ==================== */}
      <main
        style={{
          maxWidth: 1480,
          width: '100%',
          margin: '0 auto',
          padding: '24px clamp(16px, 3vw, 36px) 64px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* TAB 1: SPLIT-SCREEN COMPLETE ECOSYSTEM (CLIENT MOBILE + PARTNER MOBILE + WHATSAPP AUTOMATION) */}
        {tab === 'split' && (
          <>
            {/* Section A: Interactive WhatsApp Automation & 5-Min Wave Engine */}
            <XpoWhatsAppAutomationLab
              onOpenMobileSimulator={(role) =>
                setTab(role === 'client' ? 'client_mobile' : 'partner_mobile')
              }
            />

            {/* Section B: Side-by-Side Client Mobile App & Partner Mobile App */}
            <section
              className="card"
              style={{
                padding: '22px 24px',
                background: 'var(--sf)',
                border: '1px solid var(--ln)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="chip" style={{ background: 'var(--rbg)', color: 'var(--rtx)' }}>
                      Side-by-Side Mobile Applications (390×844)
                    </span>
                    <span className="chip" style={{ background: 'var(--gbg)', color: 'var(--gtx)' }}>
                      Real-Time Synced
                    </span>
                  </div>
                  <h2 style={{ margin: '6px 0 2px', fontSize: 21, fontWeight: 800 }}>
                    Client Mobile App &amp; Partner Mobile App — Live Side-by-Side
                  </h2>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--tx2)' }}>
                    Post a requirement on the left phone (Client Mobile) or in the WhatsApp simulator above, then reply with a quote and accept the connection on the right phone (Partner Mobile).
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(412px, 1fr))',
                  gap: 28,
                  justifyItems: 'center',
                  alignItems: 'start',
                }}
              >
                {/* Left Phone: Client Mobile App */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px',
                      borderRadius: 99,
                      background: 'var(--sf2)',
                      border: '1px solid var(--ln)',
                    }}
                  >
                    <span style={{ width: 9, height: 9, borderRadius: 99, background: '#C8102E' }} />
                    <b style={{ fontSize: 13.5 }}>Client Mobile App (Pavan · Test Traders)</b>
                  </div>
                  <XpoClientApp forceMobileSim hideSimToolbar />
                </div>

                {/* Right Phone: Partner Mobile App */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px',
                      borderRadius: 99,
                      background: 'var(--sf2)',
                      border: '1px solid var(--ln)',
                    }}
                  >
                    <span style={{ width: 9, height: 9, borderRadius: 99, background: '#1E3A8A' }} />
                    <b style={{ fontSize: 13.5 }}>Partner Mobile App (Rohan · Klo Tech)</b>
                  </div>
                  <XpoPartnerApp forceMobileSim hideSimToolbar />
                </div>
              </div>
            </section>
          </>
        )}

        {/* TAB 2: WHATSAPP AUTOMATION LAB */}
        {tab === 'whatsapp' && (
          <XpoWhatsAppAutomationLab
            onOpenMobileSimulator={(role) =>
              setTab(role === 'client' ? 'client_mobile' : 'partner_mobile')
            }
          />
        )}

        {/* TAB 3: CLIENT MOBILE APP SIMULATOR */}
        {tab === 'client_mobile' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'center', maxWidth: 620 }}>
              <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>
                XPO Client Mobile Application (iOS / Android 390×844)
              </h1>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--tx2)' }}>
                Use the bottom tab bar (Home · Requests · + Post · Connected · Alerts) and mobile bottom sheets. All actions sync live with the Partner App and Superadmin Console.
              </p>
            </div>
            <XpoClientApp forceMobileSim hideSimToolbar />
          </div>
        )}

        {/* TAB 4: PARTNER MOBILE APP SIMULATOR */}
        {tab === 'partner_mobile' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'center', maxWidth: 620 }}>
              <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>
                XPO Partner Mobile Application (iOS / Android 390×844)
              </h1>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--tx2)' }}>
                Review 5-minute Wave 1 matched leads, send quotes with 1 reply credit, and accept client connection requests to reveal direct phone numbers.
              </p>
            </div>
            <XpoPartnerApp forceMobileSim hideSimToolbar />
          </div>
        )}
      </main>
    </div>
  );
}
