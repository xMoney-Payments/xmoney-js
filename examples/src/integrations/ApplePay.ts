import { loadXMoney, type ApplePayInstance, type TransactionDetails } from '@xmoney/xmoney-js';
import { appleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { releaseWidget } from '../lib/release-widget';
import { getTheme, subscribeTheme } from '../theme';

export function mountApplePay(
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
  let apple: ApplePayInstance | null = null;

  async function load(gen: number) {
    try {
      const xmoney = await loadXMoney();
      const caps = await xmoney.getPaymentMethodCapabilities();
      if (gen !== generation) return;
      if (!caps.applePay.supported) {
        props.onUnavailable?.();
        return;
      }
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      if (gen !== generation) return;
      const instance = await xmoney.applePay({
        container: host,
        publicKey: publicKey(),
        orderPayload: props.order.payload,
        orderChecksum: props.order.checksum,
        options: { appearance: appleAppearance(getTheme()) },
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
      apple = instance;
    } catch (cause: unknown) {
      if (gen === generation) props.onError(errorText(cause));
    }
  }

  function start() {
    generation += 1;
    const gen = generation;
    releaseWidget(apple);
    apple = null;
    host.replaceChildren();
    void load(gen);
  }

  const stopTheme = subscribeTheme(start);
  start();

  return () => {
    generation += 1;
    stopTheme();
    releaseWidget(apple);
    apple = null;
    host.replaceChildren();
  };
}
