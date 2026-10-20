import { loadXMoney, type PaymentFormInstance, type TransactionDetails } from '@xmoney/xmoney-js';
import { sampleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { releaseWidget } from '../lib/release-widget';
import { getTheme, subscribeTheme } from '../theme';

export function mountPaymentForm(
  host: HTMLElement,
  props: {
    order: DemoOrder;
    onReady?: () => void;
    onComplete: (transaction: TransactionDetails) => void;
    onError: (message: string) => void;
  },
): () => void {
  let generation = 0;
  let form: PaymentFormInstance | null = null;
  const stopTheme = subscribeTheme((mode) => {
    form?.updateAppearance(sampleAppearance(mode));
  });

  const gen = ++generation;
  void (async () => {
    try {
      const xmoney = await loadXMoney();
      if (gen !== generation) return;
      const appearance = sampleAppearance(getTheme());
      const instance = await xmoney.paymentForm({
        container: host,
        publicKey: publicKey(),
        orderPayload: props.order.payload,
        orderChecksum: props.order.checksum,
        options: { appearance },
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
      instance.updateAppearance(sampleAppearance(getTheme()));
      form = instance;
    } catch (cause: unknown) {
      if (gen === generation) props.onError(errorText(cause));
    }
  })();

  return () => {
    generation += 1;
    stopTheme();
    releaseWidget(form);
    form = null;
    host.replaceChildren();
  };
}
