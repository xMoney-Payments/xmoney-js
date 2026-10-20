import type { XMoney } from './types';

/**
 * Hosted checkout script channel. This package loads `/sdk/v2/xmoney.js`.
 * A new script API ships as a new major of this package, with types that describe that script.
 */
const SDK_MAJOR_VERSION = 2;

export const DEFAULT_SCRIPT_URL = `https://secure.xmoney.com/sdk/v${SDK_MAJOR_VERSION}/xmoney.js`;

export interface LoadXMoneyOptions {
  /**
   * CSP nonce copied onto the injected script tag.
   */
  nonce?: string;
}

let state: Promise<XMoney> | null = null;

function canUseDom(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

function readXMoney(): XMoney | null {
  if (!canUseDom() || !window.XMoney) {
    return null;
  }
  return window.XMoney;
}

function scriptSelector(scriptUrl: string): string {
  const escape = globalThis.CSS?.escape;
  const escaped = escape ? escape(scriptUrl) : scriptUrl.replace(/(["\\])/g, '\\$1');
  return `script[src="${escaped}"]`;
}

const LOADED_ATTR = 'data-xmoney-loaded';

function findScript(scriptUrl: string): HTMLScriptElement | null {
  return document.querySelector<HTMLScriptElement>(scriptSelector(scriptUrl));
}

function markLoaded(script: HTMLScriptElement): void {
  script.setAttribute(LOADED_ATTR, 'true');
}

function isMarkedLoaded(script: HTMLScriptElement): boolean {
  return script.getAttribute(LOADED_ATTR) === 'true';
}

/**
 * On a finished document, a matching tag is still loading only when Resource
 * Timing shows an open fetch (`responseEnd === 0`). No entry, a missing
 * Performance API, or a finished entry means `load` and `error` will not fire again.
 */
function hostScriptStillLoading(scriptUrl: string): boolean {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByName !== 'function') {
    return false;
  }

  const entries = performance.getEntriesByName(scriptUrl);
  if (entries.length === 0) {
    return false;
  }

  return entries.some((entry) => {
    const resource = entry as PerformanceResourceTiming;
    return typeof resource.responseEnd !== 'number' || resource.responseEnd === 0;
  });
}

function hostScriptFinished(scriptUrl: string): boolean {
  if (document.readyState !== 'complete') {
    return false;
  }
  return !hostScriptStillLoading(scriptUrl);
}

function missingFactory(scriptUrl: string): Error {
  return new Error(
    `xMoney.js at ${scriptUrl} already finished loading but window.XMoney is missing.`
  );
}

function injectScript(scriptUrl: string, nonce?: string): Promise<XMoney> {
  const found = findScript(scriptUrl);
  const existing = readXMoney();

  if (existing) {
    if (found) {
      return Promise.resolve(existing);
    }
    return Promise.reject(
      new Error(
        `window.XMoney is already set from a different script. Refusing to load ${scriptUrl}.`
      )
    );
  }

  if (found && (isMarkedLoaded(found) || hostScriptFinished(scriptUrl))) {
    found.remove();
    return Promise.reject(missingFactory(scriptUrl));
  }

  return new Promise((resolve, reject) => {
    const script = found ?? document.createElement('script');
    let settled = false;

    const cleanup = () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };

    const fail = (error: Error, removeTag: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      if (removeTag) {
        script.remove();
      }
      reject(error);
    };

    const handleLoad = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      markLoaded(script);
      const xmoney = readXMoney();
      if (xmoney) {
        resolve(xmoney);
        return;
      }
      script.remove();
      reject(new Error(`xMoney.js loaded from ${scriptUrl} but window.XMoney is missing.`));
    };

    const handleError = () => {
      fail(new Error(`Failed to load xMoney.js from ${scriptUrl}.`), true);
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    if (!found) {
      script.src = scriptUrl;
      script.async = true;
      if (nonce) {
        script.nonce = nonce;
      }
      document.head.appendChild(script);
    }
  });
}

/**
 * Load `xmoney.js` once and return the `window.XMoney` factories.
 * Live vs stage is chosen by the script from each widget's `publicKey`.
 * The script is always `https://secure.xmoney.com/sdk/v2/xmoney.js`.
 * `window.XMoney` is reused only when a script tag with that URL is already on the page.
 */
export function loadXMoney(options?: LoadXMoneyOptions): Promise<XMoney> {
  if (!canUseDom()) {
    return Promise.reject(new Error('loadXMoney() can only be called in a browser.'));
  }

  if (state) {
    return state;
  }

  const promise = injectScript(DEFAULT_SCRIPT_URL, options?.nonce).catch((error: unknown) => {
    if (state === promise) {
      state = null;
    }
    throw error;
  });

  state = promise;
  return promise;
}

declare global {
  interface Window {
    XMoney?: XMoney;
  }
}
