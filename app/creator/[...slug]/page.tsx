import { redirect } from 'next/navigation';

export default function LegacyCreatorCatchAllRedirect() {
  redirect('/dashboard/client');
}
