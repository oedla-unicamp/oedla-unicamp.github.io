import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { formatPostDatePtBr } from '../utils/helpers';

const placeholderImage = 'posts/img/place-holder.png';

const mockEvents = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    titulo: 'I Seminário Internacional sobre Extrema Direita',
    data: '2026-10-25',
    local: 'São Paulo, SP',
    descricao: 'Um debate abrangente com especialistas latino-americanos discutindo a ascensão e os impactos das narrativas de extrema direita. O seminário contará com palestras magnas, painéis de discussão e apresentação de trabalhos científicos.\n\n### Programação Prevista:\n- **09:00** - Abertura oficial e credenciamento\n- **10:00** - Painel 1: Teorias da Conspiração e Política Regional\n- **14:00** - Painel 2: Economia e Autoritarismo\n- **17:00** - Palestra de encerramento\n\nParticipe presencialmente ou assista à transmissão ao vivo pelo canal oficial do OEDLA no YouTube.',
    capa: '',
    imagens: []
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    titulo: 'Mesa Redonda: Mídias Sociais e Populismo',
    data: '2026-11-12',
    local: 'Online',
    descricao: 'Análise das dinâmicas e algoritmos que facilitam a difusão de discursos populistas de extrema direita na América Latina. Nossos palestrantes debaterão o papel das grandes plataformas, a desinformação programática e os desafios regulatórios e democráticos.\n\n### Eixos Temáticos:\n1. Algoritmos de recomendação e radicalização\n2. Campanhas coordenadas de desinformação\n3. Regulação de plataformas sob perspectiva latino-americana',
    capa: '',
    imagens: []
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    titulo: 'Conferência Regional: Democracia e Resistência',
    data: '2026-12-05',
    local: 'Buenos Aires, Argentina',
    descricao: 'Mapeamento de iniciativas democráticas e estratégias de resistência frente ao avanço do autoritarismo regional. O evento reunirá ativistas, acadêmicos e formuladores de políticas públicas para construir pontes e propor soluções inovadoras.\n\nMais informações sobre as mesas redondas e chamadas para artigos acadêmicos serão divulgadas em breve.',
    capa: '',
    imagens: []
  }
];

export default function Eventos() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('eventos')
          .select('*');

        if (!error && data && data.length > 0) {
          setEvents(data);
        } else {
          setEvents(mockEvents);
        }
      } catch (err) {
        console.warn('Error fetching events from DB, using fallback mock events:', err);
        setEvents(mockEvents);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const futureEvents = [];
  const pastEvents = [];

  events.forEach(ev => {
    if (ev.data && ev.data >= todayStr) {
      futureEvents.push(ev);
    } else {
      pastEvents.push(ev);
    }
  });

  // Sort: future chronologically, past reverse-chronologically
  futureEvents.sort((a, b) => new Date(a.data) - new Date(b.data));
  pastEvents.sort((a, b) => new Date(b.data) - new Date(a.data));

  const renderEventCard = (evento) => {
    const dateStr = formatPostDatePtBr(evento.data);
    const capaUrl = evento.capa || placeholderImage;
    const detailsUrl = `/evento/${evento.id}`;

    return (
      <article key={evento.id} className="flex flex-col md:flex-row gap-6 p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-all duration-300 w-full">
        <div className="md:w-1/3 shrink-0 h-48 md:h-40 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden relative">
          <Link to={detailsUrl}>
            <img
              src={capaUrl}
              alt={evento.titulo}
              className="w-full h-full object-cover rounded hover:scale-105 transition-all duration-300"
            />
          </Link>
        </div>
        <div className="flex flex-col justify-between py-1 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <time className="font-sans text-xs font-bold uppercase tracking-widest text-primary">{dateStr}</time>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{evento.local || 'Sem local'}</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              <Link to={detailsUrl} className="hover:text-primary transition-colors">
                {evento.titulo}
              </Link>
            </h3>
            <p className="font-sans text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
              {evento.descricao || ''}
            </p>
          </div>
          <Link to={detailsUrl} className="font-sans text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4">
            Ver mais detalhes &rarr;
          </Link>
        </div>
      </article>
    );
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <section className="mb-16 border-b border-gray-200 dark:border-gray-800 pb-8">
        <p className="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-4">Agenda</p>
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
          Eventos
        </h1>
      </section>

      <section className="flex flex-col gap-6" id="eventos-list-grid" aria-live="polite">
        {loading ? (
          <p className="font-sans text-sm text-gray-500 py-12 text-center">Buscando agenda de eventos...</p>
        ) : (
          <>
            {futureEvents.length > 0 && (
              <div className="flex flex-col gap-6">
                <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white mb-4">Próximos Eventos</h2>
                <div className="flex flex-col gap-6">
                  {futureEvents.map(renderEventCard)}
                </div>
              </div>
            )}

            {pastEvents.length > 0 && (
              <div className={futureEvents.length > 0 ? 'mt-20 pt-10 border-t border-gray-200 dark:border-gray-800' : ''}>
                <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white mb-8">Eventos Anteriores</h2>
                <div className="flex flex-col gap-6">
                  {pastEvents.map(renderEventCard)}
                </div>
              </div>
            )}

            {futureEvents.length === 0 && pastEvents.length === 0 && (
              <p className="font-sans text-sm text-gray-500 text-center py-12">Nenhum evento agendado ou realizado.</p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
