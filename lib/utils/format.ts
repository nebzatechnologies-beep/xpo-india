import { format, formatDistanceToNow } from 'date-fns';

export function formatCurrency(amount: number, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}
export function formatDate(date: Date | string, fmt = 'dd MMM yyyy'): string {
  return format(new Date(date), fmt);
}
export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
export function truncate(str: string, length = 80): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}
export function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}
export function formatBudget(lead: { budgetType: string; budgetMin?: number; budgetMax?: number; currency: string }): string {
  const { budgetType, budgetMin, budgetMax, currency } = lead;
  if (budgetType === 'quote_required') return 'Quote Required';
  if (budgetType === 'negotiable') return 'Negotiable';
  if (budgetType === 'range' && budgetMin && budgetMax)
    return `${formatCurrency(budgetMin, currency)} - ${formatCurrency(budgetMax, currency)}`;
  if (budgetMin) return formatCurrency(budgetMin, currency);
  return 'To be discussed';
}
