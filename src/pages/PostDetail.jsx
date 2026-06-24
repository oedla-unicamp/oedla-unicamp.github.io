import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';
import { supabase } from '../supabase';
import { formatPostDatePtBr, formatCategoryLabel, normalizeAuthorKey, slugifyHeading } from '../utils/helpers';

export default function PostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoomedImg, setZoomedImg] = useState(null);

  // Load Post
  useEffect(() => {
    async function loadPostData() {
      try {
        setLoading(true);
        // Fetch Post
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', slug)
          .single();

        if (postError || !postData) {
          setPost(null);
          setLoading(false);
          return;
        }

        setPost(postData);

        // Fetch Author
        if (postData.autor) {
          const authorKey = normalizeAuthorKey(postData.autor);
          const { data: authorData, error: authError } = await supabase
            .from('authors')
            .select('*')
            .eq('id', authorKey)
            .single();
          
          if (!authError && authorData) {
            setAuthor(authorData);
          } else {
            setAuthor({ id: '', nome: String(postData.autor).trim() });
          }
        }
      } catch (e) {
        console.error('Error loading post details:', e);
      } finally {
        setLoading(false);
      }
    }
    loadPostData();
  }, [slug]);

  // Set Document Meta Tags
  useEffect(() => {
    if (post) {
      document.title = `${post.titulo || 'Publicação'} | OEDLA`;
      
      const cleanDesc = String(post.resumo || '').replace(/[\r\n\t]+/g, ' ').slice(0, 200).trim();
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', cleanDesc);
      }
    }
  }, [post]);

  // Parse Markdown & Build Table of Contents (TOC)
  const parsedContent = useMemo(() => {
    if (!post || !post.conteudo) return { html: '', toc: [] };

    try {
      const rawHtml = marked.parse(post.conteudo);
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');
      const usedSlugs = new Set();
      const toc = [];

      doc.querySelectorAll('h2, h3').forEach((heading) => {
        const headingText = heading.textContent ? heading.textContent.trim() : '';
        const headingSlug = slugifyHeading(headingText, usedSlugs);
        heading.setAttribute('id', headingSlug);
        
        toc.push({
          id: headingSlug,
          label: headingText,
          level: heading.tagName.toLowerCase() === 'h3' ? 3 : 2
        });
      });

      return {
        html: doc.body.innerHTML,
        toc
      };
    } catch (e) {
      console.error('Error parsing markdown content:', e);
      return { html: `<p>${post.conteudo}</p>`, toc: [] };
    }
  }, [post]);

  // Handle image clicks for zoom
  const handleContentClick = (e) => {
    const img = e.target.closest('img');
    if (img) {
      e.preventDefault();
      setZoomedImg({
        src: img.src,
        alt: img.alt || '',
        width: img.naturalWidth ? `${img.naturalWidth}px` : 'auto',
        height: img.naturalHeight ? `${img.naturalHeight}px` : 'auto'
      });
    }
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <p className="font-sans text-sm text-gray-500">Carregando publicação...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white mb-4">Publicação não encontrada</h1>
        <Link to="/blog" className="font-sans text-sm text-primary hover:underline">
          Voltar para o Blog
        </Link>
      </main>
    );
  }

  const isNews = post.tipo === 'notícia' || post.tipo === 'noticia';
  const backText = isNews ? 'Voltar para Notícias' : 'Voltar para o Blog';
  const backUrl = isNews ? '/noticias' : '/blog';
  const categoryLabels = (post.categorias || []).map(formatCategoryLabel);

  return (
    <main className="max-w-5xl mx-auto px-6 py-20">
      <div className="mb-12">
        <p className="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-6">
          <Link to={backUrl} className="hover:text-gray-900 dark:hover:text-white transition-colors">
            &larr; {backText}
          </Link>
        </p>
        <div className="flex items-center gap-3 mb-6">
          <time className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {formatPostDatePtBr(post.data)}
          </time>
          {categoryLabels.length > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-primary"></span>
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-primary">
                {categoryLabels.join(' • ')}
              </span>
            </>
          )}
        </div>
        <h1 className="font-serif text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-8">
          {post.titulo}
        </h1>
        {author && (
          <p className="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">
            Por:{' '}
            {author.id ? (
              <Link to={`/integrante/${author.id}`} className="text-gray-900 dark:text-white hover:text-primary transition-colors">
                {author.nome}
              </Link>
            ) : (
              <span>{author.nome}</span>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 flex flex-col">
          {post.poster && (
            <div className="mb-10 w-full">
              <img
                src={post.poster}
                alt={post.titulo}
                className="w-full h-auto aspect-video object-cover rounded transition-all duration-500 shadow-md cursor-pointer zoomable-img"
                onClick={(e) => handleContentClick(e)}
              />
            </div>
          )}
          {post.resumo && (
            <p className="font-serif text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed italic mb-12 border-l-4 border-primary pl-6">
              {post.resumo}
            </p>
          )}

          {/* Mobile TOC */}
          {parsedContent.toc.length > 0 && (
            <details className="lg:hidden mb-12 border border-gray-200 dark:border-gray-800 rounded p-4">
              <summary className="font-sans text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white cursor-pointer select-none">
                Sumário do artigo
              </summary>
              <div className="mt-4 font-sans text-sm text-gray-600 dark:text-gray-400">
                <ul className="post-toc-list">
                  {parsedContent.toc.map(item => (
                    <li key={item.id} className={`toc-level-${item.level}`}>
                      <a href={`#${item.id}`}>{item.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}

          {/* Article HTML Content */}
          <div
            className="post-markdown max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-sans text-lg"
            dangerouslySetInnerHTML={{ __html: parsedContent.html }}
            onClick={handleContentClick}
          />

          <p className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 font-sans text-sm font-bold uppercase tracking-widest">
            <Link to={backUrl} className="hover:text-primary transition-colors">
              &larr; {backText}
            </Link>
          </p>
        </div>

        {/* Desktop Sticky Sidebar TOC */}
        {parsedContent.toc.length > 0 && (
          <aside className="hidden lg:block lg:col-span-4 sticky top-32" aria-label="Sumário do artigo">
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">
              Sumário
            </h2>
            <div className="font-sans text-sm text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800 pl-6">
              <ul className="post-toc-list">
                {parsedContent.toc.map(item => (
                  <li key={item.id} className={`toc-level-${item.level}`}>
                    <a href={`#${item.id}`}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>

      {/* Lightbox Zoom Overlay */}
      {zoomedImg && (
        <div
          id="image-zoom-overlay"
          className="active"
          onClick={() => setZoomedImg(null)}
        >
          <img
            id="image-zoom-img"
            src={zoomedImg.src}
            alt={zoomedImg.alt}
            style={{ width: zoomedImg.width, height: zoomedImg.height }}
          />
        </div>
      )}
    </main>
  );
}
