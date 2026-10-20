import {
  loadXMoney,
  MatchStatus,
  type Appearance,
  type ApplePayInstance,
  type CardHolderVerificationResult,
  type CardInputGrouping,
  type FormButtonType,
  type GooglePayInstance,
  type Locale,
  type OrderUpdate,
  type OrderUpdateResult,
  type PaymentCardInstance,
  type PaymentFormInstance,
  type TransactionDetails,
  type ValidationMode,
} from '@xmoney/xmoney-js';
import { appleAppearance, googleAppearance, sampleAppearance } from './lib/appearance';
import { publicKey } from './lib/config';
import type { DemoOrder } from './lib/demo-backend';
import { errorText } from './lib/errors';
import type { OrderUpdater } from './lib/orders';
import { releaseWidget } from './lib/release-widget';
import { createWaiters } from './lib/waiters';
import { getTheme, subscribeTheme } from './theme';

export interface CheckoutCallbacks {
  onReady?: () => void;
  onProcessing?: (processing: boolean) => void;
  onComplete: (transaction: TransactionDetails) => void;
  onError: (message: string) => void;
}

export interface SubmitHandle {
  submit: () => void;
  destroy: () => void;
}

export function mountMerchantCheckout(
  host: HTMLElement,
  method: 'paymentForm' | 'paymentCard',
  order: DemoOrder,
  callbacks: CheckoutCallbacks,
): SubmitHandle {
  let instance: PaymentFormInstance | PaymentCardInstance | null = null;
  let stopped = false;
  const stopTheme = subscribeTheme((mode) => instance?.updateAppearance(sampleAppearance(mode)));

  void (async () => {
    try {
      const xmoney = await loadXMoney();
      if (stopped) return;
      const shared = {
        container: host,
        publicKey: publicKey(),
        orderPayload: order.payload,
        orderChecksum: order.checksum,
        card: { submitButton: { visible: false as const } },
        options: { appearance: sampleAppearance(getTheme()) },
        onReady: callbacks.onReady,
        onPaymentProcessing: callbacks.onProcessing,
        onPaymentComplete: callbacks.onComplete,
        onError: (error: unknown) => callbacks.onError(errorText(error)),
      };
      const mounted =
        method === 'paymentForm' ? await xmoney.paymentForm(shared) : await xmoney.paymentCard(shared);
      if (stopped) {
        releaseWidget(mounted);
        return;
      }
      instance = mounted;
    } catch (cause: unknown) {
      if (!stopped) callbacks.onError(errorText(cause));
    }
  })();

  return {
    submit: () => instance?.submit(),
    destroy() {
      stopped = true;
      stopTheme();
      releaseWidget(instance);
      instance = null;
      host.replaceChildren();
    },
  };
}

export function mountCardHolderCheckout(
  host: HTMLElement,
  method: 'paymentForm' | 'paymentCard',
  order: DemoOrder,
  callbacks: CheckoutCallbacks & { onVerify: (result: CardHolderVerificationResult) => void },
): { destroy: () => void } {
  let instance: PaymentFormInstance | PaymentCardInstance | null = null;
  let stopped = false;
  const stopTheme = subscribeTheme((mode) => instance?.updateAppearance(sampleAppearance(mode)));

  void (async () => {
    try {
      const xmoney = await loadXMoney();
      if (stopped) return;
      const shared = {
        container: host,
        publicKey: publicKey(),
        orderPayload: order.payload,
        orderChecksum: order.checksum,
        card: {
          ...(method === 'paymentCard' ? { submitButton: { visible: false as const } } : {}),
          cardHolderVerification: {
            name: { firstName: 'John', lastName: 'Doe' },
            onCardHolderVerification(result: CardHolderVerificationResult) {
              callbacks.onVerify(result);
              return result.status === MatchStatus.Matched;
            },
          },
        },
        options: { appearance: sampleAppearance(getTheme()) },
        onReady: callbacks.onReady,
        onPaymentProcessing: callbacks.onProcessing,
        onPaymentComplete: callbacks.onComplete,
        onError: (error: unknown) => callbacks.onError(errorText(error)),
      };
      const mounted =
        method === 'paymentForm' ? await xmoney.paymentForm(shared) : await xmoney.paymentCard(shared);
      if (stopped) {
        releaseWidget(mounted);
        return;
      }
      instance = mounted;
    } catch (cause: unknown) {
      if (!stopped) callbacks.onError(errorText(cause));
    }
  })();

  return {
    destroy() {
      stopped = true;
      stopTheme();
      releaseWidget(instance);
      instance = null;
      host.replaceChildren();
    },
  };
}

export function mountUpdatableCheckout(
  host: HTMLElement,
  method: 'paymentForm' | 'paymentCard' | 'applePay' | 'googlePay',
  order: DemoOrder,
  callbacks: CheckoutCallbacks & { onUnavailable?: () => void },
): OrderUpdater & { destroy: () => void } {
  const waiters = createWaiters<
    PaymentFormInstance | PaymentCardInstance | ApplePayInstance | GooglePayInstance
  >();
  let stopped = false;
  const stopTheme = subscribeTheme(() => {
    if (method === 'applePay' || method === 'googlePay') return;
    const instance = waiters.get();
    if (instance && 'updateAppearance' in instance) instance.updateAppearance(sampleAppearance(getTheme()));
  });

  void (async () => {
    try {
      const xmoney = await loadXMoney();
      if (stopped) return;
      if (method === 'applePay' || method === 'googlePay') {
        const capabilities = await xmoney.getPaymentMethodCapabilities();
        const supported =
          method === 'applePay' ? capabilities.applePay.supported : capabilities.googlePay.supported;
        if (!supported) {
          callbacks.onUnavailable?.();
          return;
        }
        const shared = {
          container: host,
          publicKey: publicKey(),
          orderPayload: order.payload,
          orderChecksum: order.checksum,
          onReady: callbacks.onReady,
          onPaymentComplete: callbacks.onComplete,
          onError: (error: unknown) => callbacks.onError(errorText(error)),
        };
        const wallet =
          method === 'applePay'
            ? await xmoney.applePay({ ...shared, options: { appearance: appleAppearance(getTheme()) } })
            : await xmoney.googlePay({ ...shared, options: { appearance: googleAppearance(getTheme()) } });
        if (stopped) {
          releaseWidget(wallet);
          return;
        }
        waiters.settle(wallet);
        return;
      }

      const shared = {
        container: host,
        publicKey: publicKey(),
        orderPayload: order.payload,
        orderChecksum: order.checksum,
        options: { appearance: sampleAppearance(getTheme()) },
        onReady: callbacks.onReady,
        onPaymentProcessing: callbacks.onProcessing,
        onPaymentComplete: callbacks.onComplete,
        onError: (error: unknown) => callbacks.onError(errorText(error)),
      };
      const mounted =
        method === 'paymentForm'
          ? await xmoney.paymentForm(shared)
          : await xmoney.paymentCard({ ...shared, card: { submitButton: { visible: false } } });
      if (stopped) {
        releaseWidget(mounted);
        return;
      }
      waiters.settle(mounted);
    } catch (cause: unknown) {
      if (!stopped) {
        waiters.fail(cause instanceof Error ? cause : new Error(errorText(cause)));
        callbacks.onError(errorText(cause));
      }
    }
  })();

  return {
    async updateOrder(next: OrderUpdate): Promise<OrderUpdateResult> {
      const instance = await waiters.whenReady();
      return instance.updateOrder(next);
    },
    destroy() {
      stopped = true;
      stopTheme();
      releaseWidget(waiters.get());
      waiters.fail(new Error('Checkout was closed'));
      waiters.reset();
      host.replaceChildren();
    },
  };
}

export interface PlaygroundOptions {
  method: 'paymentForm' | 'paymentCard' | 'applePay' | 'googlePay';
  order: DemoOrder;
  appearance: Appearance;
  mode: 'light' | 'dark';
  locale: Locale;
  grouping: CardInputGrouping;
  validationMode: ValidationMode;
  submitVisible: boolean;
  submitType: FormButtonType;
  savedCards: boolean;
  savedCardOptIn: boolean;
  applePay: boolean;
  googlePay: boolean;
  collectOnCard: boolean;
  collectOnApplePay: boolean;
  collectOnGooglePay: boolean;
}

export interface PlaygroundHandle {
  updateAppearance: (appearance: Appearance) => void;
  updateLocale: (locale: Locale) => void;
  destroy: () => void;
}

export function mountPlaygroundCheckout(
  host: HTMLElement,
  options: PlaygroundOptions,
  callbacks: CheckoutCallbacks & { onUnavailable?: () => void },
): PlaygroundHandle {
  let instance:
    | PaymentFormInstance
    | PaymentCardInstance
    | ApplePayInstance
    | GooglePayInstance
    | null = null;
  let stopped = false;

  void (async () => {
    try {
      const xmoney = await loadXMoney();
      if (stopped) return;
      if (options.method === 'applePay' || options.method === 'googlePay') {
        const capabilities = await xmoney.getPaymentMethodCapabilities();
        const supported =
          options.method === 'applePay'
            ? capabilities.applePay.supported
            : capabilities.googlePay.supported;
        if (!supported) {
          callbacks.onUnavailable?.();
          return;
        }
        const shared = {
          container: host,
          publicKey: publicKey(),
          orderPayload: options.order.payload,
          orderChecksum: options.order.checksum,
          onReady: callbacks.onReady,
          onPaymentComplete: callbacks.onComplete,
          onError: (error: unknown) => callbacks.onError(errorText(error)),
        };
        const wallet =
          options.method === 'applePay'
            ? await xmoney.applePay({
                ...shared,
                options: { appearance: appleAppearance(options.mode) },
              })
            : await xmoney.googlePay({
                ...shared,
                options: { appearance: googleAppearance(options.mode) },
              });
        if (stopped) releaseWidget(wallet);
        else instance = wallet;
        return;
      }

      const card = {
        validationMode: options.validationMode,
        savedCards: { enabled: options.savedCards, optInVisible: options.savedCardOptIn },
        submitButton: { visible: options.submitVisible, type: options.submitType },
        inputs: { grouping: options.grouping },
      };
      const shared = {
        container: host,
        publicKey: publicKey(),
        orderPayload: options.order.payload,
        orderChecksum: options.order.checksum,
        card,
        options: { appearance: options.appearance, locale: options.locale },
        onReady: callbacks.onReady,
        onPaymentProcessing: callbacks.onProcessing,
        onPaymentComplete: callbacks.onComplete,
        onError: (error: unknown) => callbacks.onError(errorText(error)),
      };
      const mounted =
        options.method === 'paymentForm'
          ? await xmoney.paymentForm({
              ...shared,
              paymentMethods: {
                applePay: {
                  enabled: options.applePay,
                  appearance: appleAppearance(options.mode),
                },
                googlePay: {
                  enabled: options.googlePay,
                  appearance: googleAppearance(options.mode),
                },
              },
              ...(options.collectOnCard ||
              options.collectOnApplePay ||
              options.collectOnGooglePay
                ? {
                    customerDetails: {
                      ...(options.collectOnCard ? { card: true } : {}),
                      ...(options.collectOnApplePay ? { applePay: true } : {}),
                      ...(options.collectOnGooglePay ? { googlePay: true } : {}),
                    },
                  }
                : {}),
            })
          : await xmoney.paymentCard(shared);
      if (stopped) releaseWidget(mounted);
      else instance = mounted;
    } catch (cause: unknown) {
      if (!stopped) callbacks.onError(errorText(cause));
    }
  })();

  return {
    updateAppearance(appearance) {
      if (instance && 'updateAppearance' in instance) instance.updateAppearance(appearance);
    },
    updateLocale(locale) {
      if (instance && 'updateLocale' in instance) instance.updateLocale(locale);
    },
    destroy() {
      stopped = true;
      releaseWidget(instance);
      instance = null;
      host.replaceChildren();
    },
  };
}
