import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { formatPostDatePtBr, formatCategoryLabel, normalizeAuthorKey } from '../utils/helpers';
import SocialLinks from '../components/Common/SocialLinks';

export default function IntegranteDetail() {
  const { slug } = useParams();
  const [person, setPerson] = useState(null);
  const [authoredPosts, setAuthoredPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const memberKey = normalizeAuthorKey(slug);
        
        // 1. Fetch Author info
        const { data: authorData, error: authorError } = await supabase
          .from('authors')
          .select('*')
          .eq('id', memberKey)
          .single();

        if (authorError || !authorData) {
          setPerson(null);
          setLoading(false);
          return;
        }

        setPerson(authorData);

        // 2. Fetch Posts written by this author
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('id, data, categorias, titulo, resumo, tipo')
          .eq('autor', memberKey);

        if (!postsError && postsData) {
          const sorted = postsData.map(post => ({
            slug: post.id,
            title: post.titulo || 'Sem título',
            date: formatPostDatePtBr(post.data),
            excerpt: post.resumo || 'Sem resumo.',
            categoryLabels: (post.categorias || []).map(formatCategoryLabel),
            sortTs: Date.parse(String(post.data)) || 0
          })).sort((a, b) => b.sortTs - a.sortTs);

          setAuthoredPosts(sorted);
        }
      } catch (e) {
        console.error('Error loading member details:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  // Set Page Meta
  useEffect(() => {
    if (person) {
      document.title = `${person.nome || 'Integrante'} | OEDLA`;
    }
  }, [person]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="font-sans text-sm text-gray-500">Carregando informações do integrante...</p>
      </main>
    );
  }

  if (!person) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white mb-4">Integrante não encontrado</h1>
        <Link to="/quemsomos" className="font-sans text-sm text-primary hover:underline">
          Voltar para Equipe
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      
      {/* Integrante Header */}
      <div className="mb-12">
        <p className="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-6">
          <Link to="/quemsomos" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            &larr; Voltar para Equipe
          </Link>
        </p>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {person.foto ? (
            <div className="w-32 h-32 md:w-48 md:h-48 shrink-0">
              <img
                className="w-full h-full object-cover rounded-full transition-all duration-500 shadow-md"
                src={person.foto}
                alt={person.nome}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-full bg-gray-200 dark:bg-gray-800 shadow-md flex items-center justify-center text-gray-400 dark:text-gray-600 text-4xl font-bold">
              {person.nome ? person.nome.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              {person.nome}
            </h1>
            <p className="font-sans text-sm md:text-base font-bold uppercase tracking-widest text-primary mt-2">
              {person.cargo}
              {person.cargo && person.formacao ? ' • ' : ''}
              {person.formacao}
            </p>
            <div className="mt-6 flex gap-3 relative z-20">
              <SocialLinks links={person.links} className="integrante-link" />
            </div>
          </div>
        </div>
      </div>

      {/* Mini Biography */}
      <div className="font-sans text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl border-t border-gray-200 dark:border-gray-800 pt-10">
        {person.minibiografia ? (
          <p className="whitespace-pre-wrap">{person.minibiografia}</p>
        ) : (
          <p className="italic text-gray-400 text-sm">Sem minibiografia cadastrada.</p>
        )}
      </div>

      {/* Authored Publications */}
      {authoredPosts.length > 0 && (
        <section className="mt-20 pt-10 border-t border-gray-200 dark:border-gray-800">
          <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">Publicações do Autor</h2>
          <div className="flex flex-col gap-0 border-t border-gray-200 dark:border-gray-800 mt-8 pt-8">
            {authoredPosts.map(post => (
              <article key={post.slug} className="group relative py-8 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0 flex flex-col items-start">
                <Link className="absolute inset-0 z-10" to={`/post/${post.slug}`} aria-label={post.title}></Link>
                <div className="flex items-center gap-3 mb-3">
                  <time className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {post.date}
                  </time>
                  {post.categoryLabels.length > 0 && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-primary"></span>
                      <span className="font-sans text-xs font-bold uppercase tracking-widest text-primary">
                        {post.categoryLabels.join(' • ')}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors leading-tight mb-2">
                  {post.title}
                </h3>
                <p className="font-sans text-sm text-gray-600 dark:text-gray-400">
                  {post.excerpt}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}
