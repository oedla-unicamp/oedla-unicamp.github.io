import { supabase } from '../supabase-config.js';
import { getPath, escapeHtml, formatPostDatePtBr, normalizeCategoryValue, formatCategoryLabel, normalizeAuthorKey } from './utils.js';
import { buildLabSocialLinks } from './social.js';

// Cache for info_oedla singleton
let infoOedlaCache = null;

export async function getInfoOedla() {
  if (infoOedlaCache) return infoOedlaCache;
  const { data, error } = await supabase.from('info_oedla').select('*').eq('id', 'main').single();
  if (error) { console.error('Erro ao carregar info_oedla:', error); return null; }
  infoOedlaCache = data;
  return data;
}

export async function loadLabSocialLinks() {
  const containers = document.querySelectorAll('#labiia-social-links');
  if (!containers.length) return;
  try {
    const info = await getInfoOedla();
    const redes = info?.redes_sociais || [];
    const html = buildLabSocialLinks(redes);
    containers.forEach((c) => { c.innerHTML = html; });
  } catch (error) {
    containers.forEach((c) => { c.innerHTML = '<p class="preview-meta">Não foi possível carregar as redes do OEDLA.</p>'; });
    console.error(error);
  }
}

export async function loadHeroDynamic() {
  const heroKeywords = document.querySelector('#hero-keywords');
  const heroTitle = document.querySelector('#hero-title');
  const heroSubtitle = document.querySelector('#hero-subtitle');
  if (!heroKeywords && !heroTitle && !heroSubtitle) return;

  try {
    const info = await getInfoOedla();
    if (!info) return;
    if (heroKeywords) heroKeywords.textContent = info.keywords || '';
    if (heroTitle) {
      const rawTitle = info.titulo || '';
      if (rawTitle.toLowerCase().includes('observatório da') && rawTitle.toLowerCase().includes('extrema direita')) {
        const part1 = "Observatório da";
        const part2 = "Extrema Direita";
        let part3 = rawTitle.slice(rawTitle.toLowerCase().indexOf('extrema direita') + part2.length).trim();
        if (part3.startsWith('-')) part3 = part3.slice(1).trim();
        
        heroTitle.innerHTML = `
          <span class="block font-archivo-narrow text-3xl sm:text-4xl md:text-5xl font-medium tracking-[0.18em] mb-2">Observatório da</span>
          <span class="block font-archivo-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight leading-none mb-1 text-white whitespace-nowrap">Extrema Direita</span>
          <span class="block font-archivo-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight leading-none text-white whitespace-nowrap">${part3}</span>
        `;
      } else {
        heroTitle.textContent = rawTitle;
      }
    }
    if (heroSubtitle) heroSubtitle.textContent = info.subtitulo || '';
  } catch (e) { console.error(e); }
}

export async function loadBlogPageInfo() {
  const kwEl = document.querySelector('#page-keywords');
  const subEl = document.querySelector('#page-subtitle');
  if (!kwEl && !subEl) return;
  try {
    const info = await getInfoOedla();
    if (!info) return;
    const page = document.body?.dataset?.page;
    if (page === 'blog') {
      if (kwEl) kwEl.textContent = info.blog_keywords || '';
      if (subEl) subEl.textContent = info.blog_subtitulo || '';
    } else if (page === 'noticias') {
      if (kwEl) kwEl.textContent = info.noticias_keywords || '';
      if (subEl) subEl.textContent = info.noticias_subtitulo || '';
    }
  } catch (e) { console.error(e); }
}

export async function loadQuemSomosDynamic() {
  const qsContainer = document.querySelector('#qs-quem-somos');
  const orContainer = document.querySelector('#qs-nossa-origem');
  const atContainer = document.querySelector('#qs-atividades');
  const msContainer = document.querySelector('#qs-missao');
  if (!qsContainer && !orContainer && !atContainer && !msContainer) return;

  try {
    const info = await getInfoOedla();
    if (!info) return;

    if (qsContainer && info.quem_somos?.paragrafos) {
      qsContainer.innerHTML = info.quem_somos.paragrafos.map(p => `<p>${escapeHtml(p)}</p>`).join('');
    }
    if (orContainer && info.nossa_origem?.paragrafos) {
      orContainer.innerHTML = info.nossa_origem.paragrafos.map((p, i) => {
        if (i === 0) return `<p class="font-sans text-xl text-gray-800 dark:text-gray-200 font-medium mb-6"><em class="italic font-serif">${escapeHtml(p)}</em></p>`;
        return `<p class="font-sans text-lg text-gray-600 dark:text-gray-400 leading-relaxed">${escapeHtml(p)}</p>`;
      }).join('');
    }
    if (atContainer && info.atividades?.paragrafos) {
      atContainer.innerHTML = info.atividades.paragrafos.map(p => `<p>${escapeHtml(p)}</p>`).join('');
    }
    if (msContainer && info.atividades?.missao) {
      msContainer.innerHTML = info.atividades.missao.map(item => `
        <div>
          <h3 class="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-2">${escapeHtml(item.titulo)}</h3>
          <p class="font-sans text-base text-gray-600 dark:text-gray-400">${escapeHtml(item.descricao)}</p>
        </div>
      `).join('');
    }
  } catch (e) { console.error(e); }
}
