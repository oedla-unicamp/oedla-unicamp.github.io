import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';
import { supabase } from '../supabase';
import { formatPostDatePtBr } from '../utils/helpers';

const placeholderImage = 'posts/img/place-holder.png';

const mockEvents = {
  '11111111-1111-1111-1111-111111111111': {
    id: '11111111-1111-1111-1111-111111111111',
    titulo: 'I Seminário Internacional sobre Extrema Direita',
    data: '2026-10-25',
    local: 'São Paulo, SP',
    descricao: 'Um debate abrangente com especialistas latino-americanos discutindo a ascensão e os impactos das narrativas de extrema direita. O seminário contará com palestras magnas, painéis de discussão e apresentação de trabalhos científicos.\n\n### Programação Prevista:\n- **09:00** - Abertura oficial e credenciamento\n- **10:00** - Painel 1: Teorias da Conspiração e Política Regional\n- **14:00** - Painel 2: Economia e Autoritarismo\n- **17:00** - Palestra de encerramento\n\nParticipe presencialmente ou assista à transmissão ao vivo pelo canal oficial do OEDLA no YouTube.',
    capa: '',
    imagens: []
  },
  '22222222-2222-2222-2222-222222222222': {
    id: '22222222-2222-2222-2222-222222222222',
    titulo: 'Mesa Redonda: Mídias Sociais e Populismo',
    data: '2026-11-12',
    local: 'Online',
    descricao: 'Análise das dinâmicas e algoritmos que facilitam a difusão de discursos populistas de extrema direita na América Latina. Nossos palestrantes debaterão o papel das grandes plataformas, a desinformação programática e os desafios regulatórios e democráticos.\n\n### Eixos Temáticos:\n1. Algoritmos de recomendação e radicalização\n2. Campanhas coordenadas de desinformação\n3. Regulação de plataformas sob perspectiva latino-americana',
    capa: '',
    imagens: []
  },
  '33333333-3333-3333-3333-333333333333': {
    id: '33333333-3333-3333-3333-333333333333',
    titulo: 'Conferência Regional: Democracia e Resistência',
    data: '2026-12-05',
    local: 'Buenos Aires, Argentina',
    descricao: 'Mapeamento de iniciativas democráticas e estratégias de resistência frente ao avanço do autoritarismo regional. O evento reunirá ativistas, acadêmicos e formuladores de políticas públicas para construir pontes e propor soluções inovadoras.\n\nMais informações sobre as mesas redondas e chamadas para artigos acadêmicos serão divulgadas em breve.',
    capa: '',
    imagens: []
  }
};

export default function EventoDetail() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEventData() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', slug)
          .single();

        if (!error && data) {
          setEvent(data);
        } else if (mockEvents[slug]) {
          setEvent(mockEvents[slug]);
        } else {
          setEvent(null);
        }
      } catch (err) {
        if (mockEvents[slug]) {
          setEvent(mockEvents[slug]);
        } else {
          setEvent(null);
        }
      } finally {
        setLoading(false);
      }
    }
    loadEventData();
  }, [slug]);

  // Set Page Meta
  useEffect(() => {
    if (event) {
      document.title = `${event.titulo || 'Evento'} | OEDLA`;
    }
  }, [event]);

  const parsedHtml = event?.descricao ? marked.parse(event.descricao) : '';
  const imagesList = Array.isArray(event?.imagens) ? event.imagens : [];

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="font-sans text-sm text-gray-500">Carregando detalhes do evento...</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white mb-4">Evento não encontrado</h1>
        <Link to="/eventos" className="font-sans text-sm text-primary hover:underline">
          Voltar para Eventos
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <div className="mb-12">
        <p className="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-6">
          <Link to="/eventos" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            &larr; Voltar para Eventos
          </Link>
        </p>
        <div className="flex items-center gap-3 mb-6">
          <time className="font-sans text-xs font-bold uppercase tracking-widest text-primary">
            {formatPostDatePtBr(event.data)}
          </time>
          <span className="w-1 h-1 rounded-full bg-primary"></span>
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {event.local || 'Sem local'}
          </span>
        </div>
        <h1 className="font-serif text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-8">
          {event.titulo}
        </h1>
      </div>

      <div className="flex flex-col">
        {event.capa && (
          <div className="mb-10 w-full">
            <img
              src={event.capa}
              alt={event.titulo}
              className="w-full h-auto aspect-video object-cover rounded shadow-md"
            />
          </div>
        )}
        <div
          className="post-markdown max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-sans text-lg"
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />

        {imagesList.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-6">Galeria de Imagens</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagesList.map((img, idx) => (
                <div key={idx} className="overflow-hidden rounded bg-gray-100 dark:bg-gray-800 aspect-video">
                  <img
                    src={img}
                    alt={`Foto ${idx + 1} do evento`}
                    className="w-full h-full object-cover hover:scale-105 transition-all duration-300"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
