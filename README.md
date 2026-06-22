# OEDLA – Observatório da Extrema Direita Latino-Americana

Este repositório contém o código-fonte do site do OEDLA, um observatório de pesquisa dedicado ao estudo da extrema direita na América Latina. O site é construído usando HTML, CSS e JavaScript, com Supabase (PostgreSQL + Auth + Storage) como backend, e é hospedado no GitHub Pages.

## Documentação para colaboradores

- [Como adicionar integrantes](docs/COMO_ADICIONAR_INTEGRANTES.md)
- [Como publicar posts no blog](docs/COMO_PUBLICAR_POSTS.md)

## Banco de Dados (Supabase PostgreSQL)

A aplicação utiliza o **Supabase** como banco de dados relacional. Abaixo está o diagrama das tabelas e seus campos.

### Diagrama ER

```mermaid
erDiagram
    POSTS {
        varchar id PK "Slug gerado a partir do título"
        varchar titulo "Título da publicação"
        varchar autor FK "ID do author (slug)"
        date data "Data de publicação"
        varchar tipo "artigo | notícia"
        boolean destaque "Exibir no carrossel da home"
        jsonb categorias "Lista de categorias"
        jsonb tags "Lista de tags"
        text resumo "Resumo curto da publicação"
        text poster "URL da imagem de capa"
        text conteudo "Corpo em Markdown"
        jsonb imagens "URLs de imagens adicionais"
    }

    AUTHORS {
        varchar id PK "Slug gerado a partir do nome"
        varchar nome "Nome completo"
        varchar cargo "Cargo ou função"
        varchar formacao "Formação acadêmica"
        text minibiografia "Texto biográfico curto"
        text foto "URL da foto de perfil"
        jsonb links "Lista de objetos com titulo e url"
    }

    EVENTOS {
        varchar id PK "Slug ou identificador único"
        varchar titulo "Título do evento"
        date data "Data do evento"
        varchar local "Local do evento"
        text descricao "Descrição do evento"
        text capa "URL da imagem de capa"
        jsonb imagens "URLs de imagens adicionais"
    }

    INFO_OEDLA {
        varchar id PK "'main' para o singleton"
        varchar titulo "Título principal da Home"
        text subtitulo "Subtítulo da Home"
        text keywords "Palavras-chave da Home"
        jsonb redes_sociais "Redes sociais do observatório"
        jsonb quem_somos "Parágrafos da seção Quem Somos"
        jsonb nossa_origem "Parágrafos da seção Nossa Origem"
        jsonb atividades "Parágrafos e missão das Atividades"
        text blog_keywords "Palavras-chave do Blog"
        text blog_subtitulo "Subtítulo do Blog"
        text noticias_keywords "Palavras-chave de Notícias"
        text noticias_subtitulo "Subtítulo de Notícias"
    }

    ADMINS {
        uuid id PK "UUID correspondente em auth.users"
        varchar email "E-mail do administrador"
    }

    AUTHORS ||--o{ POSTS : "escreve"
    ADMINS ||--o{ POSTS : "gerencia via CMS"
    ADMINS ||--o{ AUTHORS : "gerencia via CMS"
    ADMINS ||--o{ EVENTOS : "gerencia via CMS"
    ADMINS ||--o{ INFO_OEDLA : "gerencia via CMS"
```

### Descrição das Tabelas

| Tabela       | Chave Primária       | Descrição                                                                 |
|--------------|----------------------|---------------------------------------------------------------------------|
| `posts`      | Slug do título       | Publicações do tipo artigo (blog) ou notícia                              |
| `authors`    | Slug do nome         | Integrantes/autores do observatório                                       |
| `eventos`    | Slug do título       | Eventos organizados pelo observatório                                     |
| `info_oedla` | 'main'               | Configurações e textos dinâmicos das páginas institucionais               |
| `admins`     | ID (auth.users)      | Usuários com permissão de acesso ao painel CMS (`pages/admin.html`)       |

### Relacionamentos

- **`posts.autor`** → referencia o **`id`** de uma linha na tabela `authors`.
- **`admins`** → a linha possui o mesmo **UUID** do usuário no Supabase Auth; sua existência concede acesso ao CMS.
- **`posts.destaque`** → quando `true`, o post aparece no carrossel "Em Destaque" da página principal.

