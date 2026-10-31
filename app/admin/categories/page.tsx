import { redirect } from 'next/navigation';

export default function LegacyAdminCategoriesRedirect() {
  redirect('/admin/taxonomy/categories');
}
