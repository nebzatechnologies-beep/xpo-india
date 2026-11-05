import { redirect } from 'next/navigation';

export default function LegacyAdminCategoriesRedirect() {
  redirect('/superadmin/taxonomy/categories');
}
