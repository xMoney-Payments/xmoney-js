import { currency } from './config';

export function formatMoney(amountMinor: number, code = currency()): string {
  const hasCents = amountMinor % 100 !== 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(hasCents ? 2 : 0)} ${code}`;
  }
}

/** Transaction amounts from the SDK are major units (19.99), not cents. */
export function formatMajor(amount: number, code: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
    }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}
