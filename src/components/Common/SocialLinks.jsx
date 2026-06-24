import React from 'react';
import { inferIconFromLink, resolveConfiguredIconClass } from '../../utils/social';

export default function SocialLinks({ links, className = 'social-link' }) {
  if (!Array.isArray(links) || !links.length) {
    return null;
  }

  return (
    <>
      {links.map((link, idx) => {
        const title = link.titulo || 'Link';
        const url = link.url || '#';
        const rawIcon = String(link.icone || link.icon || '').trim().toLowerCase()
          || inferIconFromLink(link.titulo, link.url);
        const iconClass = resolveConfiguredIconClass(rawIcon);
        const hasIcon = Boolean(iconClass);
        const linkClasses = `${className} ${hasIcon ? 'icon-only' : 'no-icon'}`;

        return (
          <a
            key={idx}
            className={linkClasses}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={title}
            title={title}
          >
            {hasIcon ? (
              <span className="social-icon" aria-hidden="true">
                <i className={iconClass}></i>
              </span>
            ) : (
              <span>{title}</span>
            )}
          </a>
        );
      })}
    </>
  );
}
