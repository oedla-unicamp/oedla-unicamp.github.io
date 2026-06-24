export function inferIconFromLink(titulo, url) {
  const title = String(titulo || '').trim().toLowerCase();
  const href = String(url || '').trim().toLowerCase();
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
    { match: () => href.includes('rss') || title.includes('rss') || href.endsWith('.xml') || title.includes('feed'), icon: 'rss' },
  ];
  const matched = rules.find((rule) => rule.match());
  return matched ? matched.icon : '';
}

export function resolveConfiguredIconClass(rawIcon) {
  const value = String(rawIcon || '').trim().toLowerCase();
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
    rss: 'fa-solid fa-rss',
  };
  if (aliasMap[value]) return aliasMap[value];
  const normalized = value.replace(/^fa\s+/, '').replace(/^fa-/, '').replace(/^icon-/, '');
  const safeToken = normalized.replace(/[^a-z0-9-]/g, '');
  if (!safeToken) return '';
  return `fa-brands fa-${safeToken}`;
}
