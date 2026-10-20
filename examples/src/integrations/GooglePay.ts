import { loadXMoney, type GooglePayInstance, type TransactionDetails } from '@xmoney/xmoney-js';
import { googleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { releaseWidget } from '../lib/release-widget';
import { getTheme, subscribeTheme } from '../theme';

export function mountGooglePay(
  host: HTMLElement,
  props: {
    order: DemoOrder;
    onReady?: () => void;
    onUnavailable?: () => void;
    onComplete: (transaction: TransactionDetails) => void;
    onError: (message: string) => void;
  },
): () => void {
  let generation = 0;
  let google: GooglePayInstance | null = null;

  async function load(gen: number) {
    try {
      const xmoney = await loadXMoney();
      const caps = await xmoney.getPaymentMethodCapabilities();
      if (gen !== generation) return;
      if (!caps.googlePay.supported) {
        props.onUnavailable?.();
        return;
      }
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      if (gen !== generation) return;
      const instance = await xmoney.googlePay({
        container: host,
        publicKey: publicKey(),
        orderPayload: props.order.payload,
        orderChecksum: props.order.checksum,
        options: { appearance: googleAppearance(getTheme()) },
        onReady: () => {
          if (gen === generation) props.onReady?.();
        },
        onPaymentComplete: (transaction) => props.onComplete(transaction),
        onError: (error) => props.onError(errorText(error)),
      });
      if (gen !== generation) {
        releaseWidget(instance);
        return;
      }
      google = instance;
    } catch (cause: unknown) {
      if (gen === generation) props.onError(errorText(cause));
    }
  }

  function start() {
    generation += 1;
    const gen = generation;
    releaseWidget(google);
    google = null;
    host.replaceChildren();
    void load(gen);
  }

  const stopTheme = subscribeTheme(start);
  start();

  return () => {
    generation += 1;
    stopTheme();
    releaseWidget(google);
    google = null;
    host.replaceChildren();
  };
}
