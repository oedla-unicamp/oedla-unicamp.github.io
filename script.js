import { loadLayoutComponents, wireMobileMenu } from './js/layout.js';
import { wireThemeToggle } from './js/theme.js';
import { getCurrentPageKey } from './js/utils.js';

async function initPage() {
  try {
    await loadLayoutComponents();
  } catch (error) {
    console.error('Falha ao carregar componentes de layout.', error);
  }

  wireMobileMenu();
  wireThemeToggle();

  const page = getCurrentPageKey();

  // Load only the modules needed for the current page
  const loaders = [];

  // Social links appear on all pages (header/footer)
  const { loadLabSocialLinks, loadHeroDynamic, loadBlogPageInfo, loadQuemSomosDynamic } = await import('./js/info.js');
  loaders.push(loadLabSocialLinks());

  if (page === 'home') {
    loaders.push(loadHeroDynamic());
    const { loadHomeLatestPosts } = await import('./js/home.js');
    loaders.push(loadHomeLatestPosts());
    const { loadHomeEventos } = await import('./js/eventos.js');
    loaders.push(loadHomeEventos());
  }

  if (page === 'blog' || page === 'noticias') {
    loaders.push(loadBlogPageInfo());
    const { loadBlogList, loadNoticiasList } = await import('./js/posts.js');
    if (page === 'blog') loaders.push(loadBlogList());
    if (page === 'noticias') loaders.push(loadNoticiasList());
  }

  if (page === 'post') {
    const { loadPostPage } = await import('./js/posts.js');
    loaders.push(loadPostPage());
  }

  if (page === 'about') {
    loaders.push(loadQuemSomosDynamic());
    const { loadIntegrantesPage } = await import('./js/authors.js');
    loaders.push(loadIntegrantesPage());
  }

  if (page === 'integrante' || page === 'about') {
    const { loadIntegranteProfilePage } = await import('./js/authors.js');
    loaders.push(loadIntegranteProfilePage());
  }

  if (page === 'eventos') {
    const { loadEventosList } = await import('./js/eventos.js');
    loaders.push(loadEventosList());
  }

  if (page === 'evento') {
    const { loadEventoPage } = await import('./js/eventos.js');
    loaders.push(loadEventoPage());
  }

  await Promise.all(loaders);
}

initPage();