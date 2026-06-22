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
