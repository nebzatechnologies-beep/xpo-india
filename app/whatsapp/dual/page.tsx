import { Metadata } from 'next';
import { XpoWhatsAppAutomationLab } from '@/components/simulator/xpo-whatsapp-automation-lab';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'XPO India — WhatsApp Dual Studio (Client & Partner)',
  description:
    'Side-by-side WhatsApp Bot simulation and real-time orchestration between Client (Buyer) and Partner (Supplier).',
};

export default function DualWhatsAppPage() {
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
      <XpoWhatsAppAutomationLab initialViewMode="dual" />
    </main>
  );
}
