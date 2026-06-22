import { escapeHtml } from './utils.js';

export function inferIconFromLink(titulo, url) {
  const title = String(titulo || '').trim().toLocaleLowerCase('pt-BR');
  const href = String(url || '').trim().toLocaleLowerCase('pt-BR');
  if (!href) return '';
  if (title.includes('lattes') || href.includes('lattes.cnpq.br')) return '';

  const rules = [
    { match: () => href.includes('orcid.org') || title === 'orcid', icon: 'orcid' },
    { match: () => href.includes('instagram.com') || title.includes('instagram'), icon: 'instagram' },
    { match: () => href.includes('linkedin.com') || title.includes('linkedin'), icon: 'linkedin' },
    { match: () => href.includes('x.com') || href.includes('twitter.com') || title === 'x' || title.includes('twitter'), icon: 'x-twitter' },
    { match: () => href.includes('bsky.app') || href.includes('bluesky') || title.includes('bluesky'), icon: 'bluesky' },
    { match: () => href.includes('youtube.com') || href.includes('youtu.be') || title.includes('youtube'), icon: 'youtube' },
    { match: () => href.includes('github.com') || title.includes('github'), icon: 'github' },
    { match: () => href.includes('facebook.com') || title.includes('facebook'), icon: 'facebook' },
    { match: () => href.includes('tiktok.com') || title.includes('tiktok'), icon: 'tiktok' },
    { match: () => href.includes('t.me') || href.includes('telegram.') || title.includes('telegram'), icon: 'telegram' },
    { match: () => href.includes('wa.me') || href.includes('whatsapp') || title.includes('whatsapp'), icon: 'whatsapp' },
    { match: () => href.includes('mastodon') || title.includes('mastodon'), icon: 'mastodon' },
  ];
  const matched = rules.find((rule) => rule.match());
  return matched ? matched.icon : '';
}

export function resolveConfiguredIconClass(rawIcon) {
  const value = String(rawIcon || '').trim().toLocaleLowerCase('pt-BR');
  if (!value) return '';
  if (value.includes('fa-')) {
    const allowedTokens = value.split(/\s+/).map((t) => t.replace(/[^a-z0-9-]/g, '')).filter((t) => t.startsWith('fa'));
    return allowedTokens.join(' ').trim();
  }
  const aliasMap = {
    'brand-instagram': 'fa-brands fa-instagram',
    'brand-x': 'fa-brands fa-x-twitter',
    'brand-bluesky': 'fa-brands fa-bluesky',
    'brand-linkedin': 'fa-brands fa-linkedin',
    'brand-youtube': 'fa-brands fa-youtube',
    'brand-github': 'fa-brands fa-github',
    orcid: 'fa-brands fa-orcid',
    'id-badge-2': 'fa-brands fa-orcid',
  };
  if (aliasMap[value]) return aliasMap[value];
  const normalized = value.replace(/^fa\s+/, '').replace(/^fa-/, '').replace(/^icon-/, '');
  const safeToken = normalized.replace(/[^a-z0-9-]/g, '');
  if (!safeToken) return '';
  return `fa-brands fa-${safeToken}`;
}

export function buildSocialLink(link, cssClassName) {
  const title = escapeHtml(link.titulo || 'Link');
  const url = escapeHtml(link.url || '#');
  const rawIcon = String(link.icone || link.icon || '').trim().toLocaleLowerCase('pt-BR')
    || inferIconFromLink(link.titulo, link.url);
  const iconClass = resolveConfiguredIconClass(rawIcon);
  const hasIcon = Boolean(iconClass);
  const linkClasses = `${cssClassName}${hasIcon ? ' icon-only' : ' no-icon'}`;
  return `<a class="${linkClasses}" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${title}" title="${title}">${hasIcon ? `<span class="social-icon" aria-hidden="true"><i class="${iconClass}"></i></span>` : `<span>${title}</span>`}</a>`;
}

export function buildImportantLinks(links) {
  if (!Array.isArray(links) || !links.length) return '<p class="preview-meta">Sem links cadastrados.</p>';
  return `<div class="important-links-inline">${links.map((l) => buildSocialLink(l, 'integrante-link')).join('')}</div>`;
}

export function buildLabSocialLinks(links) {
  if (!Array.isArray(links) || !links.length) return '<p class="preview-meta">Sem redes cadastradas.</p>';
  return links.map((l) => buildSocialLink(l, 'social-link')).join('');
}
