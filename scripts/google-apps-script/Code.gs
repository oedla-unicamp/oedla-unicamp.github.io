/**
 * OEDLA — Google Forms → GitHub Pages
 *
 * Configure em Propriedades do script:
 *   GITHUB_TOKEN  — PAT com permissão repo (ou fine-grained: Contents + Actions)
 *   GITHUB_REPO   — ex.: geraldohomero/oedla
 *
 * Vincule onPostFormSubmit / onIntegranteFormSubmit ao envio de cada Form.
 */

const GITHUB_API = 'https://api.github.com';

function getScriptProp_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error('Propriedade ausente: ' + key);
  }
  return value;
}

function githubRequest_(method, path, payload) {
  const token = getScriptProp_('GITHUB_TOKEN');
  const repo = getScriptProp_('GITHUB_REPO');
  const url = GITHUB_API + '/repos/' + repo + path;

  const options = {
    method: method,
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  };

  if (payload !== undefined) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const text = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('GitHub API ' + method + ' ' + path + ' → ' + code + ': ' + text);
  }

  return text ? JSON.parse(text) : {};
}

function slugify_(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

function getResponseMap_(e) {
  const map = {};
  e.response.getItemResponses().forEach(function (item) {
    map[item.getItem().getTitle()] = item.getResponse();
  });
  return map;
}

function getFilePayload_(fileId) {
  if (!fileId) {
    return null;
  }
  const file = DriveApp.getFileById(String(fileId).trim());
  const blob = file.getBlob();
  const name = file.getName();
  const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
  return {
    extension: extMatch ? extMatch[1].toLowerCase() : 'jpg',
    base64: Utilities.base64Encode(blob.getBytes()),
  };
}

function getFileIdsFromResponse_(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return String(value).split(',').map(function (part) {
    return part.trim();
  }).filter(Boolean);
}

function parseLinks_(rawLinks) {
  if (!rawLinks) {
    return [];
  }
  return String(rawLinks)
    .split('\n')
    .map(function (line) {
      return line.trim();
    })
    .filter(Boolean)
    .map(function (line) {
      const parts = line.split('|').map(function (part) {
        return part.trim();
      });
      return {
        titulo: parts[0] || 'Link',
        url: parts[1] || '',
      };
    })
    .filter(function (link) {
      return link.url;
    });
}

function uploadBundleAndDispatch_(bundle) {
  const submissionId = Utilities.getUuid();
  const repoPath = 'inbox/' + submissionId + '/bundle.json';
  const content = Utilities.base64Encode(Utilities.newBlob(JSON.stringify(bundle)).getBytes());

  githubRequest_('PUT', '/contents/' + repoPath, {
    message: 'inbox: envio Google Forms (' + bundle.kind + ')',
    content: content,
    committer: {
      name: 'OEDLA Google Forms',
      email: 'forms@oedla.local',
    },
  });

  githubRequest_('POST', '/dispatches', {
    event_type: 'publish-content',
    client_payload: {
      submissionId: submissionId,
      kind: bundle.kind,
    },
  });

  return submissionId;
}

/**
 * Form de publicação (blog / notícia).
 *
 * Campos esperados (títulos exatos):
 *   Tipo          — "Blog" ou "Notícia"
 *   Título
 *   Slug          — opcional
 *   Categorias
 *   Autores       — slugs separados por vírgula
 *   Data          — YYYY-MM-DD
 *   Resumo
 *   Corpo         — markdown com {1}, {2}...
 *   Capa          — upload de arquivo
 *   Imagens corpo — upload (ordem = 1, 2, 3...)
 */
function onPostFormSubmit(e) {
  const r = getResponseMap_(e);
  const bodyImageIds = getFileIdsFromResponse_(r['Imagens corpo']);
  const files = {
    capa: getFilePayload_(getFileIdsFromResponse_(r['Capa'])[0]),
  };

  bodyImageIds.forEach(function (fileId, index) {
    files[String(index + 1)] = getFilePayload_(fileId);
  });

  const bundle = {
    kind: 'post',
    postType: r['Tipo'],
    slug: r['Slug'] || slugify_(r['Título']),
    title: r['Título'],
    categories: r['Categorias'],
    authors: r['Autores'],
    date: r['Data'],
    excerpt: r['Resumo'],
    body: r['Corpo'],
    files: files,
  };

  uploadBundleAndDispatch_(bundle);
}

/**
 * Form de integrante.
 *
 * Campos esperados:
 *   Nome
 *   Slug          — opcional
 *   Cargo
 *   Formação
 *   Minibiografia
 *   Foto          — upload
 *   Links         — um por linha: Titulo|URL
 */
function onIntegranteFormSubmit(e) {
  const r = getResponseMap_(e);
  const bundle = {
    kind: 'integrante',
    slug: r['Slug'] || slugify_(r['Nome']),
    nome: r['Nome'],
    cargo: r['Cargo'],
    formacao: r['Formação'],
    minibiografia: r['Minibiografia'],
    links: parseLinks_(r['Links']),
    files: {
      profile: getFilePayload_(getFileIdsFromResponse_(r['Foto'])[0]),
    },
  };

  uploadBundleAndDispatch_(bundle);
}
