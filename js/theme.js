const THEME_STORAGE_KEY = 'oedla-theme';
const BACKGROUND_STORAGE_KEY = 'oedla-bg-image';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';
const BACKGROUND_LIGHT_PATH = 'assets/img/background-light.png';
const BACKGROUND_DARK_PATH = 'assets/img/background-dark.png';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_DARK : THEME_LIGHT;
}

function getStoredTheme() {
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === THEME_DARK || value === THEME_LIGHT ? value : '';
}

function updateThemeToggleUi(theme) {
  const isDark = theme === THEME_DARK;
  document.querySelectorAll('.theme-toggle').forEach((button) => {
    button.setAttribute('aria-pressed', String(isDark));
    const actionLabel = isDark ? 'Ativar modo claro' : 'Ativar modo escuro';
    button.setAttribute('aria-label', actionLabel);
    button.setAttribute('title', actionLabel);
  });
}

function getBackgroundPathForTheme(theme) {
  return theme === THEME_DARK ? BACKGROUND_DARK_PATH : BACKGROUND_LIGHT_PATH;
}

function applyBackgroundPath(path) {
  const safePath = String(path || '').trim() || BACKGROUND_LIGHT_PATH;
  document.documentElement.style.setProperty('--page-bg-image', `url('${safePath}')`);
}

function persistBackgroundPath(path) {
  try { window.localStorage.setItem(BACKGROUND_STORAGE_KEY, path); } catch (_) {}
}

function applyTheme(theme) {
  const safeTheme = theme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
  const backgroundPath = getBackgroundPathForTheme(safeTheme);
  document.documentElement.setAttribute('data-theme', safeTheme);
  applyBackgroundPath(backgroundPath);
  persistBackgroundPath(backgroundPath);
  updateThemeToggleUi(safeTheme);
}

export function wireThemeToggle() {
  const toggles = document.querySelectorAll('.theme-toggle');
  if (!toggles.length) return;

  const initialTheme = getStoredTheme() || getSystemTheme();
  applyTheme(initialTheme);

  toggles.forEach((button) => {
    button.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || THEME_LIGHT;
      const nextTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
      applyTheme(nextTheme);
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    });
  });

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', () => {
    if (!getStoredTheme()) applyTheme(getSystemTheme());
  });
}
