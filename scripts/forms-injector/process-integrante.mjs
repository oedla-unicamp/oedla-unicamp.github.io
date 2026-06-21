import path from 'node:path';
import { ensureDir, readJson, writeJson, writeBinaryFromBase64 } from './lib/io.mjs';
import { slugify } from './lib/slugify.mjs';

export function processIntegrante(bundle, repoRoot) {
  const slug = slugify(bundle.slug || bundle.nome);
  const integrantesDir = path.join(repoRoot, 'site', 'integrantes');
  const imgDir = path.join(integrantesDir, 'img');

  ensureDir(imgDir);

  const files = bundle.files || {};
  const profile = files.profile;
  if (!profile?.base64) {
    throw new Error('Integrante bundle missing files.profile (profile image)');
  }

  const imageExt = String(profile.extension || 'jpg').replace(/^\./, '').toLowerCase();
  const imageFileName = `${slug}.${imageExt}`;
  writeBinaryFromBase64(path.join(imgDir, imageFileName), profile.base64);

  const integrante = {
    Nome: bundle.nome,
    Cargo: bundle.cargo,
    'Formação': bundle.formacao,
    Imagem: `integrantes/img/${imageFileName}`,
    Minibiografia: bundle.minibiografia,
    'Links importantes': Array.isArray(bundle.links) ? bundle.links : [],
  };

  writeJson(path.join(integrantesDir, `${slug}.json`), integrante);

  const manifestPath = path.join(integrantesDir, 'integrantes.json');
  const manifest = readJson(manifestPath);
  const list = manifest.integrantes || [];
  const fileName = `${slug}.json`;
  const exists = list.some((item) => item.file === fileName);

  if (!exists) {
    list.push({ file: fileName });
  }

  manifest.integrantes = list;
  writeJson(manifestPath, manifest);

  return { kind: 'integrante', slug };
}
