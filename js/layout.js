import { getPath, fetchText, getCurrentPageKey } from './utils.js';

async function mountLayoutComponent(selector, path) {
  const mountPoint = document.querySelector(selector);
  if (!mountPoint) return;

  let html = await fetchText(path);
  const isPagesDir = window.location.pathname.includes('/pages/');
  const basePath = isPagesDir ? '../' : '';
  const pagesPath = isPagesDir ? '' : 'pages/';

  html = html.replace(/\{\{BASE_PATH\}\}/g, basePath);
  html = html.replace(/\{\{PAGES_PATH\}\}/g, pagesPath);
  mountPoint.outerHTML = html;
}

function setActiveNavigation() {
  const currentPage = getCurrentPageKey();
  document.querySelectorAll('.main-nav a[data-page]').forEach((link) => {
    const isActive = link.dataset.page === currentPage;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

export async function loadLayoutComponents() {
  await Promise.all([
    mountLayoutComponent('#site-header', getPath('components/header.html')),
    mountLayoutComponent('#site-footer', getPath('components/footer.html')),
  ]);
  setActiveNavigation();
}

export function wireMobileMenu() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (!header || !toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}
