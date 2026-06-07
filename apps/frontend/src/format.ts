import type { StoreId } from '@patiently/shared';

// Display helpers. Money is integer minor units (paise) end-to-end; format only
// at the edge, India-first (₹, en-IN lakh/crore grouping).
export function formatMoney(minorUnits: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(minorUnits / 100);
}

const STORE_LABELS: Record<StoreId, string> = {
  amazon_in: 'Amazon.in',
  flipkart: 'Flipkart',
  croma: 'Croma',
  reliance_digital: 'Reliance Digital',
  tata_cliq: 'Tata CLiQ',
  myntra: 'Myntra',
};

export function storeLabel(store: StoreId): string {
  return STORE_LABELS[store] ?? store;
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function formatHorizon(iso: string): string {
  const days = daysUntil(iso);
  if (days < 0) return 'past due';
  if (days === 0) return 'due today';
  if (days < 31) return `${days} day${days === 1 ? '' : 's'} left`;
  const months = Math.round(days / 30);
  return `~${months} month${months === 1 ? '' : 's'} left`;
}
