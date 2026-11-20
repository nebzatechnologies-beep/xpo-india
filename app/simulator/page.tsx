import { redirect } from 'next/navigation';

export default async function SimulatorRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  if (resolved?.view === 'dual') {
    redirect('/whatsapp/dual');
  }
  if (resolved?.view === 'client') {
    redirect('/whatsapp/client');
  }
  if (resolved?.view === 'partner') {
    redirect('/whatsapp/partner');
  }
  redirect('/whatsapp');
}
