import type {
  CardHolderVerificationResult,
  CardInputGrouping,
  FormButtonType,
  Locale,
  TransactionDetails,
  ValidationMode,
} from '@xmoney/xmoney-js';
import { mountApplePay } from './integrations/ApplePay';
import { mountGooglePay } from './integrations/GooglePay';
import { mountPaymentCard, type PaymentCardHandle } from './integrations/PaymentCard';
import { mountPaymentForm } from './integrations/PaymentForm';
import { mountSavedCardPayment } from './integrations/SavedCardPayment';
import {
  itemCount,
  linesOf,
  subtotalOf,
  hearth,
  lumen,
  pulse,
  type Brand,
  type Line,
} from './lib/catalog';
import {
  AMOUNT_MIN_MINOR,
  AMOUNT_STEP_MINOR,
  SAMPLE_AMOUNT_MINOR,
  SAMPLE_DESCRIPTION,
} from './lib/config';
import type { DemoOrder } from './lib/demo-backend';
import { formatMoney } from './lib/format';
import {
  loadSampleOrder,
  watchLiveOrder,
  type LiveOrderState,
  type OrderUpdater,
  type SampleOrderState,
} from './lib/orders';
import {
  playgroundAppearance,
  playgroundTheme,
  type PlaygroundThemeId,
} from './lib/appearance';
import {
  bindTestCards,
  clearLoading,
  cloneTemplate,
  renderMethods,
  renderResult,
  required,
  setError,
  showLoading,
  type PaymentOutcome,
} from './templates';
import {
  mountCardHolderCheckout,
  mountMerchantCheckout,
  mountPlaygroundCheckout,
  mountUpdatableCheckout,
  type PlaygroundHandle,
  type PlaygroundOptions,
  type SubmitHandle,
} from './widgets';

export type PageCleanup = () => void;

export function mountPage(root: HTMLElement): PageCleanup {
  const page = required<HTMLElement>(root, '[data-page]');
  const stopCards = bindTestCards(root);
  let stop: PageCleanup;
  switch (page.dataset.page) {
    case 'payment-form':
      stop = mountPaymentFormPage(page);
      break;
    case 'payment-card':
      stop = mountPaymentCardPage(page);
      break;
    case 'pay-with-card':
      stop = mountSavedCardsPage(page);
      break;
    case 'wallets':
      stop = mountWalletsPage(page);
      break;
    case 'merchant-pay':
      stop = mountMerchantPage(page);
      break;
    case 'update-order':
      stop = mountUpdateOrderPage(page);
      break;
    case 'cardholder':
      stop = mountCardHolderPage(page);
      break;
    case 'store':
      stop = mountStorePage(page);
      break;
    case 'playground':
      stop = mountPlaygroundPage(page);
      break;
    default:
      throw new Error(`Unknown page: ${page.dataset.page ?? ''}`);
  }
  return () => {
    stopCards();
    stop();
  };
}

function mountPaymentFormPage(root: HTMLElement): PageCleanup {
  const view = checkoutView(root);
  let outcome: PaymentOutcome | null = null;
  let stopWidget: PageCleanup | null = null;
  let state: SampleOrderState = { order: null, error: null, loading: true };
  let key = '';
  const sample = loadSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION, (next) => {
    state = next;
    paint();
  });
  view.restart.addEventListener('click', restart);

  function paint() {
    const nextKey = outcome
      ? `outcome:${outcome.kind}`
      : state.order?.checksum ?? (state.loading ? 'loading' : `error:${state.error ?? ''}`);
    if (nextKey === key) return;
    key = nextKey;
    stopWidget?.();
    stopWidget = null;
    resetCheckoutView(view);
    if (outcome) return showOutcome(view, outcome);
    if (state.loading) return showLoading(view.loading);
    if (state.error) return setError(view.error, state.error);
    if (!state.order) return;
    showLoading(view.loading);
    stopWidget = mountPaymentForm(view.slot, {
      order: state.order,
      onReady: () => clearLoading(view.loading),
      onComplete: complete,
      onError: fail,
    });
  }

  function complete(transaction: TransactionDetails) {
    outcome = { kind: 'complete', transaction };
    paint();
  }

  function fail(message: string) {
    outcome = { kind: 'error', message };
    paint();
  }

  function restart() {
    outcome = null;
    key = '';
    sample.reload();
  }

  return () => {
    sample.stop();
    stopWidget?.();
  };
}

function mountPaymentCardPage(root: HTMLElement): PageCleanup {
  const view = checkoutView(root);
  const pay = required<HTMLButtonElement>(root, '#merchant-pay');
  let outcome: PaymentOutcome | null = null;
  let card: PaymentCardHandle | null = null;
  let processing = false;
  let state: SampleOrderState = { order: null, error: null, loading: true };
  let key = '';
  const sample = loadSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION, (next) => {
    state = next;
    paint();
  });
  pay.addEventListener('click', () => card?.submit());
  view.restart.addEventListener('click', restart);

  function paint() {
    const nextKey = outcome
      ? `outcome:${outcome.kind}`
      : state.order?.checksum ?? (state.loading ? 'loading' : `error:${state.error ?? ''}`);
    if (nextKey === key) return;
    key = nextKey;
    card?.destroy();
    card = null;
    processing = false;
    pay.disabled = true;
    resetCheckoutView(view);
    if (outcome) {
      pay.hidden = true;
      return showOutcome(view, outcome);
    }
    if (state.loading) return showLoading(view.loading);
    if (state.error) return setError(view.error, state.error);
    if (!state.order) return;
    pay.hidden = false;
    showLoading(view.loading);
    card = mountPaymentCard(view.slot, {
      order: state.order,
      onReady: () => {
        clearLoading(view.loading);
        pay.disabled = processing;
      },
      onProcessing(next) {
        processing = next;
        pay.disabled = processing;
        pay.textContent = processing ? 'Processing…' : 'Pay';
      },
      onComplete: (transaction) => {
        outcome = { kind: 'complete', transaction };
        paint();
      },
      onError: (message) => {
        outcome = { kind: 'error', message };
        paint();
      },
    });
  }

  function restart() {
    outcome = null;
    key = '';
    sample.reload();
  }

  return () => {
    sample.stop();
    card?.destroy();
  };
}

function mountSavedCardsPage(root: HTMLElement): PageCleanup {
  const result = required<HTMLElement>(root, '[data-result]');
  const restart = required<HTMLButtonElement>(root, '[data-restart]');
  const error = required<HTMLElement>(root, '[data-error]');
  const pay = required<HTMLButtonElement>(root, '#saved-card-pay');
  const loading = root.querySelector<HTMLElement>('[data-cards-loading]');
  let mounted: { destroy: () => void } | null = null;
  let outcome: PaymentOutcome | null = null;
  let state: SampleOrderState = { order: null, error: null, loading: true };
  let key = '';
  const sample = loadSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION, (next) => {
    state = next;
    paint();
  });
  restart.addEventListener('click', () => {
    outcome = null;
    key = '';
    sample.reload();
  });

  function paint() {
    const nextKey = outcome
      ? `outcome:${outcome.kind}`
      : state.order?.checksum ?? (state.loading ? 'loading' : `error:${state.error ?? ''}`);
    if (nextKey === key) return;
    key = nextKey;
    mounted?.destroy();
    mounted = null;
    result.hidden = true;
    restart.hidden = true;
    setError(error, state.error);
    if (loading) loading.hidden = Boolean(state.error) || Boolean(outcome);
    if (outcome) {
      pay.hidden = true;
      renderResult(result, outcome);
      restart.hidden = false;
      return;
    }
    if (!state.order) return;
    if (loading) loading.hidden = false;
    mounted = mountSavedCardPayment(root, {
      order: state.order,
      onComplete(transaction) {
        outcome = { kind: 'complete', transaction };
        paint();
      },
      onError(message) {
        outcome = { kind: 'error', message };
        paint();
      },
    });
  }

  return () => {
    sample.stop();
    mounted?.destroy();
  };
}

function mountWalletsPage(root: HTMLElement): PageCleanup {
  const view = checkoutView(root);
  const methods = required<HTMLElement>(root, '[data-methods]');
  let method: 'applePay' | 'googlePay' = 'applePay';
  let outcome: PaymentOutcome | null = null;
  let stopWidget: PageCleanup | null = null;
  let state: SampleOrderState = { order: null, error: null, loading: true };
  let key = '';
  const sample = loadSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION, (next) => {
    state = next;
    paint();
  });
  view.restart.addEventListener('click', restart);

  function paint() {
    renderMethods(methods, ['applePay', 'googlePay'], method, (next) => {
      method = next as typeof method;
      outcome = null;
      key = '';
      paint();
    });
    const nextKey = outcome
      ? `outcome:${outcome.kind}`
      : state.order
        ? `${method}:${state.order.checksum}`
        : state.loading
          ? 'loading'
          : `error:${state.error ?? ''}`;
    if (nextKey === key) return;
    key = nextKey;
    stopWidget?.();
    stopWidget = null;
    resetCheckoutView(view);
    if (outcome) return showOutcome(view, outcome);
    if (state.loading) return showLoading(view.loading, true);
    if (state.error) return setError(view.error, state.error);
    if (!state.order) return;
    showLoading(view.loading, true);
    const callbacks = {
      order: state.order,
      onReady: () => clearLoading(view.loading),
      onUnavailable: () => {
        clearLoading(view.loading);
        setError(view.error, `${method === 'applePay' ? 'Apple Pay' : 'Google Pay'} is not available in this browser.`);
      },
      onComplete: (transaction: TransactionDetails) => {
        outcome = { kind: 'complete', transaction };
        paint();
      },
      onError: (message: string) => {
        outcome = { kind: 'error', message };
        paint();
      },
    };
    stopWidget =
      method === 'applePay' ? mountApplePay(view.slot, callbacks) : mountGooglePay(view.slot, callbacks);
  }

  function restart() {
    outcome = null;
    key = '';
    sample.reload();
  }

  return () => {
    sample.stop();
    stopWidget?.();
  };
}

function mountMerchantPage(root: HTMLElement): PageCleanup {
  const view = checkoutView(root);
  const methods = required<HTMLElement>(root, '[data-methods]');
  const pay = required<HTMLButtonElement>(root, '#merchant-pay');
  let method: 'paymentForm' | 'paymentCard' = 'paymentForm';
  let outcome: PaymentOutcome | null = null;
  let handle: SubmitHandle | null = null;
  let state: SampleOrderState = { order: null, error: null, loading: true };
  let key = '';
  const sample = loadSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION, (next) => {
    state = next;
    paint();
  });
  pay.addEventListener('click', () => handle?.submit());
  view.restart.addEventListener('click', restart);

  function paint() {
    renderMethods(methods, ['paymentForm', 'paymentCard'], method, (next) => {
      method = next as typeof method;
      outcome = null;
      key = '';
      paint();
    });
    const nextKey = outcome
      ? `outcome:${outcome.kind}`
      : state.order
        ? `${method}:${state.order.checksum}`
        : state.loading
          ? 'loading'
          : `error:${state.error ?? ''}`;
    if (nextKey === key) return;
    key = nextKey;
    handle?.destroy();
    handle = null;
    resetCheckoutView(view);
    pay.disabled = true;
    if (outcome) {
      pay.hidden = true;
      return showOutcome(view, outcome);
    }
    pay.hidden = false;
    if (state.loading) return showLoading(view.loading);
    if (state.error) return setError(view.error, state.error);
    if (!state.order) return;
    showLoading(view.loading);
    handle = mountMerchantCheckout(view.slot, method, state.order, {
      onReady: () => {
        clearLoading(view.loading);
        pay.disabled = false;
      },
      onProcessing(processing) {
        pay.disabled = processing;
        pay.textContent = processing ? 'Processing…' : 'Pay';
      },
      onComplete(transaction) {
        outcome = { kind: 'complete', transaction };
        paint();
      },
      onError(message) {
        outcome = { kind: 'error', message };
        paint();
      },
    });
  }

  function restart() {
    outcome = null;
    key = '';
    sample.reload();
  }

  return () => {
    sample.stop();
    handle?.destroy();
  };
}

function mountCardHolderPage(root: HTMLElement): PageCleanup {
  const view = checkoutView(root);
  const methods = required<HTMLElement>(root, '[data-methods]');
  const verification = required<HTMLElement>(root, '[data-verification]');
  let method: 'paymentForm' | 'paymentCard' = 'paymentForm';
  let outcome: PaymentOutcome | null = null;
  let handle: { destroy: () => void } | null = null;
  let state: SampleOrderState = { order: null, error: null, loading: true };
  let key = '';
  const sample = loadSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION, (next) => {
    state = next;
    paint();
  });
  view.restart.addEventListener('click', restart);

  function paint() {
    renderMethods(methods, ['paymentForm', 'paymentCard'], method, (next) => {
      method = next as typeof method;
      verification.hidden = true;
      outcome = null;
      key = '';
      paint();
    });
    const nextKey = outcome
      ? `outcome:${outcome.kind}`
      : state.order
        ? `${method}:${state.order.checksum}`
        : state.loading
          ? 'loading'
          : `error:${state.error ?? ''}`;
    if (nextKey === key) return;
    key = nextKey;
    handle?.destroy();
    handle = null;
    resetCheckoutView(view);
    if (outcome) return showOutcome(view, outcome);
    if (state.loading) return showLoading(view.loading);
    if (state.error) return setError(view.error, state.error);
    if (!state.order) return;
    showLoading(view.loading);
    handle = mountCardHolderCheckout(view.slot, method, state.order, {
      onReady: () => clearLoading(view.loading),
      onVerify(result: CardHolderVerificationResult) {
        verification.textContent = `Verification: ${result.status}`;
        verification.hidden = false;
      },
      onComplete(transaction) {
        outcome = { kind: 'complete', transaction };
        paint();
      },
      onError(message) {
        outcome = { kind: 'error', message };
        paint();
      },
    });
  }

  function restart() {
    outcome = null;
    verification.hidden = true;
    key = '';
    sample.reload();
  }

  return () => {
    sample.stop();
    handle?.destroy();
  };
}

function mountStorePage(root: HTMLElement): PageCleanup {
  const brands: Record<string, Brand> = { lumen, hearth, pulse };
  const brand = brands[root.dataset.brand ?? ''];
  if (!brand) throw new Error(`Unknown store ${root.dataset.brand ?? ''}`);
  const products = required<HTMLElement>(root, '[data-products]');
  const catalog = required<HTMLElement>(root, '[data-catalog]');
  const stage = required<HTMLElement>(root, '[data-store-stage]');
  const openCart = required<HTMLButtonElement>(root, '[data-open-cart]');
  const back = required<HTMLButtonElement>(root, '[data-back-shop]');
  const cartList = required<HTMLElement>(root, '[data-cart-lines]');
  const cartTotal = required<HTMLElement>(root, '[data-cart-total]');
  const view = checkoutView(root);
  const quantities: Record<string, number> = {};
  let sample: ReturnType<typeof loadSampleOrder> | null = null;
  let stopWidget: PageCleanup | null = null;
  let outcome: PaymentOutcome | null = null;
  let orderState: SampleOrderState = { order: null, error: null, loading: true };
  let key = '';

  renderProducts();
  openCart.addEventListener('click', showCart);
  back.addEventListener('click', showCatalog);
  view.restart.addEventListener('click', () => {
    outcome = null;
    key = '';
    sample?.reload();
  });

  function renderProducts() {
    products.replaceChildren();
    for (const product of brand.products) {
      const card = cloneTemplate<HTMLElement>('product-template');
      const image = required<HTMLImageElement>(card, '[data-product-image]');
      image.src = `/products/${product.image}`;
      image.alt = product.name;
      required<HTMLElement>(card, '[data-product-category]').textContent = product.category;
      required<HTMLElement>(card, '[data-product-name]').textContent = product.name;
      required<HTMLElement>(card, '[data-product-blurb]').textContent = product.blurb;
      required<HTMLElement>(card, '[data-product-price]').textContent = formatMoney(product.priceMinor);
      const quantity = required<HTMLElement>(card, '[data-quantity-control]');
      renderQuantity(quantity, quantities[product.id] ?? 0, (next) => {
        quantities[product.id] = next;
        renderProducts();
      });
      products.append(card);
    }
    const lines = currentLines();
    const count = itemCount(lines);
    openCart.hidden = count === 0;
    openCart.textContent = `Cart · ${count} ${count === 1 ? 'item' : 'items'} · ${formatMoney(subtotalOf(lines))}`;
  }

  function showCart() {
    const lines = currentLines();
    catalog.hidden = true;
    stage.hidden = false;
    renderCart(lines);
    const amount = subtotalOf(lines);
    const description = `${brand.name} · ${itemCount(lines)} items`;
    sample?.stop();
    sample = loadSampleOrder(amount, description, (next) => {
      orderState = next;
      paintCheckout();
    });
  }

  function showCatalog() {
    sample?.stop();
    sample = null;
    stopWidget?.();
    stopWidget = null;
    stage.hidden = true;
    catalog.hidden = false;
  }

  function renderCart(lines: Line[]) {
    cartList.replaceChildren();
    for (const line of lines) {
      const row = cloneTemplate<HTMLElement>('cart-row-template');
      const image = required<HTMLImageElement>(row, '[data-cart-image]');
      image.src = `/products/${line.product.image}`;
      required<HTMLElement>(row, '[data-cart-name]').textContent =
        line.quantity > 1 ? `${line.product.name} × ${line.quantity}` : line.product.name;
      required<HTMLElement>(row, '[data-cart-price]').textContent = formatMoney(line.lineTotalMinor);
      cartList.append(row);
    }
    cartTotal.textContent = formatMoney(subtotalOf(lines));
  }

  function paintCheckout() {
    const nextKey = outcome
      ? `outcome:${outcome.kind}`
      : orderState.order?.checksum ??
        (orderState.loading ? 'loading' : `error:${orderState.error ?? ''}`);
    if (nextKey === key) return;
    key = nextKey;
    stopWidget?.();
    stopWidget = null;
    resetCheckoutView(view);
    if (outcome) return showOutcome(view, outcome);
    if (orderState.loading) return showLoading(view.loading);
    if (orderState.error) return setError(view.error, orderState.error);
    if (!orderState.order) return;
    showLoading(view.loading);
    stopWidget = mountPaymentForm(view.slot, {
      order: orderState.order,
      onReady: () => clearLoading(view.loading),
      onComplete(transaction) {
        outcome = { kind: 'complete', transaction };
        paintCheckout();
      },
      onError(message) {
        outcome = { kind: 'error', message };
        paintCheckout();
      },
    });
  }

  function currentLines() {
    return linesOf(quantities, brand.products);
  }

  return () => {
    sample?.stop();
    stopWidget?.();
  };
}

function mountUpdateOrderPage(root: HTMLElement): PageCleanup {
  const view = checkoutView(root);
  const methods = required<HTMLElement>(root, '[data-methods]');
  const price = required<HTMLElement>(root, '[data-order-price]');
  const total = required<HTMLElement>(root, '[data-order-total]');
  const updating = required<HTMLElement>(root, '[data-updating]');
  const decrease = required<HTMLButtonElement>(root, '[data-decrease]');
  const increase = required<HTMLButtonElement>(root, '[data-increase]');
  let method: 'paymentForm' | 'paymentCard' | 'applePay' | 'googlePay' = 'paymentForm';
  let amount = SAMPLE_AMOUNT_MINOR;
  let outcome: PaymentOutcome | null = null;
  let updater: (OrderUpdater & { destroy: () => void }) | null = null;
  let widgetKey = '';
  let liveState: LiveOrderState = {
    mountOrder: null,
    error: null,
    preparing: false,
    updating: false,
  };
  const live = watchLiveOrder(
    () => ({
      amountMinor: outcome ? 0 : amount,
      description: SAMPLE_DESCRIPTION,
      resetKey: method,
    }),
    () => updater,
    (next) => {
      liveState = next;
      paint();
    },
  );
  decrease.addEventListener('click', () => {
    amount = Math.max(AMOUNT_MIN_MINOR, amount - AMOUNT_STEP_MINOR);
    live.sync();
  });
  increase.addEventListener('click', () => {
    amount += AMOUNT_STEP_MINOR;
    live.sync();
  });
  view.restart.addEventListener('click', () => {
    outcome = null;
    amount = SAMPLE_AMOUNT_MINOR;
    live.sync();
  });

  function paint() {
    const money = formatMoney(amount);
    price.textContent = money;
    total.textContent = money;
    const subtotal = root.querySelector('[data-order-subtotal]');
    if (subtotal) subtotal.textContent = money;
    updating.hidden = !liveState.updating;
    decrease.disabled = liveState.updating || amount <= AMOUNT_MIN_MINOR;
    increase.disabled = liveState.updating;
    renderMethods(
      methods,
      ['paymentForm', 'paymentCard', 'applePay', 'googlePay'],
      method,
      (next) => {
        method = next as typeof method;
        widgetKey = '';
        live.sync();
      },
    );
    if (outcome) {
      updater?.destroy();
      updater = null;
      widgetKey = '';
      resetCheckoutView(view);
      showOutcome(view, outcome);
      return;
    }
    setError(view.error, liveState.error);
    if (liveState.preparing && !liveState.mountOrder) {
      showLoading(view.loading, method === 'applePay' || method === 'googlePay');
    } else {
      clearLoading(view.loading);
    }
    const nextKey = liveState.mountOrder ? `${method}:${liveState.mountOrder.checksum}` : '';
    if (nextKey === widgetKey) return;
    updater?.destroy();
    updater = null;
    widgetKey = nextKey;
    view.slot.replaceChildren();
    if (!liveState.mountOrder) return;
    showLoading(view.loading, method === 'applePay' || method === 'googlePay');
    updater = mountUpdatableCheckout(view.slot, method, liveState.mountOrder, {
      onReady: () => clearLoading(view.loading),
      onUnavailable: () => {
        clearLoading(view.loading);
        setError(view.error, 'This wallet is not available in this browser.');
      },
      onComplete(transaction) {
        outcome = { kind: 'complete', transaction };
        live.sync();
        paint();
      },
      onError(message) {
        outcome = { kind: 'error', message };
        live.sync();
        paint();
      },
    });
  }

  return () => {
    live.stop();
    updater?.destroy();
  };
}

function mountPlaygroundPage(root: HTMLElement): PageCleanup {
  const form = required<HTMLFormElement>(root, '#playground-controls');
  const preview = required<HTMLElement>(root, '[data-playground-preview]');
  const methods = required<HTMLElement>(root, '[data-methods]');
  const view = checkoutView(root);
  let method: PlaygroundOptions['method'] = 'paymentForm';
  let mode: 'light' | 'dark' = 'light';
  let accent: PlaygroundThemeId = 'lavender';
  let outcome: PaymentOutcome | null = null;
  let handle: PlaygroundHandle | null = null;
  let state: SampleOrderState = { order: null, error: null, loading: true };
  let key = '';
  const sample = loadSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION, (next) => {
    state = next;
    paint();
  });

  form.addEventListener('change', () => {
    key = '';
    paint();
  });
  for (const button of form.querySelectorAll<HTMLButtonElement>('[data-preview-mode]')) {
    button.addEventListener('click', () => {
      mode = button.dataset.previewMode as typeof mode;
      paint();
    });
  }
  for (const button of form.querySelectorAll<HTMLButtonElement>('[data-accent]')) {
    button.addEventListener('click', () => {
      accent = button.dataset.accent as PlaygroundThemeId;
      paint();
    });
  }
  view.restart.addEventListener('click', () => {
    outcome = null;
    key = '';
    sample.reload();
  });

  function readOptions(order: DemoOrder): PlaygroundOptions {
    const data = new FormData(form);
    return {
      method,
      order,
      appearance: playgroundAppearance(playgroundTheme(accent), mode),
      mode,
      locale: String(data.get('locale')) as Locale,
      grouping: String(data.get('grouping')) as CardInputGrouping,
      validationMode: String(data.get('validationMode')) as ValidationMode,
      submitVisible: data.has('submitVisible'),
      submitType: String(data.get('submitType')) as FormButtonType,
      savedCards: data.has('savedCards'),
      savedCardOptIn: data.has('savedCardOptIn'),
      applePay: data.has('applePay'),
      googlePay: data.has('googlePay'),
      collectOnCard: data.has('collectOnCard'),
      collectOnApplePay: data.has('collectOnApplePay'),
      collectOnGooglePay: data.has('collectOnGooglePay'),
    };
  }

  function paint() {
    const theme = playgroundTheme(accent);
    const dark = mode === 'dark';
    const ink = dark ? '#FAFAFA' : '#16141A';
    const pageColor = dark ? theme.pageDark : theme.pageLight;
    const cardColor = dark ? theme.cardDark : '#FFFFFF';
    const surfaceColor = dark ? theme.surfaceDark : theme.surface;
    const fieldBorder = dark ? 'rgba(255,255,255,0.16)' : `${theme.swatch}4d`;
    root.style.background = pageColor;
    root.style.color = ink;
    form.style.background = cardColor;
    form.style.color = ink;
    form.style.borderColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(22,20,26,0.08)';
    preview.style.background = surfaceColor;
    preview.style.color = ink;
    const shell = required<HTMLElement>(preview, '[data-widget-shell]');
    shell.style.setProperty('--canvas', pageColor);
    const surface = required<HTMLElement>(preview, '[data-widget-surface]');
    surface.style.backgroundColor = cardColor;
    surface.style.color = ink;
    const group = required<HTMLElement>(form, '[data-theme-group]');
    group.style.borderColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(22,20,26,0.08)';
    for (const select of form.querySelectorAll<HTMLSelectElement>('select')) {
      select.style.borderColor = fieldBorder;
      select.style.background = cardColor;
      select.style.color = ink;
    }
    for (const button of form.querySelectorAll<HTMLButtonElement>('[data-preview-mode]')) {
      const selected = button.dataset.previewMode === mode;
      const light = button.dataset.previewMode === 'light';
      button.setAttribute('aria-pressed', String(selected));
      button.className = `inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
        selected ? (light ? 'bg-[#16141a] text-white' : 'bg-white text-[#16141a]') : 'bg-transparent'
      }`;
    }
    for (const button of form.querySelectorAll<HTMLButtonElement>('[data-accent]')) {
      const selected = button.dataset.accent === accent;
      button.setAttribute('aria-checked', String(selected));
      button.style.boxShadow = selected ? `0 0 0 2px ${ink}` : '';
    }
    for (const fieldset of form.querySelectorAll<HTMLElement>('[data-card-controls]')) {
      fieldset.hidden = method === 'applePay' || method === 'googlePay';
    }
    for (const fieldset of form.querySelectorAll<HTMLElement>('[data-form-controls]')) {
      fieldset.hidden = method !== 'paymentForm';
    }
    renderMethods(
      methods,
      ['paymentForm', 'paymentCard', 'applePay', 'googlePay'],
      method,
      (next) => {
        method = next as typeof method;
        outcome = null;
        key = '';
        paint();
      },
    );
    if (outcome) {
      handle?.destroy();
      handle = null;
      key = '';
      resetCheckoutView(view);
      showOutcome(view, outcome);
      return;
    }
    if (state.loading) {
      showLoading(view.loading, method === 'applePay' || method === 'googlePay');
      return;
    }
    if (state.error) {
      setError(view.error, state.error);
      return;
    }
    if (!state.order) return;
    const options = readOptions(state.order);
    const remountKey = [
      method,
      state.order.checksum,
      options.grouping,
      options.validationMode,
      options.submitVisible,
      options.submitType,
      options.savedCards,
      options.savedCardOptIn,
      options.applePay,
      options.googlePay,
      options.collectOnCard,
      options.collectOnApplePay,
      options.collectOnGooglePay,
    ].join('|');
    if (handle && remountKey === key) {
      handle.updateAppearance(options.appearance);
      handle.updateLocale(options.locale);
      return;
    }
    key = remountKey;
    handle?.destroy();
    view.slot.replaceChildren();
    showLoading(view.loading, method === 'applePay' || method === 'googlePay');
    handle = mountPlaygroundCheckout(view.slot, options, {
      onReady: () => clearLoading(view.loading),
      onUnavailable: () => {
        clearLoading(view.loading);
        setError(view.error, 'This wallet is not available in this browser.');
      },
      onComplete(transaction) {
        outcome = { kind: 'complete', transaction };
        paint();
      },
      onError(message) {
        outcome = { kind: 'error', message };
        paint();
      },
    });
  }

  return () => {
    sample.stop();
    handle?.destroy();
  };
}

function checkoutView(root: ParentNode) {
  return {
    loading: required<HTMLElement>(root, '[data-loading]'),
    error: required<HTMLElement>(root, '[data-error]'),
    slot: required<HTMLElement>(root, '#checkout'),
    result: required<HTMLElement>(root, '[data-result]'),
    restart: required<HTMLButtonElement>(root, '[data-restart]'),
  };
}

function resetCheckoutView(view: ReturnType<typeof checkoutView>) {
  clearLoading(view.loading);
  setError(view.error, null);
  view.slot.hidden = false;
  view.result.hidden = true;
  view.result.replaceChildren();
  view.restart.hidden = true;
}

function showOutcome(view: ReturnType<typeof checkoutView>, outcome: PaymentOutcome) {
  clearLoading(view.loading);
  view.slot.hidden = true;
  renderResult(view.result, outcome);
  view.restart.hidden = false;
}

function renderQuantity(host: HTMLElement, value: number, onChange: (next: number) => void) {
  host.replaceChildren();
  if (value <= 0) {
    const add = cloneTemplate<HTMLButtonElement>('add-button-template');
    add.addEventListener('click', () => onChange(1));
    host.append(add);
    return;
  }
  const control = cloneTemplate<HTMLElement>('quantity-template');
  const minus = required<HTMLButtonElement>(control, '[data-minus]');
  minus.addEventListener('click', () => onChange(value - 1));
  const count = required<HTMLElement>(control, '[data-count]');
  count.textContent = String(value);
  const plus = required<HTMLButtonElement>(control, '[data-plus]');
  plus.addEventListener('click', () => onChange(value + 1));
  host.append(control);
}
