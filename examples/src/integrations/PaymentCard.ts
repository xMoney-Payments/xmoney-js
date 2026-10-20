import { loadXMoney, type PaymentCardInstance, type TransactionDetails } from '@xmoney/xmoney-js';
import { sampleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { releaseWidget } from '../lib/release-widget';
import { getTheme, subscribeTheme } from '../theme';

export interface PaymentCardHandle {
  submit: () => void;
  destroy: () => void;
}

export function mountPaymentCard(
  host: HTMLElement,
  props: {
    order: DemoOrder;
    onReady?: () => void;
    onProcessing?: (processing: boolean) => void;
    onComplete: (transaction: TransactionDetails) => void;
    onError: (message: string) => void;
  },
): PaymentCardHandle {
  let generation = 0;
  let card: PaymentCardInstance | null = null;
  const stopTheme = subscribeTheme((mode) => {
    card?.updateAppearance(sampleAppearance(mode));
  });

  const gen = ++generation;
  void (async () => {
    try {
      const xmoney = await loadXMoney();
      if (gen !== generation) return;
      const appearance = sampleAppearance(getTheme());
      const instance = await xmoney.paymentCard({
        container: host,
        publicKey: publicKey(),
        orderPayload: props.order.payload,
        orderChecksum: props.order.checksum,
        card: { submitButton: { visible: false } },
        options: { appearance },
        onReady: () => {
          if (gen !== generation) return;
          props.onReady?.();
        },
        onPaymentProcessing: (processing) => props.onProcessing?.(processing),
        onPaymentComplete: (transaction) => props.onComplete(transaction),
        onError: (error) => props.onError(errorText(error)),
      });
      if (gen !== generation) {
        releaseWidget(instance);
        return;
      }
      instance.updateAppearance(sampleAppearance(getTheme()));
      card = instance;
    } catch (cause: unknown) {
      if (gen === generation) props.onError(errorText(cause));
    }
  })();

  return {
    submit: () => card?.submit(),
    destroy: () => {
      generation += 1;
      stopTheme();
      releaseWidget(card);
      card = null;
      host.replaceChildren();
    },
  };
}
