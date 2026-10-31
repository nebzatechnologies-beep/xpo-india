import { redirect } from 'next/navigation';

export default function LegacyAbsorberCatchAllRedirect() {
  redirect('/dashboard/partner');
}
