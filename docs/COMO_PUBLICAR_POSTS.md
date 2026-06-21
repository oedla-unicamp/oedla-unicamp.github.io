# Como publicar posts (estrutura por pasta)

Cada publicação fica em sua própria pasta, com um arquivo Markdown e imagens separadas.

## Estrutura de pastas

```
site/posts/
├── artigos/              ← blog
│   └── meu-slug/
│       ├── post.md
│       └── img/
│           ├── capa.jpg    ← imagem de capa (card + topo do artigo)
│           ├── 1.jpg       ← imagem inline no texto
│           └── 2.png
└── noticias/
    └── outro-slug/
        ├── post.md
        └── img/
            └── capa.jpg
```

## 1) Criar a pasta do post

1. Entre em `site/posts/artigos/` (blog) ou `site/posts/noticias/` (notícia).
2. Crie uma pasta com o slug do post, por exemplo: `meu-slug/`.
3. Dentro dela, crie `post.md` e a pasta `img/`.
4. Use `site/posts/modelo-post/post.md` como referência.

## 2) Preencher o cabeçalho do post

No topo de `post.md`, mantenha este formato:

```md
---
title: Titulo do post
categories: método, política
authors: nome-do-autor
date: 2026-04-01
excerpt: Resumo curto em uma frase.
image: img/capa.jpg
---
```

Campos:
- `image` — caminho relativo à pasta do post (normalmente `img/capa.jpg` ou `img/capa.png`).
- `authors` — slug do integrante (nome do arquivo em `site/integrantes/` sem `.json`).
- `date` — formato ISO (`2026-04-01`).

## 3) Imagens no corpo do texto

Salve as imagens do corpo em `img/` com nomes numéricos: `1.jpg`, `2.png`, etc.

No texto, use marcadores `{1}`, `{2}`, `{3}` onde a imagem deve aparecer:

```md
Parágrafo introdutório.

{1}

Outro parágrafo com mais contexto.

{2.png}
```

Regras:
- `{1}` assume extensão `.jpg` por padrão.
- `{2.png}` informa a extensão explicitamente.
- A capa **não** usa marcador — ela vem do campo `image` no cabeçalho.

## 4) Registrar no índice

Abra `site/posts/posts.json` e adicione uma entrada na lista correta (`artigos` ou `noticias`):

```json
{
  "slug": "meu-slug",
  "file": "artigos/meu-slug/post.md"
}
```

Regras:
- `slug` sem espaços e sem acentos.
- `file` aponta para `post.md` dentro da pasta do post.

## 5) Pronto

O post aparece automaticamente em `site/blog.html` ou `site/noticias.html` e abre em `site/post.html?slug=...`.

Se não carregar, rode o projeto em servidor local (ex.: extensão Live Server no VS Code).
