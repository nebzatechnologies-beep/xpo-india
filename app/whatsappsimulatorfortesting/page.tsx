import { Metadata } from 'next';
import { XpoWhatsAppAutomationLab } from '@/components/simulator/xpo-whatsapp-automation-lab';

export const metadata: Metadata = {
  title: 'XPO India — WhatsApp Testing Simulator',
  description:
    'Private end-to-end WhatsApp bot testing portal for XPO — client and partner intake, AI specs qualification, wave dispatch, quotes, connections, and 18-state programming.',
  robots: { index: false, follow: false },
};

// Private testing portal — not linked from the main app. Access by URL only.
export default function WhatsAppSimulatorForTestingPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0B0D11',
        padding: '16px 12px',
        maxWidth: '100vw',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <XpoWhatsAppAutomationLab forcedRole="client" initialViewMode="client" />
    </main>
  );
}
