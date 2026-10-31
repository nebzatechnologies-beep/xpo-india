import { redirect } from 'next/navigation';

export default function LegacyCreatorRedirect() {
  redirect('/dashboard/client');
}
