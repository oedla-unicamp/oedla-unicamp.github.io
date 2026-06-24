import React from 'react';
import PostsPage from '../components/Common/PostsPage';
import { useConfig } from '../context/ConfigContext';

export default function Blog() {
  const { config } = useConfig();
  return (
    <PostsPage
      type="blog"
      title="Blog"
      defaultKeywords={config?.blog_keywords || 'Análises Acadêmicas'}
      defaultSubtitle={config?.blog_subtitulo || 'Artigos extensos, ensaios de fôlego e investigações teóricas e empíricas produzidas pelos pesquisadores do Observatório.'}
    />
  );
}
