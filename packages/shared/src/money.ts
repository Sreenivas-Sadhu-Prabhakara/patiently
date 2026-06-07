/**
 * Money helpers. We store money as integer minor units ("paise" for INR,
 * "cents" generally) everywhere to avoid floating-point errors, and only format
 * to a decimal string at the edges. Defaults are India-first (INR, en-IN), which
 * gives the ₹ symbol and lakh/crore digit grouping.
 */

export function formatMoney(minorUnits: number, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minorUnits / 100);
}

/** Parse a user-entered decimal amount (e.g. "1299.00") into integer minor units. */
export function toCents(amount: number | string): number {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value)) throw new Error(`Invalid money amount: ${amount}`);
  return Math.round(value * 100);
}

export function fromCents(minorUnits: number): number {
  return minorUnits / 100;
}
