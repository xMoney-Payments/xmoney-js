import type { TransactionDetails } from '@xmoney/xmoney-js';
import { TEST_CARDS, testCardLine, type TestCard } from './lib/test-cards';
import { backdrop, btnGhost, chip, dialog, dialogHead } from './ui';

let ready: Promise<void> | null = null;

export function loadTemplates(): Promise<void> {
  if (ready) return ready;
  ready = fetch('/partials.html')
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load templates (${response.status})`);
      return response.text();
    })
    .then((html) => {
      required<HTMLElement>(document, '#templates').innerHTML = html;
    });
  return ready;
}

export function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

export function cloneTemplate<T extends Element = HTMLElement>(id: string): T {
  const template = required<HTMLTemplateElement>(document, `#${id}`);
  const fragment = document.importNode(template.content, true);
  const element = fragment.firstElementChild;
  if (!element) throw new Error(`Template #${id} is empty`);
  return element as T;
}

export function showLoading(host: HTMLElement, wallet = false): void {
  host.replaceChildren();
  const loading = cloneTemplate<HTMLElement>('checkout-loading-template');
  loading.classList.toggle('wallet', wallet);
  host.append(loading);
}

export function clearLoading(host: HTMLElement): void {
  host.replaceChildren();
}

export function setError(element: HTMLElement, message: string | null): void {
  element.textContent = message ?? '';
  element.hidden = !message;
}

export function renderMethods(
  host: HTMLElement,
  methods: string[],
  selected: string,
  onSelect: (method: string) => void,
): void {
  host.className = 'grid w-full gap-1.5';
  host.style.gridTemplateColumns = `repeat(${methods.length > 2 ? 2 : Math.max(methods.length, 1)}, minmax(0, 1fr))`;
  host.setAttribute('role', 'tablist');
  host.setAttribute('aria-label', 'Checkout method');
  host.replaceChildren();
  for (const method of methods) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.dataset.method = method;
    const active = method === selected;
    button.setAttribute('aria-selected', String(active));
    button.className = `flex min-h-12 min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-3 text-xs font-semibold whitespace-nowrap ${
      active
        ? 'border-transparent bg-[#7c4dff]/12'
        : 'border-black/[0.08] bg-transparent dark:border-white/12'
    }`;
    button.append(methodIcon(method));
    const label = document.createElement('span');
    label.textContent = methodLabel(method);
    button.append(label);
    button.addEventListener('click', () => onSelect(method));
    host.append(button);
  }
}

export function renderResult(host: HTMLElement, outcome: PaymentOutcome): void {
  host.replaceChildren();
  const panel = cloneTemplate<HTMLElement>('result-template');
  const failed = outcome.kind === 'error';
  const wash = required<HTMLElement>(panel, '[data-result-wash]');
  const mark = required<HTMLElement>(panel, '[data-result-mark]');
  const title = required<HTMLElement>(panel, '[data-result-title]');
  const subtitle = required<HTMLElement>(panel, '[data-result-subtitle]');
  const amount = required<HTMLElement>(panel, '[data-result-amount]');
  const details = required<HTMLElement>(panel, '[data-result-details]');
  const raw = required<HTMLElement>(panel, '[data-result-raw]');
  const rawBody = required<HTMLElement>(panel, '[data-raw-body]');
  const rawLabel = required<HTMLElement>(panel, '[data-raw-label]');
  const rawToggle = required<HTMLButtonElement>(panel, '[data-raw-toggle]');
  const chevron = required<HTMLElement>(panel, '[data-raw-chevron]');

  wash.className = `rounded-2xl px-4 py-4 ${failed ? 'bg-[#ff4757]/12' : 'bg-emerald-600/12'}`;
  mark.className = `grid h-10 w-10 shrink-0 place-items-center rounded-full text-white ${
    failed ? 'bg-[#ff4757]' : 'bg-emerald-600'
  }`;
  if (failed) {
    mark.textContent = '!';
    mark.classList.add('text-xl', 'leading-none', 'font-bold');
  } else {
    mark.innerHTML =
      '<svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" aria-hidden="true"><path d="M4.5 10.5 8 14l7.5-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>';
  }
  title.textContent = failed ? 'Payment failed' : 'Payment complete';
  subtitle.textContent = failed ? 'Something went wrong. You can try again.' : 'Your payment went through.';

  if (failed) {
    amount.hidden = true;
    addDetail(details, 'Status', 'Failed');
    addDetail(details, 'Message', outcome.message || 'Something went wrong');
    raw.hidden = true;
  } else {
    const transaction = outcome.transaction as unknown as Record<string, unknown>;
    const money = formatAmount(transaction.amount, transaction.currencyKey);
    amount.hidden = !money;
    amount.textContent = money;
    addDetail(details, 'Status', text(transaction.transactionStatus) || 'Complete');
    addDetail(details, 'Transaction ID', text(transaction.id), true);
    addDetail(details, 'Order ID', text(transaction.externalOrderId), true);
    addDetail(details, 'Amount', money);
    addDetail(details, 'Description', text(transaction.description));
    rawBody.textContent = JSON.stringify(outcome.transaction, null, 2);
    rawToggle.addEventListener('click', () => {
      const open = rawBody.hidden;
      rawBody.hidden = !open;
      rawToggle.setAttribute('aria-expanded', String(open));
      rawLabel.textContent = open ? 'Hide raw response' : 'View raw response';
      chevron.classList.toggle('rotate-180', open);
    });
  }

  host.append(panel);
  host.hidden = false;
}

export function bindTestCards(root: ParentNode): () => void {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-test-cards]')];
  const listeners = buttons.map((button) => {
    const open = () => openTestCards(button.hasAttribute('data-name-check'));
    button.addEventListener('click', open);
    return () => button.removeEventListener('click', open);
  });
  return () => listeners.forEach((remove) => remove());
}

function openTestCards(nameHint: boolean): void {
  const overlay = document.createElement('div');
  overlay.className = backdrop;
  overlay.setAttribute('role', 'presentation');

  const panel = document.createElement('div');
  panel.className = `${dialog} flex max-h-[min(760px,calc(100dvh-4rem))] max-w-[820px] flex-col overflow-hidden`;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'test-cards-title');

  const header = document.createElement('header');
  header.className = `${dialogHead} shrink-0`;
  const titles = document.createElement('div');
  const title = document.createElement('h2');
  title.id = 'test-cards-title';
  title.className = 'text-lg font-bold tracking-[-0.02em]';
  title.textContent = 'Test cards';
  const subtitle = document.createElement('p');
  subtitle.className = 'mt-1 text-sm text-black/55 dark:text-zinc-400';
  subtitle.textContent = 'Sandbox Visa and Mastercard numbers. Tap a field to copy it.';
  titles.append(title, subtitle);
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = btnGhost;
  closeButton.textContent = 'Close';
  header.append(titles, closeButton);

  panel.append(header);
  if (nameHint) {
    const hint = document.createElement('p');
    hint.className = `${chip} shrink-0`;
    hint.textContent = 'This sample pays only when the cardholder name matches John Doe.';
    panel.append(hint);
  }

  const scroller = document.createElement('div');
  scroller.className = 'max-h-[min(34rem,calc(100dvh-12rem))] overflow-y-auto overscroll-contain pr-1';
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 gap-4 wide:grid-cols-2';
  let copiedId: string | null = null;

  function paint() {
    grid.replaceChildren();
    for (const card of TEST_CARDS) grid.append(testCardFace(card, copiedId, copyValue));
  }

  async function copyValue(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement('textarea');
      area.value = value;
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    copiedId = id;
    paint();
  }

  paint();
  scroller.append(grid);
  panel.append(scroller);
  overlay.append(panel);

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  function close() {
    document.body.style.overflow = previousOverflow;
    window.removeEventListener('keydown', onKey);
    overlay.remove();
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') close();
  }

  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', close);
  panel.addEventListener('click', (event) => event.stopPropagation());
  window.addEventListener('keydown', onKey);
  document.body.append(overlay);
}

function testCardFace(card: TestCard, copied: string | null, onCopy: (id: string, value: string) => void): HTMLElement {
  const visa = card.brand === 'Visa';
  const article = document.createElement('article');
  article.className =
    'overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_12px_28px_rgba(22,20,26,0.08)] dark:border-white/10 dark:bg-[#121214] dark:shadow-[0_12px_28px_rgba(0,0,0,0.35)]';

  const face = document.createElement('div');
  face.className = `relative overflow-hidden px-5 pt-5 pb-4 text-white ${
    visa
      ? 'bg-[linear-gradient(145deg,#071433_0%,#16357a_46%,#4a62b8_100%)]'
      : 'bg-[linear-gradient(145deg,#1a1012_0%,#5c1c24_48%,#a34a22_100%)]'
  }`;
  const sheen = document.createElement('div');
  sheen.className =
    'pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_100%_0%,rgba(255,255,255,0.2),transparent_58%)]';
  const orb = document.createElement('div');
  orb.className = 'pointer-events-none absolute -bottom-14 -left-8 h-36 w-36 rounded-full bg-black/25';
  const faceHead = document.createElement('header');
  faceHead.className = 'relative flex items-center justify-between gap-3';
  faceHead.append(cardChip(), brandLogo(card.brand, visa));
  face.append(sheen, orb, faceHead);
  face.append(
    copyValue({
      id: `${card.id}-pan`,
      label: 'Copy card number',
      caption: 'Card number',
      value: card.pan,
      copied,
      className: 'relative mt-6 font-mono text-[17px] tracking-[0.14em]',
      onCopy,
    }),
  );

  const metaRow = document.createElement('div');
  metaRow.className = 'relative mt-5 flex items-end justify-between gap-3';
  const fields = document.createElement('div');
  fields.className = 'flex gap-6';
  fields.append(
    copyValue({
      id: `${card.id}-expiry`,
      label: 'Copy expiry',
      caption: 'Expiry',
      value: card.expiry,
      copied,
      onCopy,
    }),
    copyValue({
      id: `${card.id}-cvv`,
      label: 'Copy CVV',
      caption: 'CVV',
      value: card.cvv,
      copied,
      onCopy,
    }),
  );
  const pill = document.createElement('span');
  pill.className = `rounded-full px-2.5 py-1 text-[11px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.18)] ${
    card.success ? 'bg-emerald-300 text-emerald-950' : 'bg-red-400 text-red-950'
  }`;
  pill.textContent = card.success ? 'Approved' : 'Declined';
  metaRow.append(fields, pill);
  face.append(metaRow);

  const body = document.createElement('div');
  body.className = 'grid gap-3 px-4 py-3.5';
  const chips = document.createElement('div');
  chips.className = 'flex flex-wrap gap-1.5';
  chips.append(metaChip(card.brand), metaChip('3DS2'), metaChip(card.flow));
  const detail = document.createElement('p');
  detail.className = 'text-[13px] leading-5 text-black/60 dark:text-zinc-400';
  detail.textContent = card.detail;
  const facts = document.createElement('dl');
  facts.className = 'grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]';
  facts.append(factLabel('Outcome'), factValue(card.status), factLabel('3DS code'));
  const code = document.createElement('dd');
  code.append(
    copyValue({
      id: `${card.id}-threeDS`,
      label: 'Copy 3DS code',
      value: card.threeDS,
      copied,
      className: 'font-mono tracking-[0.08em]',
      onCopy,
    }),
  );
  facts.append(code);
  const copyAll = document.createElement('button');
  copyAll.type = 'button';
  copyAll.className = 'justify-self-start text-[13px] font-semibold text-[#5b35d5] dark:text-[#c4b5fd]';
  copyAll.textContent =
    copied === `${card.id}-all` ? 'Copied number, expiry, CVV, and 3DS' : 'Copy all fields';
  copyAll.addEventListener('click', () => onCopy(`${card.id}-all`, testCardLine(card)));
  body.append(chips, detail, facts, copyAll);
  article.append(face, body);
  return article;
}

function metaChip(text: string): HTMLSpanElement {
  const chipNode = document.createElement('span');
  chipNode.className =
    'rounded-full bg-[#f4f3fb] px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-black/60 uppercase dark:bg-white/8 dark:text-zinc-300';
  chipNode.textContent = text;
  return chipNode;
}

function factLabel(text: string): HTMLElement {
  const term = document.createElement('dt');
  term.className = 'text-black/45 dark:text-zinc-500';
  term.textContent = text;
  return term;
}

function factValue(text: string): HTMLElement {
  const value = document.createElement('dd');
  value.className = 'font-semibold';
  value.textContent = text;
  return value;
}

function cardChip(): HTMLSpanElement {
  const chipNode = document.createElement('span');
  chipNode.className =
    'grid h-8 w-11 grid-cols-2 overflow-hidden rounded-md bg-gradient-to-br from-[#f6e7b2] to-[#b8923e] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18)]';
  chipNode.setAttribute('aria-hidden', 'true');
  for (const className of [
    'border-r border-b border-black/25',
    'border-b border-black/25',
    'border-r border-black/25',
    '',
  ]) {
    const cell = document.createElement('span');
    if (className) cell.className = className;
    chipNode.append(cell);
  }
  return chipNode;
}

function brandLogo(brand: string, visa: boolean): HTMLSpanElement {
  const frame = document.createElement('span');
  frame.className = 'grid h-8 place-items-center rounded-lg bg-white px-2';
  const image = document.createElement('img');
  image.src = visa ? '/assets/visa-logo.svg' : '/assets/mastercard-logo.svg';
  image.alt = brand;
  image.className = 'h-[18px] w-auto';
  frame.append(image);
  return frame;
}

function copyValue({
  id,
  label,
  caption,
  value,
  copied,
  className,
  onCopy,
}: {
  id: string;
  label: string;
  caption?: string;
  value: string;
  copied: string | null;
  className?: string;
  onCopy: (id: string, value: string) => void;
}): HTMLButtonElement {
  const justCopied = copied === id;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `grid text-left ${className ?? ''}`;
  button.setAttribute('aria-label', label);
  if (caption || justCopied) {
    const cap = document.createElement('span');
    cap.className = 'text-[10px] font-bold tracking-[0.12em] uppercase opacity-70';
    cap.textContent = justCopied ? 'Copied' : caption ?? '';
    button.append(cap);
  }
  const strong = document.createElement('strong');
  strong.className = 'font-semibold';
  strong.textContent = value;
  button.append(strong);
  button.addEventListener('click', () => onCopy(id, value));
  return button;
}

function addDetail(host: HTMLElement, label: string, value: string, mono = false): void {
  if (!value) return;
  const row = cloneTemplate<HTMLElement>('detail-row-template');
  required<HTMLElement>(row, 'dt').textContent = label;
  const valueCell = required<HTMLElement>(row, 'dd');
  valueCell.textContent = value;
  if (mono) valueCell.classList.add('font-mono', 'text-xs', 'break-all');
  host.append(row);
}

function formatAmount(amount: unknown, currency: unknown): string {
  const number = Number(amount);
  const code = text(currency);
  if (!Number.isFinite(number) || !code) return text(amount);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(number);
}

function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function methodLabel(method: string): string {
  return (
    {
      paymentForm: 'Payment form',
      paymentCard: 'Payment card',
      applePay: 'Apple Pay',
      googlePay: 'Google Pay',
    }[method] ?? method
  );
}

function methodIcon(method: string): HTMLElement {
  const frame = document.createElement('span');
  frame.className = 'flex h-5 w-7 shrink-0 items-center justify-center overflow-hidden';
  if (method === 'applePay' || method === 'googlePay') {
    const image = document.createElement('img');
    image.src =
      method === 'applePay' ? '/assets/Apple_Pay_Mark_RGB_041619.svg' : '/assets/google-pay-mark_800.svg';
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.className = 'h-5 w-7 max-w-full object-contain';
    frame.append(image);
    return frame;
  }
  const pay = method === 'paymentForm';
  frame.innerHTML = `<svg viewBox="0 0 28 20" class="h-5 w-7" fill="none" aria-hidden="true"><rect x="1.25" y="1.25" width="25.5" height="17.5" rx="3" stroke="currentColor" stroke-width="1.5" /><path d="M1.5 7h25" stroke="currentColor" stroke-width="1.5" />${
    pay
      ? '<rect x="16" y="12" width="8" height="3.5" rx="1.75" fill="currentColor" />'
      : '<path d="M4.5 14h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />'
  }</svg>`;
  return frame;
}

export type PaymentOutcome =
  | { kind: 'complete'; transaction: TransactionDetails }
  | { kind: 'error'; message: string };
