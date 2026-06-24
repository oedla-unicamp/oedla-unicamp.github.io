import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useConfig } from '../context/ConfigContext';
import { formatPostDatePtBr, formatCategoryLabel } from '../utils/helpers';
import SocialLinks from '../components/Common/SocialLinks';

const placeholderImage = 'posts/img/place-holder.png';

const fallbackEvents = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    titulo: 'I Seminário Internacional sobre Extrema Direita',
    data: '2026-10-25',
    local: 'São Paulo, SP',
    descricao: 'Um debate abrangente com especialistas latino-americanos discutindo a ascensão e os impactos das narrativas de extrema direita.'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    titulo: 'Mesa Redonda: Mídias Sociais e Populismo',
    data: '2026-11-12',
    local: 'Online',
    descricao: 'Análise das dinâmicas e algoritmos que facilitam a difusão de discursos populistas de extrema direita na América Latina.'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    titulo: 'Conferência Regional: Democracia e Resistência',
    data: '2026-12-05',
    local: 'Buenos Aires, Argentina',
    descricao: 'Mapeamento de iniciativas democráticas e estratégias de resistência frente ao avanço do autoritarismo regional.'
  }
];

export default function Home() {
  const { config } = useConfig();
  const navigate = useNavigate();
  const [carouselPosts, setCarouselPosts] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [newsPosts, setNewsPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselTimer = useRef(null);

  // Load Content from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('id, data, categorias, titulo, resumo, poster, tipo, destaque');
        
        if (!postsError && postsData) {
          // Format posts
          const formattedPosts = postsData.map((post, idx) => {
            const categories = post.categorias || [];
            return {
              slug: post.id,
              date: formatPostDatePtBr(post.data),
              categoryLabel: formatCategoryLabel(categories[0] || 'Categoria'),
              title: post.titulo || 'Sem título',
              excerpt: post.resumo || 'Sem resumo disponível.',
              publishedAtTs: Date.parse(String(post.data)) || 0,
              sourceIndex: idx,
              type: post.tipo === 'notícia' || post.tipo === 'noticia' ? 'noticia' : 'blog',
              image: String(post.poster || '').trim(),
              destaque: !!post.destaque,
            };
          });

          // Sort by date descending
          const sorted = [...formattedPosts].sort((a, b) => b.publishedAtTs - a.publishedAtTs || b.sourceIndex - a.sourceIndex);

          // Carousel (destaque = true, max 3)
          let highlights = sorted.filter(p => p.destaque).slice(0, 3);
          if (highlights.length === 0) {
            highlights = sorted.slice(0, 3);
          }
          setCarouselPosts(highlights);

          // Blog (type = blog, max 4)
          const latestBlog = sorted.filter(p => p.type === 'blog').slice(0, 4);
          setBlogPosts(latestBlog);

          // News (type = noticia, max 4)
          const latestNews = sorted.filter(p => p.type === 'noticia').slice(0, 4);
          setNewsPosts(latestNews);
        }

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('eventos')
          .select('*');

        if (!eventsError && eventsData && eventsData.length) {
          const todayStr = new Date().toISOString().split('T')[0];
          const future = [];
          const past = [];
          
          eventsData.forEach(ev => {
            if (ev.data && ev.data >= todayStr) {
              future.push(ev);
            } else {
              past.push(ev);
            }
          });

          future.sort((a, b) => new Date(a.data) - new Date(b.data));
          past.sort((a, b) => new Date(b.data) - new Date(a.data));

          const combined = [...future, ...past].slice(0, 3);
          setEvents(combined);
        } else {
          setEvents(fallbackEvents);
        }
      } catch (err) {
        console.error('Error fetching Home page data:', err);
        setEvents(fallbackEvents);
      }
    }
    loadData();
  }, []);

  // Carousel Autoplay Logic
  const startAutoplay = () => {
    stopAutoplay();
    if (carouselPosts.length > 1) {
      carouselTimer.current = setInterval(() => {
        setCarouselIndex(prev => (prev + 1) % carouselPosts.length);
      }, 7000);
    }
  };

  const stopAutoplay = () => {
    if (carouselTimer.current) clearInterval(carouselTimer.current);
  };

  useEffect(() => {
    if (carouselPosts.length > 0) {
      startAutoplay();
    }
    return () => stopAutoplay();
  }, [carouselPosts]);

  const handlePrevSlide = () => {
    setCarouselIndex(prev => (prev - 1 + carouselPosts.length) % carouselPosts.length);
    startAutoplay();
  };

  const handleNextSlide = () => {
    setCarouselIndex(prev => (prev + 1) % carouselPosts.length);
    startAutoplay();
  };

  const handleDotClick = (idx) => {
    setCarouselIndex(idx);
    startAutoplay();
  };

  // Render hero title helper
  const renderHeroTitle = () => {
    const rawTitle = config?.titulo || 'Observatório da Extrema Direita Latino-Americana';
    if (rawTitle.toLowerCase().includes('observatório da') && rawTitle.toLowerCase().includes('extrema direita')) {
      const part2 = "Extrema Direita";
      let part3 = rawTitle.slice(rawTitle.toLowerCase().indexOf('extrema direita') + part2.length).trim();
      if (part3.startsWith('-')) part3 = part3.slice(1).trim();

      return (
        <h1 className="leading-tight mb-6 text-white text-center w-full">
          <span className="block font-archivo-narrow text-3xl sm:text-4xl md:text-5xl font-medium tracking-[0.18em] mb-2">Observatório da</span>
          <span className="block font-archivo-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight leading-none mb-1 text-white whitespace-nowrap">Extrema Direita</span>
          <span className="block font-archivo-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight leading-none text-white whitespace-nowrap">{part3}</span>
        </h1>
      );
    }
    return <h1 className="leading-tight mb-6 text-white text-center w-full text-3xl sm:text-4xl md:text-5xl font-archivo-black uppercase">{rawTitle}</h1>;
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section overflow-hidden py-24 md:py-32 relative border-b border-gray-800 bg-[#111827] text-white">
        <div 
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}
        ></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-12 items-center w-full">
          <div className="col-span-1 md:col-span-7 flex flex-col items-center text-center relative z-10">
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-4">
              {config?.keywords || 'Investigação, Análise e Notícias'}
            </span>
            {renderHeroTitle()}
            <p className="font-sans text-base md:text-lg text-gray-300 leading-relaxed max-w-xl mb-8">
              {config?.subtitulo || 'Produzimos e reunimos análises críticas e plurais sobre a extrema direita na América Latina. Informação rigorosa em defesa da democracia, dos direitos e do interesse público.'}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm uppercase tracking-wider bg-primary text-gray-900 hover:bg-yellow-400 transition-colors">
                Ler Publicações
              </Link>
              <Link to="/noticias" className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm uppercase tracking-wider border border-gray-700 text-gray-300 hover:border-primary hover:text-primary transition-colors">
                Notícias
              </Link>
              <Link to="/quemsomos" className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm uppercase tracking-wider border border-gray-700 text-gray-300 hover:border-primary hover:text-primary transition-colors">
                Quem Somos
              </Link>
            </div>

            <div className="mt-8 flex flex-col items-center gap-2.5">
              <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-gray-400">Nossas Redes</p>
              <div className="flex flex-wrap gap-3 justify-center oedla-social-links">
                {config?.redes_sociais ? (
                  <SocialLinks links={config.redes_sociais} className="social-link" />
                ) : (
                  <p className="font-sans text-xs text-gray-400">Carregando redes...</p>
                )}
              </div>
            </div>
          </div>

          {/* Map Graphic */}
          <div className="absolute md:relative inset-0 md:inset-auto col-span-1 md:col-span-5 flex h-full md:h-[400px] w-full items-center justify-center pointer-events-none z-0 md:z-10 opacity-50 md:opacity-100 transition-opacity">
            <div className="hidden md:block absolute w-24 md:w-48 h-12 md:h-24 bg-primary opacity-80 rounded-sm z-0 left-[30%] md:left-[35%] top-[25%] md:top-[30%] pointer-events-none"></div>
            <img
              src="https://jnspgpmdmouvkmoqaxlc.supabase.co/storage/v1/object/public/public-assets/latin_america_map.png"
              alt="Mapa da América Latina"
              className="absolute w-full h-full object-contain opacity-30 md:opacity-60 invert z-10"
            />
          </div>
        </div>
      </section>

      {/* Featured Carousel */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-8">
            <span className="w-1.5 h-6 bg-primary rounded-sm"></span>
            <h2 className="font-serif text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Em Destaque</h2>
          </div>

          <div
            className="relative overflow-hidden min-h-[350px]"
            id="home-carousel-container"
            onMouseEnter={stopAutoplay}
            onMouseLeave={startAutoplay}
          >
            {carouselPosts.length > 0 ? (
              <div className="flex transition-transform duration-500 ease-out" id="home-carousel-slides">
                {carouselPosts.map((post, idx) => (
                  <div
                    key={post.slug}
                    className={`home-carousel-slide ${idx === carouselIndex ? 'active' : ''}`}
                    data-index={idx}
                  >
                    <div className="flex flex-col items-start text-left max-w-xl pr-0 md:pr-8">
                      <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                        {post.date} &bull; {post.type === 'noticia' ? 'Notícia' : 'Análise'}
                      </span>
                      <h3 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-4 hover:text-primary transition-colors">
                        <Link to={`/post/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="font-sans text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 line-clamp-4">
                        {post.excerpt}
                      </p>
                      <Link
                        to={`/post/${post.slug}`}
                        className="inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wider text-primary hover:text-gray-900 dark:hover:text-white transition-colors border-b border-primary pb-1"
                      >
                        Ler publicação completa &rarr;
                      </Link>
                    </div>
                    <div className="relative w-full overflow-hidden rounded-lg">
                      <Link to={`/post/${post.slug}`}>
                        <img
                          src={post.image || placeholderImage}
                          alt={post.title}
                          className={post.image ? 'w-full aspect-video md:aspect-[4/3] object-cover rounded-lg shadow-md transition-all duration-500' : 'w-full aspect-video md:aspect-[4/3] object-contain rounded opacity-80 dark:invert dark:opacity-50 transition-all duration-500'}
                        />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex w-full justify-center p-8">
                <p className="font-sans text-sm text-gray-500 text-center">Buscando destaques recentes...</p>
              </div>
            )}

            {carouselPosts.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-between items-center px-4 md:px-0 z-20">
                <div className="flex gap-2" id="home-carousel-dots">
                  {carouselPosts.map((_, idx) => (
                    <button
                      key={idx}
                      className={`carousel-dot ${idx === carouselIndex ? 'active' : ''}`}
                      onClick={() => handleDotClick(idx)}
                      aria-label={`Ir para slide ${idx + 1}`}
                    ></button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevSlide}
                    className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-primary hover:text-gray-900 transition-colors text-gray-700 dark:text-gray-300"
                    aria-label="Anterior"
                  >
                    <i className="fa-solid fa-chevron-left text-xs"></i>
                  </button>
                  <button
                    onClick={handleNextSlide}
                    className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-primary hover:text-gray-900 transition-colors text-gray-700 dark:text-gray-300"
                    aria-label="Próximo"
                  >
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-20">
        
        {/* Blog Previews */}
        <section className="mb-24">
          <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-4 bg-primary rounded-sm"></span>
                <span className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Publicações Acadêmicas</span>
              </div>
              <h2 class="font-serif text-3xl font-bold text-gray-900 dark:text-white">Artigos Recentes</h2>
            </div>
            <Link to="/blog" className="font-sans text-sm font-bold text-gray-900 dark:text-white hover:text-primary transition-colors uppercase tracking-wider">
              Ver todos os artigos &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6" id="home-blog-grid">
            {blogPosts.length > 0 ? (
              blogPosts.map(post => (
                <article
                  key={post.slug}
                  onClick={() => navigate(`/post/${post.slug}`)}
                  className="group relative flex flex-row sm:flex-col items-start gap-4 cursor-pointer w-full"
                >
                  <div className="w-24 h-24 sm:w-full sm:aspect-[4/3] shrink-0 overflow-hidden rounded relative order-2 sm:order-1">
                    <img
                      src={post.image || placeholderImage}
                      alt={post.title}
                      className={post.image ? 'w-full h-full object-cover shadow-sm transition-all duration-500 group-hover:scale-105' : 'w-full h-full object-contain opacity-80 dark:invert dark:opacity-50 transition-all duration-500'}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1 w-full min-w-0 mt-1 order-1 sm:order-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-primary">
                      {post.date} &bull; {post.categoryLabel}
                    </span>
                    <h3 className="font-serif text-sm md:text-base font-bold text-gray-900 dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-3">
                      {post.title}
                    </h3>
                    <span className="font-sans text-[10px] text-gray-400 group-hover:text-primary transition-colors mt-auto flex items-center gap-1">
                      Ler mais &rarr;
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <p className="col-span-full font-sans text-sm text-gray-500 py-8 text-center">Buscando artigos...</p>
            )}
          </div>
        </section>

        {/* News Previews */}
        <section className="mb-24">
          <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-4 bg-primary rounded-sm"></span>
                <span className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Notas e Comunicados</span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">Últimas Notícias</h2>
            </div>
            <Link to="/noticias" className="font-sans text-sm font-bold text-gray-900 dark:text-white hover:text-primary transition-colors uppercase tracking-wider">
              Ver todas as notícias &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6" id="home-news-grid">
            {newsPosts.length > 0 ? (
              newsPosts.map(post => (
                <article
                  key={post.slug}
                  onClick={() => navigate(`/post/${post.slug}`)}
                  className="group relative flex flex-row sm:flex-col items-start gap-4 cursor-pointer w-full"
                >
                  <div className="w-24 h-24 sm:w-full sm:aspect-[4/3] shrink-0 overflow-hidden rounded relative order-2 sm:order-1">
                    <img
                      src={post.image || placeholderImage}
                      alt={post.title}
                      className={post.image ? 'w-full h-full object-cover shadow-sm transition-all duration-500 group-hover:scale-105' : 'w-full h-full object-contain opacity-80 dark:invert dark:opacity-50 transition-all duration-500'}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1 w-full min-w-0 mt-1 order-1 sm:order-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-primary">
                      {post.date} &bull; {post.categoryLabel}
                    </span>
                    <h3 className="font-serif text-sm md:text-base font-bold text-gray-900 dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-3">
                      {post.title}
                    </h3>
                    <span className="font-sans text-[10px] text-gray-400 group-hover:text-primary transition-colors mt-auto flex items-center gap-1">
                      Ler mais &rarr;
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <p className="col-span-full font-sans text-sm text-gray-500 py-8 text-center">Buscando notícias...</p>
            )}
          </div>
        </section>

        {/* Events Previews */}
        <section className="mb-12" id="eventos">
          <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-4 bg-primary rounded-sm"></span>
                <span className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Agenda e Eventos</span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">Próximos Eventos</h2>
            </div>
            <Link to="/eventos" className="font-sans text-sm font-bold text-gray-900 dark:text-white hover:text-primary transition-colors uppercase tracking-wider">
              Ver todos os eventos &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="home-eventos-grid">
            {events.map(evento => {
              const dateStr = formatPostDatePtBr(evento.data);
              const detailsUrl = `/evento/${evento.id}`;
              return (
                <article
                  key={evento.id}
                  className="flex flex-col gap-4 p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-all duration-300"
                >
                  <div className="w-full aspect-[16/10] bg-gray-200 dark:bg-gray-800 rounded overflow-hidden relative">
                    {evento.capa ? (
                      <Link to={detailsUrl}>
                        <img
                          src={evento.capa}
                          alt={evento.titulo}
                          className="w-full h-full object-cover rounded hover:scale-105 transition-all duration-300"
                        />
                      </Link>
                    ) : (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        Capa do Evento
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <time className="font-sans text-xs font-bold uppercase tracking-widest text-primary">{dateStr}</time>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                        <span className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                          {evento.local || 'Sem local'}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        <Link to={detailsUrl} className="hover:text-primary transition-colors line-clamp-2">
                          {evento.titulo}
                        </Link>
                      </h3>
                      <p className="font-sans text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {evento.descricao || ''}
                      </p>
                    </div>
                    <Link to={detailsUrl} className="font-sans text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4 inline-block">
                      Ver mais detalhes &rarr;
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

      </main>
    </>
  );
}
