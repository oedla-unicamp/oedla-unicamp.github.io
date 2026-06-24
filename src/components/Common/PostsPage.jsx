import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { formatPostDatePtBr, formatCategoryLabel, normalizeCategoryValue, normalizeAuthorKey } from '../../utils/helpers';

const placeholderImage = 'posts/img/place-holder.png';

export default function PostsPage({ type, title, defaultKeywords, defaultSubtitle }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [authorsMap, setAuthorsMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  
  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [limitPerPage, setLimitPerPage] = useState(25);
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Mobile sidebar state
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Load Data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // 1. Fetch Authors index map
        const { data: authorsData, error: authError } = await supabase.from('authors').select('*');
        const authMap = new Map();
        if (!authError && authorsData) {
          authorsData.forEach(author => {
            authMap.set(normalizeAuthorKey(author.id), author);
          });
        }
        setAuthorsMap(authMap);

        // 2. Fetch Posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('id, data, categorias, titulo, resumo, poster, tipo, autor');
        
        if (postsError) throw postsError;

        if (postsData) {
          // Format posts
          const formatted = postsData
            .filter(post => {
              if (type === 'blog') {
                return post.tipo === 'artigo' || post.tipo === 'blog';
              } else {
                return post.tipo === 'notícia' || post.tipo === 'noticia';
              }
            })
            .map(post => {
              const categoriesRaw = post.categorias || [];
              const categories = categoriesRaw.map(normalizeCategoryValue);
              const categoryLabels = categoriesRaw.map(formatCategoryLabel);
              
              // Resolve author
              const authorKey = normalizeAuthorKey(post.autor);
              const authorObj = authMap.get(authorKey);
              const author = authorObj 
                ? { slug: authorKey, name: String(authorObj.nome || authorObj.Nome) }
                : { slug: '', name: String(post.autor || '').trim() };

              return {
                slug: post.id,
                title: post.titulo || 'Sem título',
                excerpt: post.resumo || 'Sem resumo.',
                date: formatPostDatePtBr(post.data),
                sortTs: Date.parse(String(post.data)) || 0,
                categories,
                categoryLabels,
                author,
                image: String(post.poster || '').trim()
              };
            });
          
          setPosts(formatted);
        }
      } catch (e) {
        console.error('Error fetching posts:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [type]);

  // Extract all categories dynamically from fetched posts
  const categoriesMap = new Map();
  posts.forEach(post => {
    post.categories.forEach((cat, idx) => {
      if (!categoriesMap.has(cat)) {
        categoriesMap.set(cat, post.categoryLabels[idx] || cat);
      }
    });
  });
  const categoriesList = Array.from(categoriesMap.entries());

  // Filter & Sort Logic
  const filteredPosts = posts.filter(post => {
    // 1. Category Filter
    const categoryMatches = activeCategory === 'all' || post.categories.includes(activeCategory);
    
    // 2. Search Query Filter
    let searchMatches = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatches = post.title.toLowerCase().includes(q);
      const excerptMatches = post.excerpt.toLowerCase().includes(q);
      const authorMatches = post.author.name.toLowerCase().includes(q);
      searchMatches = titleMatches || excerptMatches || authorMatches;
    }

    return categoryMatches && searchMatches;
  });

  // Sort
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.sortTs - a.sortTs;
    } else {
      return a.sortTs - b.sortTs;
    }
  });

  // Pagination
  const totalItems = sortedPosts.length;
  const totalPages = Math.ceil(totalItems / limitPerPage);
  
  // Safe currentPage check
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (safeCurrentPage - 1) * limitPerPage;
  const paginatedPosts = sortedPosts.slice(startIndex, startIndex + limitPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <section className="mb-16 border-b border-gray-200 dark:border-gray-800 pb-8">
        <p className="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-4" id="page-keywords">
          {defaultKeywords}
        </p>
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-0">
            {title}
          </h1>
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFiltersMobile(prev => !prev)}
            className="lg:hidden shrink-0 flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-primary hover:border-primary transition-all shadow-sm rounded-sm"
            aria-label="Filtrar e Buscar"
          >
            <i className="fa-solid fa-filter text-sm"></i>
          </button>
        </div>
        <p className="font-sans text-xl text-gray-600 dark:text-gray-400 max-w-2xl" id="page-subtitle">
          {defaultSubtitle}
        </p>
      </section>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Sidebar Filters */}
        <aside
          className={`${
            showFiltersMobile ? 'flex' : 'hidden'
          } lg:flex lg:col-span-4 order-2 lg:order-2 lg:sticky lg:top-32 flex-col gap-6 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800 p-6 rounded w-full`}
        >
          {/* Search */}
          <div className="flex flex-col gap-2">
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Buscar</h3>
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por título, autor..."
                className="w-full pl-10 pr-4 py-2 font-sans text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                <i className="fa-solid fa-magnifying-glass text-xs"></i>
              </span>
            </div>
          </div>

          {/* Sort Order */}
          <div className="flex flex-col gap-2">
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Ordenar</h3>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 font-sans text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm rounded-none"
            >
              <option value="newest">Mais novos primeiro</option>
              <option value="oldest">Mais antigos primeiro</option>
            </select>
          </div>

          {/* Page Limit */}
          <div className="flex flex-col gap-2">
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Publicações por página</h3>
            <select
              value={limitPerPage}
              onChange={(e) => {
                setLimitPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 font-sans text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm rounded-none"
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-2">
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Categorias</h3>
            <div className="flex flex-wrap gap-2" id="blog-filters">
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setCurrentPage(1);
                }}
                className={`filter px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider border transition-colors rounded-none ${
                  activeCategory === 'all'
                    ? 'active border-primary text-primary bg-primary/10'
                    : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary'
                }`}
              >
                Todos
              </button>
              {categoriesList.map(([cat, label]) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={`filter px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider border transition-colors rounded-none ${
                    activeCategory === cat
                      ? 'active border-primary text-primary bg-primary/10'
                      : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Column */}
        <div className="lg:col-span-8 order-3 lg:order-1 flex flex-col gap-8 w-full">
          <section className="flex flex-col gap-0" id="posts-grid" aria-live="polite">
            {loading ? (
              <p className="font-sans text-sm text-gray-500 py-12 text-center">Buscando publicações...</p>
            ) : paginatedPosts.length > 0 ? (
              paginatedPosts.map(post => (
                <article
                  key={post.slug}
                  onClick={(e) => {
                    // Prevent navigation if clicking direct anchor links
                    if (e.target.closest('a')) return;
                    navigate(`/post/${post.slug}`);
                  }}
                  className="post-card group relative grid grid-cols-12 gap-4 md:gap-6 items-start py-8 md:py-10 border-b border-gray-200 dark:border-gray-800 last:border-0 cursor-pointer"
                >
                  <div className="col-span-12 md:col-span-2 flex flex-col pt-1 gap-2 text-left">
                    <time className="font-sans text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100">{post.date}</time>
                    <div className="flex flex-wrap gap-1.5 md:flex-col md:items-start">
                      {post.categoryLabels.map((lbl, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-0.5 border border-primary/20 dark:border-primary/30 text-primary text-[9px] font-sans font-bold uppercase tracking-wider bg-primary/5 rounded-none"
                        >
                          {lbl}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-8 md:col-span-7">
                    <h2 className="font-serif text-xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors leading-tight mb-2 md:mb-4">
                      {post.title}
                    </h2>
                    <p className="font-sans text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 md:line-clamp-none">
                      {post.excerpt}
                    </p>
                    {post.author.name && (
                      <p className="font-sans text-xs md:text-sm font-semibold text-gray-500 mt-3">
                        Por:{' '}
                        {post.author.slug ? (
                          <Link to={`/integrante/${post.author.slug}`} className="relative z-20 hover:text-primary transition-colors">
                            {post.author.name}
                          </Link>
                        ) : (
                          <span>{post.author.name}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="col-span-4 md:col-span-3">
                    <img
                      src={post.image || placeholderImage}
                      alt={post.title}
                      className={post.image ? 'w-full aspect-[4/3] object-cover rounded shadow-sm transition-all duration-500' : 'w-full aspect-[4/3] object-contain rounded opacity-80 dark:invert dark:opacity-50 transition-all duration-500'}
                    />
                  </div>
                </article>
              ))
            ) : (
              <p className="font-sans text-sm text-gray-500 py-12 text-center">Nenhuma publicação corresponde aos critérios.</p>
            )}
          </section>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div id="pagination-controls" className="flex justify-center items-center gap-2 mt-8 py-4 border-t border-gray-200 dark:border-gray-800">
              {safeCurrentPage > 1 ? (
                <button
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  className="page-btn px-3 py-1.5 text-xs font-bold font-sans border border-gray-200 dark:border-gray-800 hover:border-primary hover:text-primary transition-colors text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                >
                  Anterior
                </button>
              ) : (
                <button
                  className="px-3 py-1.5 text-xs font-bold font-sans border border-gray-200 dark:border-gray-900 text-gray-300 dark:text-gray-700 cursor-not-allowed bg-gray-50/50 dark:bg-gray-900/10"
                  disabled
                >
                  Anterior
                </button>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                pageNum === safeCurrentPage ? (
                  <button
                    key={pageNum}
                    className="px-3 py-1.5 text-xs font-bold font-sans border border-primary text-primary bg-primary/10 cursor-default"
                    disabled
                  >
                    {pageNum}
                  </button>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className="page-btn px-3 py-1.5 text-xs font-bold font-sans border border-gray-200 dark:border-gray-800 hover:border-primary hover:text-primary transition-colors text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                  >
                    {pageNum}
                  </button>
                )
              ))}

              {safeCurrentPage < totalPages ? (
                <button
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  className="page-btn px-3 py-1.5 text-xs font-bold font-sans border border-gray-200 dark:border-gray-800 hover:border-primary hover:text-primary transition-colors text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                >
                  Próxima
                </button>
              ) : (
                <button
                  className="px-3 py-1.5 text-xs font-bold font-sans border border-gray-200 dark:border-gray-900 text-gray-300 dark:text-gray-700 cursor-not-allowed bg-gray-50/50 dark:bg-gray-900/10"
                  disabled
                >
                  Próxima
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
