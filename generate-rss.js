const fs = require('fs');
const https = require('https');

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impuc3BncG1kbW91dmttb3FheGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMjYyMDMsImV4cCI6MjA5NzcwMjIwM30.Kv5gZ3R_Z2KoIKzE1sKzf2j0FAFOr_4Sl6G38Wj3-Hk';
const SITE_URL = 'https://oedla-unicamp.github.io';

const options = {
  hostname: 'jnspgpmdmouvkmoqaxlc.supabase.co',
  path: '/rest/v1/posts?select=id,titulo,resumo,data,tipo,autor&order=data.desc',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
};

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
}

https.get(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      if (res.statusCode !== 200) {
        console.error('Erro na resposta do Supabase:', body);
        process.exit(1);
      }
      
      const posts = JSON.parse(body);
      const lastBuildDate = new Date().toUTCString();
      
      let itemsXml = '';
      posts.forEach(post => {
        const title = escapeXml(post.titulo || 'Sem título');
        const slug = encodeURIComponent(post.id);
        const link = `${SITE_URL}/pages/post.html?slug=${slug}`;
        const description = escapeXml(post.resumo || 'Sem resumo disponível.');
        const pubDate = new Date(post.data + 'T12:00:00Z').toUTCString();
        
        itemsXml += `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <guid>${link}</guid>
    </item>\n`;
      });
      
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>OEDLA | Observatório da Extrema Direita Latino-americana</title>
  <link>${SITE_URL}/</link>
  <description>Análises acadêmicas e pesquisas sobre os movimentos de extrema direita na América Latina, promovendo o debate crítico e informado sobre os desafios democráticos contemporâneos.</description>
  <language>pt-br</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
  <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}</channel>
</rss>
`;

      fs.writeFileSync('./feed.xml', xml, 'utf8');
      console.log('Feed RSS gerado com sucesso em ./feed.xml!');
    } catch (e) {
      console.error('Falha ao processar resposta do Supabase:', e);
    }
  });
}).on('error', (err) => {
  console.error('Erro na requisição HTTPS:', err);
});
