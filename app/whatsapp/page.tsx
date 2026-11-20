import { Metadata } from 'next';
import Link from 'next/link';
import { XpoWhatsAppAutomationLab } from '@/components/simulator/xpo-whatsapp-automation-lab';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'XPO India — WhatsApp Bot Automation Suite & State Programmer',
  description:
    'Dedicated WhatsApp Bot simulation and state programming for XPO Buyers and Suppliers. One-shot natural language parsing, 5-minute wave delivery, and mutual handshakes.',
};

export default async function WhatsAppSimulatorHubPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const view = resolvedParams?.view;

  if (view === 'dual') {
    return (
      <main style={{ minHeight: '100vh', background: '#0B0D11', padding: '16px' }}>
        <XpoWhatsAppAutomationLab initialViewMode="dual" />
      </main>
    );
  }

  if (view === 'client') {
    return (
      <main style={{ minHeight: '100vh', background: '#0B0D11', padding: '16px 12px' }}>
        <XpoWhatsAppAutomationLab forcedRole="client" initialViewMode="client" />
      </main>
    );
  }

  if (view === 'partner') {
    return (
      <main style={{ minHeight: '100vh', background: '#0B0D11', padding: '16px 12px' }}>
        <XpoWhatsAppAutomationLab forcedRole="partner" initialViewMode="partner" />
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
                color: '#25D366',
              }}
            >
              WhatsApp Automation Lab
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/"
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
              ← Back to XPO Home
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#25D366', fontSize: 13, fontWeight: 700 }}>
            <span>● Meta WhatsApp Cloud API · Live 18-State Conversation Engine</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            XPO WhatsApp Bot Simulator &amp; State Programmer
          </h1>
          <p style={{ margin: 0, color: '#9CA3AF', fontSize: 14.5, lineHeight: 1.6, maxWidth: '75ch' }}>
            Standalone simulator environment for testing conversational B2B flows: natural language requirement intake,
            AI specs qualification, 5-minute Wave 1 partner alerts, quote submissions, and mutual contact reveals.
          </p>
        </div>

        {/* Direct Navigation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 18 }}>
          {/* Card 1: Partner Bot Simulator */}
          <div
            style={{
              padding: '24px 20px',
              borderRadius: 16,
              background: '#12151C',
              border: '1px solid #262B37',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(37, 211, 102, 0.15)',
                  color: '#25D366',
                }}
              >
                Supplier Flow
              </span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>18 States</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Partner WhatsApp Bot
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF', lineHeight: 1.5, flex: 1 }}>
              Simulates verified partner alerts: 5-minute Wave 1 lead dispatches, quote submissions, 1 reply credit usage, and mutual contact consent.
            </p>
            <Link
              href="/whatsapp/partner"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                borderRadius: 10,
                background: '#25D366',
                color: '#0B0D11',
                fontWeight: 700,
                fontSize: 13.5,
                textDecoration: 'none',
              }}
            >
              Open Partner Simulator →
            </Link>
          </div>

          {/* Card 2: Client Bot Simulator */}
          <div
            style={{
              padding: '24px 20px',
              borderRadius: 16,
              background: '#12151C',
              border: '1px solid #262B37',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(200, 16, 46, 0.15)',
                  color: '#FF6B7D',
                }}
              >
                Buyer Flow
              </span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>One-Shot AI</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Client WhatsApp Bot
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF', lineHeight: 1.5, flex: 1 }}>
              Simulates buyer requirement intake: natural language voice/text input, AI taxonomy tagging, Wave 1 dispatch, partner replies, and 1 view unlock.
            </p>
            <Link
              href="/whatsapp/client"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                borderRadius: 10,
                background: '#C8102E',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 13.5,
                textDecoration: 'none',
              }}
            >
              Open Client Simulator →
            </Link>
          </div>

          {/* Card 3: Dual Studio */}
          <div
            style={{
              padding: '24px 20px',
              borderRadius: 16,
              background: '#12151C',
              border: '1px solid #262B37',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60A5FA',
                }}
              >
                Side-by-Side
              </span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Dual Phone</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Dual Studio Orchestration
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF', lineHeight: 1.5, flex: 1 }}>
              Side-by-side Buyer &amp; Supplier WhatsApp phones with real-time bidirectional Meta webhook logs and synchronous state transitions.
            </p>
            <Link
              href="/whatsapp/dual"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                borderRadius: 10,
                background: '#1E2533',
                border: '1px solid #3B82F6',
                color: '#93C5FD',
                fontWeight: 700,
                fontSize: 13.5,
                textDecoration: 'none',
              }}
            >
              Open Dual Studio →
            </Link>
          </div>
        </div>

        {/* Embedded Full Lab View */}
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#FFFFFF' }}>
              Live Dual Studio
            </h3>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>
              Test synchronous buyer-supplier messaging below or open a dedicated role simulator above.
            </span>
          </div>
          <XpoWhatsAppAutomationLab initialViewMode="dual" />
        </div>
      </div>
    </main>
  );
}
