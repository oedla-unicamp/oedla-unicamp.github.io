import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, removeDir } from './lib/io.mjs';
import { processPost } from './process-post.mjs';
import { processIntegrante } from './process-integrante.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const submissionId = process.env.SUBMISSION_ID;
if (!submissionId) {
  console.error('SUBMISSION_ID is required');
  process.exit(1);
}

const inboxDir = path.join(repoRoot, 'inbox', submissionId);
const bundlePath = path.join(inboxDir, 'bundle.json');

if (!fs.existsSync(bundlePath)) {
  console.error(`Bundle not found: ${bundlePath}`);
  process.exit(1);
}

const bundle = readJson(bundlePath);
let result;

if (bundle.kind === 'post') {
  result = processPost(bundle, repoRoot);
} else if (bundle.kind === 'integrante') {
  result = processIntegrante(bundle, repoRoot);
} else {
  console.error(`Unknown bundle kind: ${bundle.kind}`);
  process.exit(1);
}

removeDir(inboxDir);
console.log(`Processed ${result.kind}: ${result.slug}`);
