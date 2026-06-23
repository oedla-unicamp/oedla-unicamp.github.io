import { supabase } from '../supabase-config.js';
import { escapeHtml, normalizeAuthorKey, updateMetaTags } from './utils.js';
import { buildImportantLinks } from './social.js';

let integrantesIndexPromise;

export async function getIntegrantesIndex() {
  if (integrantesIndexPromise) return integrantesIndexPromise;
  integrantesIndexPromise = (async () => {
    try {
      const { data, error } = await supabase.from('authors').select('*');
      if (error) throw error;
      return new Map((data || []).map(a => [a.id, a]));
    } catch (e) { console.error(e); return new Map(); }
  })();
  return integrantesIndexPromise;
}

export function buildIntegranteProfileUrl(slug) {
  return `integrante.html?slug=${encodeURIComponent(slug)}`;
}

export function resolveAuthorNames(authorValues, integrantesIndex) {
  return authorValues.map((authorValue) => {
    const key = normalizeAuthorKey(authorValue);
    const integrante = integrantesIndex.get(key);
    if (integrante && (integrante.nome || integrante.Nome)) {
      return { slug: key, name: String(integrante.nome || integrante.Nome) };
    }
    return { slug: '', name: String(authorValue).trim() };
  });
}

function buildIntegranteCard(person) {
  const nome = escapeHtml(person.nome || 'Sem Nome');
  const cargo = escapeHtml(person.cargo || '');
  const formacao = escapeHtml(person.formacao || '');
  const imagem = escapeHtml(person.foto || '');
  const links = buildImportantLinks(person.links || []);
  const slug = String(person.id || '').trim();
  const profileUrl = slug ? buildIntegranteProfileUrl(slug) : '';
  const nameMarkup = profileUrl
    ? `<a class="relative z-20 hover:text-primary transition-colors" href="${profileUrl}" aria-label="Ver perfil de ${nome}"><h2 class="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100">${nome}</h2></a>`
    : `<h2 class="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100">${nome}</h2>`;
  const imageMarkup = imagem
    ? (profileUrl
      ? `<a class="relative z-20 block w-20 h-20 md:w-24 md:h-24 shrink-0" href="${profileUrl}" aria-hidden="true" tabindex="-1"><img class="w-full h-full object-cover rounded-full transition-all duration-500" src="${imagem}" alt="Foto de ${nome}" loading="lazy"></a>`
      : `<img class="w-20 h-20 md:w-24 md:h-24 shrink-0 object-cover rounded-full" src="${imagem}" alt="Foto de ${nome}" loading="lazy">`)
    : `<div class="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-gray-200 dark:bg-gray-800"></div>`;

  return `
    <article class="group relative flex items-start gap-6 py-8 border-b border-gray-200 dark:border-gray-800 last:border-0">
      ${profileUrl ? `<a class="absolute inset-0 z-10" href="${profileUrl}" aria-label="${nome}"></a>` : ''}
      ${imageMarkup}
      <div class="flex flex-col gap-2">
        ${nameMarkup}
        <p class="font-sans text-xs md:text-sm font-bold uppercase tracking-widest text-primary">${cargo} • ${formacao}</p>
        <div class="relative z-20 mt-2">${links}</div>
      </div>
    </article>
  `;
}

export async function loadIntegrantesPage() {
  const grid = document.querySelector('#integrantes-grid');
  if (!grid) return;
  try {
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .order('nome', { ascending: true });
    if (error) throw error;
    grid.innerHTML = (data || []).map(buildIntegranteCard).join('');
  } catch (error) {
    grid.innerHTML = '<article class="post-card"><p class="preview-meta">Erro</p><h2>Não foi possível carregar os integrantes</h2></article>';
    console.error(error);
  }
}

export async function loadIntegranteProfilePage() {
  const container = document.querySelector('#integrante-profile');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = normalizeAuthorKey(params.get('slug') || '');
  if (!slug) { container.innerHTML = '<h1>Integrante não encontrado</h1>'; return; }

  const integrantesIndex = await getIntegrantesIndex();
  const integrante = integrantesIndex.get(slug);
  if (!integrante) { container.innerHTML = '<h1>Integrante não encontrado</h1>'; return; }

  const { getPath } = await import('./utils.js');
  const nome = escapeHtml(integrante.nome || 'Integrante');
  const cargo = escapeHtml(integrante.cargo || '');
  const formacao = escapeHtml(integrante.formacao || '');
  const minibiografia = escapeHtml(integrante.minibiografia || '');
  const imagem = escapeHtml(integrante.foto || '');
  const links = buildImportantLinks(integrante.links || []);

  const { data: postsData } = await supabase.from('posts').select('*').eq('autor', slug);
  const { formatPostDatePtBr, formatCategoryLabel } = await import('./utils.js');
  const authoredPosts = (postsData || []).map(post => ({
    slug: post.id,
    title: post.titulo || 'Sem título',
    date: formatPostDatePtBr(post.data),
    excerpt: post.resumo || 'Sem resumo.',
    categoryLabels: (post.categorias || []).map(formatCategoryLabel),
  }));

  const postsMarkup = authoredPosts.length ? `
    <section class="mt-20 pt-10 border-t border-gray-200 dark:border-gray-800">
      <h2 class="font-serif text-3xl font-bold text-gray-900 dark:text-white">Publicações do Autor</h2>
      <div class="flex flex-col gap-0 border-t border-gray-200 dark:border-gray-800 mt-8 pt-8">
        ${authoredPosts.map(post => `
          <article class="group relative py-8 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0 flex flex-col items-start">
            <a class="absolute inset-0 z-10" href="${getPath('pages/post.html?slug=')}${encodeURIComponent(post.slug)}" aria-label="${escapeHtml(post.title)}"></a>
            <div class="flex items-center gap-3 mb-3">
              <time class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">${escapeHtml(post.date)}</time>
              <span class="w-1 h-1 rounded-full bg-primary"></span>
              <span class="font-sans text-xs font-bold uppercase tracking-widest text-primary">${escapeHtml(post.categoryLabels.join(' • '))}</span>
            </div>
            <h3 class="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors leading-tight mb-2">${escapeHtml(post.title)}</h3>
            <p class="font-sans text-sm text-gray-600 dark:text-gray-400">${escapeHtml(post.excerpt)}</p>
          </article>
        `).join('')}
      </div>
    </section>
  ` : '';

  updateMetaTags({
    title: `${nome} | OEDLA`,
    description: minibiografia || `Membro da equipe do OEDLA: ${nome} (${cargo} - ${formacao})`,
    image: imagem || null,
    url: window.location.href
  });
  container.innerHTML = `
    <div class="mb-12">
      <p class="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-6"><a href="${getPath('pages/quemsomos.html')}" class="hover:text-gray-900 dark:hover:text-white transition-colors">&larr; Voltar para Equipe</a></p>
      <div class="flex flex-col md:flex-row items-center md:items-start gap-8">
        ${imagem ? `<div class="w-32 h-32 md:w-48 md:h-48 shrink-0"><img class="w-full h-full object-cover rounded-full transition-all duration-500 shadow-md" src="${imagem}" alt="Foto de ${nome}" loading="lazy"></div>` : '<div class="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-full bg-gray-200 dark:bg-gray-800 shadow-md"></div>'}
        <div class="flex flex-col items-center md:items-start text-center md:text-left">
          <h1 class="font-serif text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">${nome}</h1>
          <p class="font-sans text-sm md:text-base font-bold uppercase tracking-widest text-primary mt-2">${cargo}${cargo && formacao ? ' • ' : ''}${formacao}</p>
          <div class="mt-6 flex gap-3 relative z-20">${links}</div>
        </div>
      </div>
    </div>
    <div class="font-sans text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl border-t border-gray-200 dark:border-gray-800 pt-10">
      ${minibiografia ? `<p>${minibiografia}</p>` : ''}
    </div>
    ${postsMarkup}
  `;
}
