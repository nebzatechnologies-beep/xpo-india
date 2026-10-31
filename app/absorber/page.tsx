import { redirect } from 'next/navigation';

export default function LegacyAbsorberRedirect() {
  redirect('/dashboard/partner');
}
