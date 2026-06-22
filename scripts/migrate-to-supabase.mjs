/**
 * Script de migração: Firebase Firestore → Supabase
 * 
 * Uso: node scripts/migrate-to-supabase.mjs
 * 
 * Requisitos: npm install @supabase/supabase-js firebase-admin
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// Configurações
// ============================================
const SUPABASE_URL = 'https://jnspgpmdmouvkmoqaxlc.supabase.co';

// Firebase project ID
const FIREBASE_PROJECT_ID = 'wise-ally-456423-s9';

// ============================================
// Inicializar clientes
// ============================================
// Firebase Admin SDK (sem credenciais de service account, 
// usa Application Default Credentials ou emulador)
// Para rodar sem service account JSON, instale gcloud CLI e rode:
//   gcloud auth application-default login
// OU use a abordagem com REST API direta (abaixo usaremos REST)

const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Vamos usar a REST API do Firestore diretamente
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

async function fetchFirestoreCollection(collectionName) {
  const url = `${FIRESTORE_BASE}/${collectionName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao buscar ${collectionName}: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.documents || [];
}

function parseFirestoreValue(value) {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return parseInt(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.nullValue !== undefined) return null;
  if (value.arrayValue) {
    return (value.arrayValue.values || []).map(parseFirestoreValue);
  }
  if (value.mapValue) {
    const result = {};
    const fields = value.mapValue.fields || {};
    for (const [key, val] of Object.entries(fields)) {
      result[key] = parseFirestoreValue(val);
    }
    return result;
  }
  return null;
}

function parseFirestoreDoc(doc) {
  const fields = doc.fields || {};
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = parseFirestoreValue(value);
  }
  // Extract document ID from the name path
  const nameParts = doc.name.split('/');
  result.__docId = nameParts[nameParts.length - 1];
  return result;
}

async function migrateAuthors() {
  console.log('\n📋 Migrando authors...');
  const docs = await fetchFirestoreCollection('authors');

  if (!docs.length) {
    console.log('  Nenhum author encontrado no Firestore.');
    return;
  }

  const authors = docs.map(doc => {
    const parsed = parseFirestoreDoc(doc);
    return {
      id: parsed.__docId,
      nome: parsed.nome || '',
      cargo: parsed.cargo || '',
      formacao: parsed.formacao || '',
      minibiografia: parsed.minibiografia || '',
      foto: parsed.foto || '',
      links: parsed.links || [],
    };
  });

  console.log(`  Encontrados ${authors.length} authors.`);

  for (const author of authors) {
    const { error } = await supabase
      .from('authors')
      .upsert(author, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Erro ao migrar author "${author.nome}":`, error.message);
    } else {
      console.log(`  ✅ ${author.nome} (${author.id})`);
    }
  }
}

async function migratePosts() {
  console.log('\n📋 Migrando posts...');
  const docs = await fetchFirestoreCollection('posts');

  if (!docs.length) {
    console.log('  Nenhum post encontrado no Firestore.');
    return;
  }

  const posts = docs.map(doc => {
    const parsed = parseFirestoreDoc(doc);
    return {
      id: parsed.__docId,
      titulo: parsed.titulo || '',
      autor: parsed.autor || null,
      data: parsed.data || null,
      tipo: parsed.tipo || 'artigo',
      destaque: parsed.destaque || false,
      categorias: parsed.categorias || [],
      tags: parsed.tags || [],
      resumo: parsed.resumo || '',
      poster: parsed.poster || '',
      conteudo: parsed.conteudo || '',
      imagens: parsed.imagens || [],
    };
  });

  console.log(`  Encontrados ${posts.length} posts.`);

  for (const post of posts) {
    const { error } = await supabase
      .from('posts')
      .upsert(post, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Erro ao migrar post "${post.titulo}":`, error.message);
    } else {
      console.log(`  ✅ ${post.titulo} (${post.id})`);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando migração Firebase → Supabase');
  console.log('==========================================');

  try {
    // Testar conexão com Supabase
    const { data, error } = await supabase.from('info_oedla').select('id');
    if (error) throw new Error(`Supabase inacessível: ${error.message}`);
    console.log('✅ Conexão com Supabase OK');

    // Migrar
    await migrateAuthors();
    await migratePosts();

    console.log('\n==========================================');
    console.log('✅ Migração concluída com sucesso!');
    console.log('\n⚠️  IMPORTANTE: Remova a service_role key deste arquivo após a migração.');

  } catch (err) {
    console.error('❌ Erro fatal na migração:', err.message);
    process.exit(1);
  }
}

main();
