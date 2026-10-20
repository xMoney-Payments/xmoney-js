import { loadXMoney, type SavedCardPaymentInstance, type TransactionDetails } from '@xmoney/xmoney-js';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { releaseWidget } from '../lib/release-widget';
import { required } from '../templates';
import { btnAccent } from '../ui';

export interface SavedCard {
  id: number;
  brand: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  nameOnCard?: string;
  funding?: string;
  level?: string;
  bank?: string;
  country?: string;
}

export function mountSavedCardPayment(
  root: HTMLElement,
  props: {
    order: DemoOrder;
    onComplete: (transaction: TransactionDetails) => void;
    onError: (message: string) => void;
  },
): { destroy: () => void } {
  const list = required<HTMLElement>(root, '[data-saved-cards]');
  const loading = required<HTMLElement>(root, '[data-cards-loading]');
  const pay = required<HTMLButtonElement>(root, '#saved-card-pay');
  let cards: SavedCard[] = [];
  let cardsError: string | null = null;
  let selectedId: number | null = null;
  let instance: SavedCardPaymentInstance | null = null;
  let stopped = false;

  pay.className = btnAccent;

  void Promise.all([loadCards(), loadPayment()]).catch((cause: unknown) => {
    if (!stopped) props.onError(errorText(cause));
  });

  async function loadCards() {
    try {
      const response = await fetch('/api/cards', { method: 'POST' });
      const body = (await response.json().catch(() => ({}))) as { error?: string; cards?: SavedCard[] };
      if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
      if (stopped) return;
      cards = body.cards ?? [];
      selectedId = cards[0]?.id ?? null;
    } catch (cause: unknown) {
      if (stopped) return;
      cardsError = cause instanceof Error ? cause.message : 'Failed to load cards';
      cards = [];
    } finally {
      if (!stopped) {
        loading.hidden = true;
        renderCards();
        pay.disabled = selectedId == null || !instance;
      }
    }
  }

  async function loadPayment() {
    const xmoney = await loadXMoney();
    if (stopped) return;
    const payment = await xmoney.savedCardPayment({
      publicKey: publicKey(),
      orderPayload: props.order.payload,
      orderChecksum: props.order.checksum,
      onPaymentProcessing(processing) {
        pay.disabled = processing || selectedId == null;
        pay.textContent = processing ? 'Processing…' : 'Pay';
      },
      onPaymentComplete: props.onComplete,
      onError: (error) => props.onError(errorText(error)),
    });
    if (stopped) {
      releaseWidget(payment);
      return;
    }
    instance = payment;
    pay.disabled = selectedId == null;
  }

  function renderCards() {
    list.replaceChildren();
    if (cardsError) {
      pay.hidden = true;
      const message = document.createElement('p');
      message.className = 'my-3 rounded-xl bg-[#ff4757]/12 px-3 py-2.5 text-sm text-[#ff4757]';
      message.textContent = cardsError;
      list.append(message);
      return;
    }
    if (cards.length === 0) {
      pay.hidden = true;
      const empty = document.createElement('p');
      empty.className = 'text-sm text-black/55 dark:text-zinc-400';
      empty.textContent = 'No saved cards for this customer.';
      list.append(empty);
      return;
    }
    pay.hidden = false;

    const heading = document.createElement('p');
    heading.className = 'mb-2 text-xs font-bold tracking-[0.1em] text-black/55 uppercase dark:text-zinc-400';
    heading.textContent = 'Saved cards';

    const items = document.createElement('ul');
    items.className = 'card-list m-0 grid max-h-80 list-none gap-2 overflow-y-auto overscroll-contain p-0.5';
    items.setAttribute('aria-label', 'Saved cards');

    for (const card of cards) {
      const selected = card.id === selectedId;
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(selected));
      button.className = `grid w-full gap-1.5 rounded-2xl border px-3.5 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c4dff] ${
        selected
          ? 'border-[#7c4dff]/40 bg-[#7c4dff]/12'
          : 'border-black/[0.08] bg-transparent hover:bg-black/[0.03] dark:border-white/12 dark:hover:bg-white/[0.04]'
      }`;

      const top = document.createElement('span');
      top.className = 'flex items-center justify-between gap-2';
      const identity = document.createElement('span');
      identity.className = 'flex min-w-0 items-center gap-2';
      identity.append(brandMark(card.brand));
      const name = document.createElement('span');
      name.className = 'truncate text-sm font-semibold';
      name.textContent = card.nameOnCard || pretty(card.brand);
      identity.append(name);

      const radio = document.createElement('span');
      radio.setAttribute('aria-hidden', 'true');
      radio.className = `grid size-4 shrink-0 place-items-center rounded-full border ${
        selected ? 'border-[#7c4dff] bg-[#7c4dff]' : 'border-black/20 dark:border-white/30'
      }`;
      if (selected) {
        const dot = document.createElement('span');
        dot.className = 'size-1.5 rounded-full bg-white';
        radio.append(dot);
      }
      top.append(identity, radio);

      const pan = document.createElement('span');
      pan.className = 'font-mono text-[15px] tracking-wide';
      pan.textContent = formatPan(card.number);
      button.append(top, pan);

      const meta = [expiryLabel(card), pretty(card.funding), pretty(card.level), card.country]
        .filter(Boolean)
        .join(' · ');
      if (meta) {
        const line = document.createElement('span');
        line.className = 'text-xs text-black/55 dark:text-zinc-400';
        line.textContent = meta;
        button.append(line);
      }
      if (card.bank) {
        const bank = document.createElement('span');
        bank.className = 'truncate text-xs text-black/45 dark:text-zinc-500';
        bank.textContent = card.bank;
        button.append(bank);
      }

      button.addEventListener('click', () => {
        selectedId = card.id;
        renderCards();
        pay.disabled = !instance;
      });
      item.append(button);
      items.append(item);
    }

    list.append(heading, items);
  }

  pay.addEventListener('click', () => {
    if (selectedId != null) instance?.pay({ cardId: selectedId });
  });

  return {
    destroy() {
      stopped = true;
      releaseWidget(instance);
      instance = null;
      list.replaceChildren();
    },
  };
}

function formatPan(number: string): string {
  const compact = number.replace(/\s/g, '');
  const leading = compact.match(/^\d+/)?.[0] ?? '';
  const trailing = compact.match(/\d+$/)?.[0] ?? '';
  const end = trailing.slice(-4);
  if (leading.length >= 6 && end) {
    return `${leading.slice(0, 4)} ${leading.slice(4, 6)}•• •••• ${end}`;
  }
  return end ? `•••• •••• •••• ${end}` : number;
}

function expiryLabel(card: SavedCard): string {
  if (!card.expiryMonth && !card.expiryYear) return '';
  const month = card.expiryMonth.padStart(2, '0');
  const year = card.expiryYear.length > 2 ? card.expiryYear.slice(-2) : card.expiryYear;
  return `Exp ${month}/${year}`;
}

function pretty(value: string | undefined): string {
  const text = value?.trim() ?? '';
  if (!text) return '';
  if (text !== text.toUpperCase()) return text;
  if (text.length <= 3) return text;
  return text.toLowerCase().replace(/\b\p{L}/gu, (char) => char.toUpperCase());
}

function brandMark(brand: string): HTMLSpanElement {
  const key = brand.toLowerCase();
  const tone = key.includes('visa')
    ? 'bg-[#1a1f71] text-white'
    : key.includes('master')
      ? 'bg-[#eb001b] text-white'
      : key.includes('amex') || key.includes('american')
        ? 'bg-[#2e77bc] text-white'
        : key.includes('discover')
          ? 'bg-[#ff6000] text-white'
          : 'bg-[#7c4dff] text-white';
  const mark = document.createElement('span');
  mark.className = `shrink-0 rounded-md px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wide ${tone}`;
  mark.textContent = brand.trim().slice(0, 12).toUpperCase() || 'CARD';
  return mark;
}
