/** Default demo order: €19.99 (or `VITE_CURRENCY`). */
export const SAMPLE_AMOUNT_MINOR = 1999;
export const AMOUNT_STEP_MINOR = 500;
export const AMOUNT_MIN_MINOR = 500;
export const SAMPLE_DESCRIPTION = 'Sample order';

export function publicKey(): string {
  return import.meta.env.VITE_PUBLIC_KEY?.trim() ?? '';
}

export function currency(): string {
  return (import.meta.env.VITE_CURRENCY || 'EUR').trim().toUpperCase() || 'EUR';
}

/**
 * Missing or placeholder secrets. The demo cannot create an order until both
 * values are real.
 */
export function secretsError(): string | null {
  const key = publicKey();
  if (!key || /replace|xxxxx/i.test(key)) {
    return 'Set VITE_PUBLIC_KEY in examples/.env';
  }
  const api = import.meta.env.VITE_API_KEY?.trim() ?? '';
  if (!api || /your_api_key/i.test(api)) {
    return 'Set VITE_API_KEY in examples/.env';
  }
  return null;
}
