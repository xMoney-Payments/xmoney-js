import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { XMoney } from '../src/types';

const factories = {
  paymentForm: vi.fn(),
  paymentCard: vi.fn(),
  googlePay: vi.fn(),
  applePay: vi.fn(),
  savedCardPayment: vi.fn(),
  getPaymentMethodCapabilities: vi.fn(),
} as unknown as XMoney;

async function loadModule() {
  return import('../src/load-xmoney');
}

function setReadyState(state: DocumentReadyState) {
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    get: () => state,
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  delete window.XMoney;
  if (typeof CSS === 'undefined') {
    vi.stubGlobal('CSS', {
      escape(value: string) {
        return value.replace(/(["\\])/g, '\\$1');
      },
    });
  }
});

describe('loadXMoney', () => {
  it('injects the v2 script once and reuses the same promise', async () => {
    const { loadXMoney, DEFAULT_SCRIPT_URL } = await loadModule();

    const first = loadXMoney();
    const second = loadXMoney();

    expect(first).toBe(second);
    const scripts = document.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.getAttribute('src')).toBe(DEFAULT_SCRIPT_URL);
    expect(DEFAULT_SCRIPT_URL).toBe('https://secure.xmoney.com/sdk/v2/xmoney.js');

    window.XMoney = factories;
    scripts[0]?.dispatchEvent(new Event('load'));

    await expect(first).resolves.toBe(factories);
    await expect(loadXMoney()).resolves.toBe(factories);
    expect(document.querySelectorAll('script')).toHaveLength(1);
  });

  it('returns window.XMoney when a matching script tag is already on the page', async () => {
    const { loadXMoney, DEFAULT_SCRIPT_URL } = await loadModule();
    const script = document.createElement('script');
    script.src = DEFAULT_SCRIPT_URL;
    document.head.appendChild(script);
    window.XMoney = factories;

    await expect(loadXMoney()).resolves.toBe(factories);
    expect(document.querySelectorAll('script')).toHaveLength(1);
  });

  it('rejects window.XMoney that was not loaded from the requested script', async () => {
    window.XMoney = factories;
    const { loadXMoney } = await loadModule();

    await expect(loadXMoney()).rejects.toThrow(/already set from a different script/);
    expect(document.querySelectorAll('script')).toHaveLength(0);
  });

  it('removes a failed script so the next call can load again', async () => {
    const { loadXMoney, DEFAULT_SCRIPT_URL } = await loadModule();

    const first = loadXMoney();
    document.querySelector('script')?.dispatchEvent(new Event('error'));
    await expect(first).rejects.toThrow(/Failed to load/);
    expect(document.querySelectorAll('script')).toHaveLength(0);

    const second = loadXMoney();
    const script = document.querySelector('script');
    expect(script?.getAttribute('src')).toBe(DEFAULT_SCRIPT_URL);
    window.XMoney = factories;
    script?.dispatchEvent(new Event('load'));
    await expect(second).resolves.toBe(factories);
  });

  it('rejects a host script that finished before the loader ran', async () => {
    const { loadXMoney, DEFAULT_SCRIPT_URL } = await loadModule();
    setReadyState('complete');
    const script = document.createElement('script');
    script.src = DEFAULT_SCRIPT_URL;
    document.head.appendChild(script);
    vi.spyOn(performance, 'getEntriesByName').mockReturnValue([
      { name: DEFAULT_SCRIPT_URL, responseEnd: 12 } as PerformanceResourceTiming,
    ]);

    await expect(loadXMoney()).rejects.toThrow(/already finished loading/);
    expect(document.querySelectorAll('script')).toHaveLength(0);
  });

  it('rejects a script marked loaded that did not set window.XMoney', async () => {
    const { loadXMoney, DEFAULT_SCRIPT_URL } = await loadModule();
    const script = document.createElement('script');
    script.src = DEFAULT_SCRIPT_URL;
    script.setAttribute('data-xmoney-loaded', 'true');
    document.head.appendChild(script);

    await expect(loadXMoney()).rejects.toThrow(/already finished loading/);
    expect(document.querySelectorAll('script')).toHaveLength(0);
  });

  it('rejects a finished host script when Resource Timing has no entry', async () => {
    const { loadXMoney, DEFAULT_SCRIPT_URL } = await loadModule();
    setReadyState('complete');
    const script = document.createElement('script');
    script.src = DEFAULT_SCRIPT_URL;
    document.head.appendChild(script);
    vi.spyOn(performance, 'getEntriesByName').mockReturnValue([]);

    await expect(loadXMoney()).rejects.toThrow(/already finished loading/);
    expect(document.querySelectorAll('script')).toHaveLength(0);

    const retry = loadXMoney();
    const injected = document.querySelector('script');
    expect(injected?.getAttribute('src')).toBe(DEFAULT_SCRIPT_URL);
    window.XMoney = factories;
    injected?.dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBe(factories);
  });

  it('waits for a host script whose fetch is still open', async () => {
    const { loadXMoney, DEFAULT_SCRIPT_URL } = await loadModule();
    setReadyState('complete');
    const script = document.createElement('script');
    script.src = DEFAULT_SCRIPT_URL;
    document.head.appendChild(script);
    vi.spyOn(performance, 'getEntriesByName').mockReturnValue([
      { name: DEFAULT_SCRIPT_URL, responseEnd: 0 } as PerformanceResourceTiming,
    ]);

    const pending = loadXMoney();
    expect(document.querySelectorAll('script')).toHaveLength(1);

    window.XMoney = factories;
    script.dispatchEvent(new Event('load'));
    await expect(pending).resolves.toBe(factories);
  });

  it('waits for a host script that is still loading', async () => {
    const { loadXMoney, DEFAULT_SCRIPT_URL } = await loadModule();
    setReadyState('loading');
    const script = document.createElement('script');
    script.src = DEFAULT_SCRIPT_URL;
    document.head.appendChild(script);

    const pending = loadXMoney();
    expect(document.querySelectorAll('script')).toHaveLength(1);

    window.XMoney = factories;
    script.dispatchEvent(new Event('load'));
    await expect(pending).resolves.toBe(factories);
    expect(script.getAttribute('data-xmoney-loaded')).toBe('true');
  });

  it('copies a CSP nonce onto the injected script', async () => {
    const { loadXMoney } = await loadModule();
    const pending = loadXMoney({ nonce: 'checkout-nonce' });

    expect(document.querySelector('script')?.nonce).toBe('checkout-nonce');
    window.XMoney = factories;
    document.querySelector('script')?.dispatchEvent(new Event('load'));
    await pending;
  });
});
