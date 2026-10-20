import { startRouter } from './router';
import { applyStoredTheme, getTheme, subscribeTheme, toggleTheme } from './theme';

applyStoredTheme();

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest('[data-theme-toggle]')) toggleTheme();
});

function updateThemeButton() {
  const label = getTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  for (const button of document.querySelectorAll('[data-theme-toggle]')) {
    button.setAttribute('aria-label', label);
  }
}

subscribeTheme(updateThemeButton);
updateThemeButton();
startRouter();
