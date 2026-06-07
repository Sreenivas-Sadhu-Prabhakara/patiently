import { describe, expect, it } from 'vitest';
import { formatMoney, fromCents, toCents } from './money.js';

describe('money', () => {
  it('parses decimals into integer cents without float drift', () => {
    expect(toCents('129.99')).toBe(12999);
    expect(toCents(0.1 + 0.2)).toBe(30); // 0.30000000000000004 → 30 cents
  });

  it('round-trips cents', () => {
    expect(fromCents(12999)).toBeCloseTo(129.99, 5);
  });

  it('formats minor units as INR currency (₹, lakh grouping)', () => {
    expect(formatMoney(12999, 'INR')).toBe('₹129.99');
    // 15,00,000.00 paise = ₹15,000.00 — note Indian digit grouping.
    expect(formatMoney(150000000, 'INR')).toBe('₹15,00,000.00');
  });

  it('throws on invalid input', () => {
    expect(() => toCents('abc')).toThrow();
  });
});
