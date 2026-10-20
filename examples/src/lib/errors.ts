import type { XMoneyError } from '@xmoney/xmoney-js';

export function errorText(error: XMoneyError | unknown): string {
  if (typeof error === 'string' && error) return error;
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return 'Something went wrong';
}
