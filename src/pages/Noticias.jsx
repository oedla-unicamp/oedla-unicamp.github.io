import React from 'react';
import PostsPage from '../components/Common/PostsPage';
import { useConfig } from '../context/ConfigContext';

export default function Noticias() {
  const { config } = useConfig();
  return (
    <PostsPage
      type="noticia"
      title="Notícias"
      defaultKeywords={config?.noticias_keywords || 'Notas e Comunicados'}
      defaultSubtitle={config?.noticias_subtitulo || 'Comunicados, notas rápidas e informes políticos sobre a extrema-direita na América Latina.'}
    />
  );
}
