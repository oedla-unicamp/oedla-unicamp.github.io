export const getPath = (path) => {
  const base = window.location.pathname.includes('/pages/') ? '../' : '';
  return base + path;
};

export async function fetchText(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Falha ao carregar ${path}`);
  return response.text();
}

export async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Falha ao carregar ${path}`);
  return response.json();
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function getCurrentPageKey() {
  return String(document.body?.dataset?.page || '').trim();
}

export function formatPostDatePtBr(rawDate) {
  const value = String(rawDate || '').trim();
  if (!value) return 'Sem data';
  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${day}/${month}/${year}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR').format(parsed);
}

export function normalizeCategoryValue(category) {
  return String(category || '').trim().toLocaleLowerCase('pt-BR');
}

export function formatCategoryLabel(category) {
  const text = String(category || '').trim();
  if (!text) return 'Categoria';
  return text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1);
}

export function normalizeAuthorKey(value) {
  return String(value || '').trim().toLocaleLowerCase('pt-BR');
}

export function parseListValue(rawValue) {
  if (!rawValue) return [];
  return String(rawValue).split(',').map((item) => item.trim()).filter(Boolean);
}

export function slugifyHeading(text, usedSlugs) {
  const baseSlug = String(text || '')
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  const fallback = baseSlug || 'secao';
  let slug = fallback;
  let suffix = 2;
  while (usedSlugs.has(slug)) {
    slug = `${fallback}-${suffix}`;
    suffix += 1;
  }
  usedSlugs.add(slug);
  return slug;
}

function setMeta(name, content, attribute = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function updateMetaTags({ title, description, image, url }) {
  if (title) {
    document.title = title;
    setMeta('og:title', title, 'property');
    setMeta('twitter:title', title);
  }
  if (description) {
    const cleanDesc = String(description).replace(/[\r\n\t]+/g, ' ').slice(0, 200).trim();
    setMeta('description', cleanDesc);
    setMeta('og:description', cleanDesc, 'property');
    setMeta('twitter:description', cleanDesc);
  }
  if (image) {
    setMeta('og:image', image, 'property');
    setMeta('twitter:image', image);
  }
  if (url) {
    setMeta('og:url', url, 'property');
  }
}

export function setupImageZoom(container) {
  if (!container) return;

  // Add class to change cursor to magnifying glass (lupa)
  container.querySelectorAll('img').forEach(img => {
    img.classList.add('zoomable-img');
  });

  // Get or create overlay
  let overlay = document.querySelector('#image-zoom-overlay');
  let zoomImg;
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'image-zoom-overlay';
    zoomImg = document.createElement('img');
    zoomImg.id = 'image-zoom-img';
    overlay.appendChild(zoomImg);
    document.body.appendChild(overlay);

    // Dismiss overlay on click (anywhere on overlay)
    overlay.addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  } else {
    zoomImg = overlay.querySelector('img');
  }

  // Handle click on post/integrante images to show overlay
  container.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;

    // Prevent navigation if the image is wrapped in a link
    e.preventDefault();

    zoomImg.src = img.src;
    zoomImg.alt = img.alt || '';

    const setDimensions = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      zoomImg.style.width = naturalWidth ? `${naturalWidth}px` : 'auto';
      zoomImg.style.height = naturalHeight ? `${naturalHeight}px` : 'auto';
    };

    if (img.complete) {
      setDimensions();
    } else {
      img.addEventListener('load', setDimensions, { once: true });
    }

    overlay.classList.add('active');
  });
}
