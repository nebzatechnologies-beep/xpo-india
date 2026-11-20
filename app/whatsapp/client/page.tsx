import { Metadata } from 'next';
import { XpoWhatsAppAutomationLab } from '@/components/simulator/xpo-whatsapp-automation-lab';

export const metadata: Metadata = {
  title: 'XPO India — Client WhatsApp Bot Simulator & State Programmer',
  description:
    'End-to-end WhatsApp bot testing, requirement intake, AI specs qualification, partner quote reviews, and state machine programming for XPO Clients (Buyers).',
};

export default function ClientWhatsAppPage() {
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
