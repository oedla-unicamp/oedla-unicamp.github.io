import { supabase } from '../supabase-config.js';
import { getPath, escapeHtml, formatPostDatePtBr, getCurrentPageKey, updateMetaTags } from './utils.js';
import DOMPurify from 'https://esm.sh/dompurify';

function buildEventoHomeCard(evento) {
  const dateStr = formatPostDatePtBr(evento.data);
  const capaUrl = evento.capa || getPath('posts/img/place-holder.png');
  const detailsUrl = getPath('pages/evento.html?slug=') + encodeURIComponent(evento.id);
  
  return `
    <article class="flex flex-col gap-4 p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-all duration-300">
      <div class="w-full aspect-[16/10] bg-gray-200 dark:bg-gray-800 rounded overflow-hidden relative">
        <a href="${detailsUrl}"><img src="${escapeHtml(capaUrl)}" alt="Capa: ${escapeHtml(evento.titulo)}" class="w-full h-full object-cover rounded hover:scale-105 transition-all duration-300"></a>
      </div>
      <div class="flex flex-col justify-between flex-1">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <time class="font-sans text-xs font-bold uppercase tracking-widest text-primary">${escapeHtml(dateStr)}</time>
            <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
            <span class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">${escapeHtml(evento.local || 'Sem local')}</span>
          </div>
          <h3 class="font-serif text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            <a href="${detailsUrl}" class="hover:text-primary transition-colors line-clamp-2">${escapeHtml(evento.titulo)}</a>
          </h3>
          <p class="font-sans text-sm text-gray-600 dark:text-gray-400 line-clamp-3">${escapeHtml(evento.descricao || '')}</p>
        </div>
        <a href="${detailsUrl}" class="font-sans text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4 inline-block">Ver mais detalhes &rarr;</a>
      </div>
    </article>
  `;
}

function buildEventoListCard(evento) {
  const dateStr = formatPostDatePtBr(evento.data);
  const capaUrl = evento.capa || getPath('posts/img/place-holder.png');
  const detailsUrl = getPath('pages/evento.html?slug=') + encodeURIComponent(evento.id);
  
  return `
    <article class="flex flex-col md:flex-row gap-6 p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-all duration-300 w-full">
      <div class="md:w-1/3 shrink-0 h-48 md:h-40 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden relative">
        <a href="${detailsUrl}"><img src="${escapeHtml(capaUrl)}" alt="Capa: ${escapeHtml(evento.titulo)}" class="w-full h-full object-cover rounded hover:scale-105 transition-all duration-300"></a>
      </div>
      <div class="flex flex-col justify-between py-1 flex-1">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <time class="font-sans text-xs font-bold uppercase tracking-widest text-primary">${escapeHtml(dateStr)}</time>
            <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
            <span class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">${escapeHtml(evento.local || 'Sem local')}</span>
          </div>
          <h3 class="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            <a href="${detailsUrl}" class="hover:text-primary transition-colors">${escapeHtml(evento.titulo)}</a>
          </h3>
          <p class="font-sans text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">${escapeHtml(evento.descricao || '')}</p>
        </div>
        <a href="${detailsUrl}" class="font-sans text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4">Ver mais detalhes &rarr;</a>
      </div>
    </article>
  `;
}

const emptyMessage = '<p class="font-sans text-sm text-gray-500 py-8 text-center col-span-full">Nenhum evento disponível no momento.</p>';

function getTodayStr() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
}

function splitAndSortEvents(data) {
  const todayStr = getTodayStr();
  const future = [];
  const past = [];
  data.forEach(ev => {
    if (ev.data && ev.data >= todayStr) {
      future.push(ev);
    } else {
      past.push(ev);
    }
  });
  future.sort((a, b) => new Date(a.data) - new Date(b.data));
  past.sort((a, b) => new Date(b.data) - new Date(a.data));
  return { future, past };
}

export async function loadHomeEventos() {
  const grid = document.querySelector('#home-eventos-grid');
  if (!grid) return;
  
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*');
      
    if (error) throw error;
    
    if (data && data.length) {
      const { future, past } = splitAndSortEvents(data);
      const combined = [...future, ...past].slice(0, 3);
      grid.innerHTML = combined.map(buildEventoHomeCard).join('');
    } else {
      grid.innerHTML = emptyMessage;
    }
  } catch (err) {
    console.warn('Erro ao buscar eventos:', err);
    grid.innerHTML = emptyMessage;
  }
}

export async function loadEventosList() {
  const grid = document.querySelector('#eventos-list-grid');
  if (!grid) return;
  
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*');
      
    if (error) throw error;
    
    if (data && data.length) {
      const { future, past } = splitAndSortEvents(data);

      let html = '';
      if (future.length) {
        html += `
          <div class="flex flex-col gap-6">
            ${future.map(buildEventoListCard).join('')}
          </div>
        `;
      }
      
      if (past.length) {
        html += `
          <div class="${future.length ? 'mt-20 pt-10 border-t border-gray-200 dark:border-gray-800' : ''}">
            <h2 class="font-serif text-3xl font-bold text-gray-900 dark:text-white mb-8">Eventos Anteriores</h2>
            <div class="flex flex-col gap-6">
              ${past.map(buildEventoListCard).join('')}
            </div>
          </div>
        `;
      }
      
      grid.innerHTML = html || emptyMessage;
    } else {
      grid.innerHTML = emptyMessage;
    }
  } catch (err) {
    console.warn('Erro ao buscar eventos:', err);
    grid.innerHTML = emptyMessage;
  }
}

export async function loadEventoPage() {
  const container = document.querySelector('#evento-content');
  if (!container) return;
  
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    container.innerHTML = '<h1>Evento não encontrado</h1>';
    return;
  }
  
  try {
    const { data: ev, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', slug)
      .single();
      
    if (error || !ev) {
      container.innerHTML = '<h1>Evento não encontrado</h1>';
      return;
    }
    
    renderEventDetail(ev, container);
  } catch (err) {
    container.innerHTML = '<h1>Erro ao carregar o evento</h1>';
    console.error(err);
  }
}

function renderEventDetail(ev, container) {
  const title = ev.titulo || 'Sem título';
  const dateStr = formatPostDatePtBr(ev.data);
  const location = ev.local || 'Sem local';
  const image = String(ev.capa || '').trim();
  const desc = ev.descricao || '';
  const imagesList = Array.isArray(ev.imagens) ? ev.imagens : [];
  
  let htmlContent = `<p class="whitespace-pre-wrap">${escapeHtml(desc)}</p>`;
  if (window.marked && typeof window.marked.parse === 'function') {
    htmlContent = DOMPurify.sanitize(window.marked.parse(desc));
  }
  
  let galleryMarkup = '';
  if (imagesList.length) {
    galleryMarkup = `
      <section class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <h3 class="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-6">Galeria de Imagens</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          ${imagesList.map(img => `
            <div class="overflow-hidden rounded bg-gray-100 dark:bg-gray-800 aspect-video">
              <img src="${escapeHtml(img)}" alt="Foto do evento" class="w-full h-full object-cover hover:scale-105 transition-all duration-300">
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }
  
  updateMetaTags({
    title: `${title} | OEDLA`,
    description: desc || `Agenda de Eventos OEDLA: ${title} no dia ${dateStr} em ${location}`,
    image: image || null,
    url: window.location.href
  });
  container.innerHTML = `
    <div class="mb-12">
      <p class="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-6"><a href="${getPath('pages/eventos.html')}" class="hover:text-gray-900 dark:hover:text-white transition-colors">&larr; Voltar para Eventos</a></p>
      <div class="flex items-center gap-3 mb-6">
        <time class="font-sans text-xs font-bold uppercase tracking-widest text-primary">${escapeHtml(dateStr)}</time>
        <span class="w-1 h-1 rounded-full bg-primary"></span>
        <span class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">${escapeHtml(location)}</span>
      </div>
      <h1 class="font-serif text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-8">${escapeHtml(title)}</h1>
    </div>
    <div class="flex flex-col">
      ${image ? `<div class="mb-10 w-full"><img src="${escapeHtml(image)}" alt="Capa: ${escapeHtml(title)}" class="w-full h-auto aspect-video object-cover rounded shadow-md"></div>` : ''}
      <div class="post-markdown max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-sans text-lg">${htmlContent}</div>
      ${galleryMarkup}
    </div>
  `;
}
