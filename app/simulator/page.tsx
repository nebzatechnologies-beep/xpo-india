import { Metadata } from 'next';
import Link from 'next/link';
import { XpoWhatsAppAutomationLab } from '@/components/simulator/xpo-whatsapp-automation-lab';

export const metadata: Metadata = {
  title: 'XPO India — WhatsApp Bot & Marketplace Simulator Hub',
  description: 'Interactive WhatsApp bot simulators and state machine programming for Clients (Buyers) and Partners (Suppliers).',
};

export default async function SimulatorHubPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const isDual = resolvedParams?.view === 'dual';

  if (isDual) {
    return (
      <main style={{ minHeight: '100vh', background: '#0B0D11', padding: '16px' }}>
        <XpoWhatsAppAutomationLab initialViewMode="dual" />
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0B0D11',
        color: '#E6E7EA',
        padding: '36px 20px 80px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/xpo-logo.png" alt="XPO India" style={{ height: 26, width: 'auto' }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                background: '#1F242D',
                padding: '3px 9px',
                borderRadius: 99,
                color: '#9CA3AF',
              }}
            >
              Automation Lab
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/dashboard/partner"
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: '#161920',
                border: '1px solid #2B303C',
                color: '#E6E7EA',
                fontSize: 12.5,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              ← Partner Workspace
            </Link>
            <Link
              href="/dashboard/client"
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: '#161920',
                border: '1px solid #2B303C',
                color: '#E6E7EA',
                fontSize: 12.5,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              ← Client Workspace
            </Link>
          </div>
        </div>

        {/* Hero Banner */}
        <div
          style={{
            padding: '28px 24px',
            borderRadius: 18,
            background: 'linear-gradient(135deg, #151821 0%, #1A1F2C 100%)',
            border: '1px solid #2A303F',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 800, color: '#C8102E', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Meta Cloud API &amp; 18-State Engine Simulator
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            XPO WhatsApp Automation &amp; State Machine Simulators
          </h1>
          <p style={{ fontSize: 14.5, color: '#9CA3AF', margin: 0, maxWidth: 740, lineHeight: 1.5 }}>
            Test the complete end-to-end B2B matching experience from either the Supplier (Partner) or Buyer (Client) perspective. Program bot states directly, inspect live Meta webhooks, simulate 5-minute wave timers, and test mutual contact unlocks.
          </p>
        </div>

        {/* Simulator Selection Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {/* CARD 1: PARTNER BOT SIMULATOR */}
          <div
            style={{
              padding: '24px',
              borderRadius: 18,
              background: '#13161F',
              border: '1.5px solid #1E3A8A',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: '#1E3A8A',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}
                >
                  Supplier Flow
                </span>
                <span style={{ fontSize: 24 }}>🏭</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                Partner Bot Simulator &amp; State Programmer
              </h2>
              <p style={{ fontSize: 13.5, color: '#9CA3AF', margin: 0, lineHeight: 1.45 }}>
                Test the WhatsApp bot experience for verified sellers &amp; service providers:
              </p>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13, color: '#D1D5DB', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Receive 5-minute Wave 1 lead alerts with match score</li>
                <li>Submit structured quotes &amp; delivery commitments</li>
                <li>Simulate 5-minute timer countdown &amp; timeout escalation</li>
                <li>Approve mutual contact unlock requests from clients</li>
                <li>Programmatically trigger any partner state (18 states)</li>
              </ul>
            </div>

            <Link
              href="/simulator/partner"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 18px',
                borderRadius: 10,
                background: '#1E3A8A',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Open Partner Bot Simulator →
            </Link>
          </div>

          {/* CARD 2: CLIENT BOT SIMULATOR */}
          <div
            style={{
              padding: '24px',
              borderRadius: 18,
              background: '#13161F',
              border: '1.5px solid #14532D',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: '#14532D',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}
                >
                  Buyer Flow
                </span>
                <span style={{ fontSize: 24 }}>🛍️</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                Client Bot Simulator &amp; State Programmer
              </h2>
              <p style={{ fontSize: 13.5, color: '#9CA3AF', margin: 0, lineHeight: 1.45 }}>
                Test the WhatsApp bot experience for businesses posting requirements:
              </p>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13, color: '#D1D5DB', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Natural language requirement intake (English, Hindi, Hinglish)</li>
                <li>AI extraction of Sector, Category, Location, Specs &amp; Budget</li>
                <li>Draft review card &amp; Wave 1 dispatch to 3 matched suppliers</li>
                <li>Receive partner quote notifications on WhatsApp</li>
                <li>Unlock partner contact using 1 free view &amp; direct chat</li>
              </ul>
            </div>

            <Link
              href="/simulator/client"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 18px',
                borderRadius: 10,
                background: '#14532D',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Open Client Bot Simulator →
            </Link>
          </div>
        </div>

        {/* BOTTOM CARD: DUAL STUDIO OPTION */}
        <div
          style={{
            padding: '18px 22px',
            borderRadius: 14,
            background: '#13161F',
            border: '1px solid #2B303C',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div>
            <b style={{ fontSize: 15 }}>🖥️ Full Studio: View Both WhatsApp Phones Side-by-Side</b>
            <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 2 }}>
              Inspect live cross-talk between Client and Partner in real-time split-screen view.
            </div>
          </div>
          <Link
            href="/simulator?view=dual"
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              background: '#2B303C',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Launch Dual Phone Studio →
          </Link>
        </div>
      </div>
    </main>
  );
}
