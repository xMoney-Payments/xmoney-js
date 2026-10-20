export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'xmoney-example-theme';

const listeners = new Set<(mode: ThemeMode) => void>();

let mode: ThemeMode = readStored();

export function getTheme(): ThemeMode {
  return mode;
}

export function applyStoredTheme(): void {
  document.documentElement.dataset.theme = mode;
}

export function subscribeTheme(listener: (mode: ThemeMode) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function toggleTheme(): void {
  setTheme(mode === 'dark' ? 'light' : 'dark');
}

function setTheme(next: ThemeMode): void {
  mode = next;
  document.documentElement.dataset.theme = next;
  localStorage.setItem(STORAGE_KEY, next);
  for (const listener of listeners) listener(next);
}

function readStored(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}
