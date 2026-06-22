import { supabase } from '../supabase-config.js';
import { getPath, escapeHtml, formatPostDatePtBr, normalizeCategoryValue, formatCategoryLabel, slugifyHeading, getCurrentPageKey } from './utils.js';
import { getIntegrantesIndex, resolveAuthorNames, buildIntegranteProfileUrl } from './authors.js';

function buildPostTocAndHtml(markdownBody) {
  if (!window.marked || typeof window.marked.parse !== 'function') {
    return { html: `<pre>${escapeHtml(markdownBody)}</pre>`, toc: [] };
  }
  const rawHtml = window.marked.parse(markdownBody);
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const usedSlugs = new Set();
  const toc = [];
  doc.querySelectorAll('h2, h3').forEach((heading) => {
    const headingText = heading.textContent ? heading.textContent.trim() : '';
    const slug = slugifyHeading(headingText, usedSlugs);
    heading.setAttribute('id', slug);
    toc.push({ id: slug, label: headingText, level: heading.tagName.toLowerCase() === 'h3' ? 3 : 2 });
  });
  return { html: doc.body.innerHTML, toc };
}

function buildTocListMarkup(tocItems) {
  if (!tocItems.length) return '<p class="preview-meta">Sem seções neste artigo.</p>';
  return `<ul class="post-toc-list">${tocItems.map(item => `<li class="toc-level-${item.level}"><a href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a></li>`).join('')}</ul>`;
}

function buildPostCard(post) {
  const categoryTokens = post.categories.join('|');
  const categoryLabelText = post.categoryLabels.join(' • ');
  const authorsText = post.authorLinks.length
    ? post.authorLinks.map(a => a.url ? `<a href="${a.url}" class="relative z-20 hover:text-primary transition-colors">${escapeHtml(a.name)}</a>` : escapeHtml(a.name)).join(', ')
    : '';

  return `
    <article class="post-card group relative grid grid-cols-1 md:grid-cols-12 gap-6 items-start py-10 border-b border-gray-200 dark:border-gray-800 last:border-0" data-categories="${escapeHtml(categoryTokens)}" data-href="${getPath('pages/post.html?slug=')}${encodeURIComponent(post.slug)}">
      <a class="absolute inset-0 z-10" href="${getPath('pages/post.html?slug=')}${encodeURIComponent(post.slug)}" aria-label="${escapeHtml(post.title)}"></a>
      <div class="col-span-1 md:col-span-2 flex flex-col md:text-right pt-1">
        <time class="font-sans text-sm font-bold text-gray-900 dark:text-gray-100">${escapeHtml(post.date)}</time>
        <span class="font-sans text-xs font-bold uppercase tracking-widest text-primary mt-1">${escapeHtml(categoryLabelText)}</span>
      </div>
      <div class="col-span-1 md:col-span-7">
        <h2 class="font-serif text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors leading-tight mb-4">${escapeHtml(post.title)}</h2>
        <p class="font-sans text-base text-gray-600 dark:text-gray-400 leading-relaxed">${escapeHtml(post.excerpt)}</p>
        ${authorsText ? `<p class="font-sans text-sm font-semibold text-gray-500 mt-4">Por: ${authorsText}</p>` : ''}
      </div>
      <div class="col-span-1 md:col-span-3">
        <img src="${escapeHtml(post.image || getPath('posts/img/place-holder.png'))}" alt="Capa do post: ${escapeHtml(post.title)}" class="${post.image ? 'w-full aspect-[4/3] object-cover rounded shadow-sm grayscale group-hover:grayscale-0 transition-all duration-500' : 'w-full aspect-[4/3] object-contain rounded opacity-80 dark:invert dark:opacity-50 transition-all duration-500'}">
      </div>
    </article>
  `;
}

function buildDynamicFilters(posts) {
  const filtersContainer = document.querySelector('#blog-filters');
  if (!filtersContainer) return;
  const categoryMap = new Map();
  posts.forEach((post) => {
    post.categories.forEach((category, index) => {
      if (!categoryMap.has(category)) categoryMap.set(category, post.categoryLabels[index] || category);
    });
  });
  const categoryButtons = [...categoryMap.entries()].map(([cat, label]) =>
    `<button class="filter px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors rounded-none" data-filter="${escapeHtml(cat)}">${escapeHtml(label)}</button>`
  ).join('');
  filtersContainer.innerHTML = `<button class="filter active px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors rounded-none" data-filter="all">Todos</button>${categoryButtons}`;
}

function wireFilters() {
  const filters = document.querySelectorAll('.filter');
  const posts = document.querySelectorAll('.post-card');
  if (!filters.length || !posts.length) return;
  filters.forEach((button) => {
    button.addEventListener('click', () => {
      filters.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const selected = button.dataset.filter;
      posts.forEach((post) => {
        const categories = (post.dataset.categories || '').split('|').filter(Boolean);
        post.style.display = (selected === 'all' || categories.includes(selected)) ? '' : 'none';
      });
    });
  });
}

async function loadPostsList(tipoFilter) {
  const grid = document.querySelector('#posts-grid');
  if (!grid) return;
  try {
    const { data, error } = await supabase.from('posts').select('*');
    if (error) throw error;
    const integrantesIndex = await getIntegrantesIndex();
    const filtered = (data || []).filter(p => {
      if (tipoFilter === 'artigo') return p.tipo === 'artigo' || p.tipo === 'blog';
      if (tipoFilter === 'notícia') return p.tipo === 'notícia' || p.tipo === 'noticia';
      return true;
    });
    const posts = filtered.map(post => {
      const categoriesRaw = post.categorias || [];
      const categories = categoriesRaw.map(normalizeCategoryValue);
      const categoryLabels = categoriesRaw.map(formatCategoryLabel);
      const authorLinks = resolveAuthorNames([post.autor], integrantesIndex).map(a => ({
        ...a, url: a.slug ? buildIntegranteProfileUrl(a.slug) : '',
      }));
      return {
        slug: post.id, categories, categoryLabels, authorLinks,
        date: formatPostDatePtBr(post.data),
        sortTs: Date.parse(String(post.data)) || 0,
        title: post.titulo || 'Sem título',
        excerpt: post.resumo || 'Sem resumo.',
        image: String(post.poster || '').trim(),
      };
    });
    const sorted = [...posts].sort((a, b) => b.sortTs - a.sortTs);
    buildDynamicFilters(sorted);
    grid.innerHTML = sorted.map(buildPostCard).join('');
    wireFilters();
  } catch (error) {
    grid.innerHTML = '<article class="post-card"><p class="preview-meta">Erro</p><h2>Não foi possível carregar os posts</h2></article>';
    console.error(error);
  }
}

export async function loadBlogList() {
  if (getCurrentPageKey() !== 'blog') return;
  await loadPostsList('artigo');
}

export async function loadNoticiasList() {
  if (getCurrentPageKey() !== 'noticias') return;
  await loadPostsList('notícia');
}

export async function loadPostPage() {
  const article = document.querySelector('#post-content');
  if (!article) return;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) { article.innerHTML = '<h1>Publicação não encontrada</h1>'; return; }

  try {
    const { data: post, error } = await supabase.from('posts').select('*').eq('id', slug).single();
    if (error || !post) { article.innerHTML = '<h1>Publicação não encontrada</h1>'; return; }
    const integrantesIndex = await getIntegrantesIndex();
    const title = post.titulo || 'Sem título';
    const categoriesRaw = post.categorias || [];
    const categoryLabels = categoriesRaw.map(formatCategoryLabel);
    const authorLinks = resolveAuthorNames([post.autor], integrantesIndex).map(a => ({
      ...a, url: a.slug ? buildIntegranteProfileUrl(a.slug) : '',
    }));
    const date = formatPostDatePtBr(post.data);
    const excerpt = post.resumo || '';
    const image = String(post.poster || '').trim();
    const tocResult = buildPostTocAndHtml(post.conteudo || '');
    const tocList = buildTocListMarkup(tocResult.toc);
    const isNews = post.tipo === 'notícia' || post.tipo === 'noticia';
    const backText = isNews ? 'Voltar para Notícias' : 'Voltar para o Blog';
    const backUrl = isNews ? getPath('pages/noticias.html') : getPath('pages/blog.html');

    document.title = `${title} | OEDLA`;
    article.innerHTML = `
      <div class="mb-12">
        <p class="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-6"><a href="${backUrl}" class="hover:text-gray-900 dark:hover:text-white transition-colors">&larr; ${backText}</a></p>
        <div class="flex items-center gap-3 mb-6">
          <time class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">${escapeHtml(date)}</time>
          <span class="w-1 h-1 rounded-full bg-primary"></span>
          <span class="font-sans text-xs font-bold uppercase tracking-widest text-primary">${escapeHtml(categoryLabels.join(' • '))}</span>
        </div>
        <h1 class="font-serif text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-8">${escapeHtml(title)}</h1>
        ${authorLinks.length ? `<p class="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">Por: ${authorLinks.map(a => a.url ? `<a href="${a.url}" class="text-gray-900 dark:text-white hover:text-primary transition-colors">${escapeHtml(a.name)}</a>` : escapeHtml(a.name)).join(', ')}</p>` : ''}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div class="lg:col-span-8 flex flex-col">
          ${image ? `<div class="mb-10 w-full"><img src="${escapeHtml(image)}" alt="Capa do post: ${escapeHtml(title)}" class="w-full h-auto aspect-video object-cover rounded grayscale hover:grayscale-0 transition-all duration-500 shadow-md"></div>` : ''}
          <p class="font-serif text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed italic mb-12 border-l-4 border-primary pl-6">${escapeHtml(excerpt)}</p>
          <details class="lg:hidden mb-12 border border-gray-200 dark:border-gray-800 rounded p-4">
            <summary class="font-sans text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white cursor-pointer">Sumário do artigo</summary>
            <div class="mt-4 font-sans text-sm text-gray-600 dark:text-gray-400">${tocList}</div>
          </details>
          <div class="post-markdown max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-sans text-lg">${tocResult.html}</div>
          <p class="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 font-sans text-sm font-bold uppercase tracking-widest"><a href="${backUrl}" class="hover:text-primary transition-colors">&larr; ${backText}</a></p>
        </div>
        <aside class="hidden lg:block lg:col-span-4 sticky top-32" aria-label="Sumário do artigo">
          <h2 class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">Sumário</h2>
          <div class="font-sans text-sm text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800 pl-6">${tocList}</div>
        </aside>
      </div>
    `;
  } catch (error) {
    article.innerHTML = '<h1>Erro ao carregar a publicação</h1>';
    console.error(error);
  }
}
