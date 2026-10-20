import { mountPage, type PageCleanup } from './pages';
import { loadTemplates, required } from './templates';

const routes: Record<string, string> = {
  '/': 'payment-form',
  '/embedded': 'payment-card',
  '/pay-with-card': 'pay-with-card',
  '/wallets': 'wallets',
  '/lumen': 'lumen',
  '/hearth': 'hearth',
  '/pulse': 'pulse',
  '/merchant-pay': 'merchant-pay',
  '/update-order': 'update-order',
  '/cardholder': 'cardholder',
  '/playground': 'playground',
};

let stopPage: PageCleanup | null = null;
let navigation = 0;

export function startRouter(): void {
  document.addEventListener('click', onDocumentClick);
  window.addEventListener('popstate', () => void renderRoute());
  void renderRoute();
}

export function navigate(path: string, state: Record<string, unknown> = {}): void {
  history.pushState(state, '', path);
  void renderRoute();
}

async function renderRoute(): Promise<void> {
  const id = ++navigation;
  const wide = window.matchMedia('(min-width: 1181px)').matches;
  const mobileMenu = required<HTMLElement>(document, '#mobile-menu');
  const shell = required<HTMLElement>(document, '#app-shell');

  if (location.pathname === '/menu' && !wide) {
    stopPage?.();
    stopPage = null;
    shell.hidden = true;
    mobileMenu.hidden = false;
    buildMobileMenu();
    markActive();
    return;
  }

  if (location.pathname === '/menu' && wide) {
    history.replaceState({}, '', '/');
  }
  const route = routes[location.pathname];
  if (!route) {
    history.replaceState({}, '', '/');
    return renderRoute();
  }
  if (
    location.pathname === '/' &&
    !wide &&
    !(history.state && typeof history.state === 'object' && history.state.fromMenu === true)
  ) {
    history.replaceState({}, '', '/menu');
    return renderRoute();
  }

  shell.hidden = false;
  mobileMenu.hidden = true;
  const outlet = required<HTMLElement>(document, '#outlet');
  stopPage?.();
  stopPage = null;
  outlet.replaceChildren();
  outlet.textContent = 'Loading example…';
  outlet.className =
    'my-3 rounded-xl bg-[#f4f3fb] px-3 py-2.5 text-sm text-black/55 dark:bg-white/6 dark:text-zinc-400';

  const [response] = await Promise.all([fetch(`/pages/${route}.html`), loadTemplates()]);
  if (id !== navigation) return;
  if (!response.ok) throw new Error(`Could not load page (${response.status})`);
  outlet.className = '';
  outlet.innerHTML = await response.text();
  if (id !== navigation) return;
  stopPage = mountPage(outlet);
  markActive();
}

function onDocumentClick(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const anchor = target.closest<HTMLAnchorElement>('a[data-route]');
  if (!anchor) return;
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return;
  event.preventDefault();
  navigate(url.pathname, anchor.dataset.fromMenu === 'true' ? { fromMenu: true } : {});
}

const NAV_LINK =
  'flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-sm font-semibold text-inherit no-underline';

function markActive(): void {
  for (const anchor of document.querySelectorAll<HTMLAnchorElement>('#sidebar a[data-route], #mobile-menu a[data-route]')) {
    const active = anchor.pathname === location.pathname;
    anchor.className = active ? `${NAV_LINK} bg-[#7c4dff]/10` : NAV_LINK;
  }
}

function buildMobileMenu(): void {
  const source = required<HTMLElement>(document, '#menu-panel');
  const target = required<HTMLElement>(document, '#mobile-menu-content');
  target.replaceChildren(source.cloneNode(true));
  for (const anchor of target.querySelectorAll<HTMLAnchorElement>('a[data-route]')) {
    anchor.dataset.fromMenu = 'true';
  }
  target.querySelector('#theme-toggle')?.removeAttribute('id');
  const label =
    document.documentElement.dataset.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  for (const button of target.querySelectorAll('[data-theme-toggle]')) {
    button.setAttribute('aria-label', label);
  }
}
