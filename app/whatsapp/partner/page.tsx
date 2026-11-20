import { Metadata } from 'next';
import { XpoWhatsAppAutomationLab } from '@/components/simulator/xpo-whatsapp-automation-lab';

export const metadata: Metadata = {
  title: 'XPO India — Partner WhatsApp Bot Simulator & State Programmer',
  description:
    'End-to-end WhatsApp bot testing, 5-minute wave delivery, quote submission, and state machine programming for XPO Partners (Suppliers).',
};

export default function PartnerWhatsAppPage() {
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
      <XpoWhatsAppAutomationLab forcedRole="partner" initialViewMode="partner" />
    </main>
  );
}
