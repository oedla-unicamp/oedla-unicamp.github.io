import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useConfig } from '../context/ConfigContext';
import SocialLinks from '../components/Common/SocialLinks';

const fallbackQuemSomos = [
  'O Observatório da Extrema-Direita Latino-americana (OEDLA), registrado no Diretório de Grupos de Pesquisa (DGP) do CNPq desde 12 de agosto de 2025, é sediado no Centro de Estudos Marxistas (CEMARX) da Unicamp.',
  'Sob a coordenação do professor André Kaysel Velasco e Cruz, o grupo dedica-se ao estudo, pesquisa científica e difusão do conhecimento acerca das extremas-direitas contemporâneas na América Latina e suas conexões transnacionais.'
];

const fallbackOrigem = [
  'O grupo nasceu do projeto "A Sagrada Família da Extrema-Direita ao Sul da América: uma análise comparada de Argentina, Bolívia, Brasil e Chile (2015-2025)", financiado pelo FAEPEX/Unicamp.',
  'O escopo inicial foi o estudo comparado do discurso ideológico das principais lideranças da extrema-direita na região entre a crise da "maré rosa" e a ascensão de novas expressões radicalizadas.'
];

const fallbackMissao = [
  { titulo: 'Produção Científica', descricao: 'Divulgação da produção científica da equipe: artigos, capítulos e teses.' },
  { titulo: 'Pesquisas Externas', descricao: 'Difusão de pesquisas externas sobre a extrema-direita latino-americana.' },
  { titulo: 'Parcerias Institucionais', descricao: 'Parcerias com outros observatórios e grupos de pesquisa da área.' },
  { titulo: 'Notas de Conjuntura', descricao: 'Notas curtas e informes de conjuntura política sobre os movimentos da extrema-direita.' },
  { titulo: 'Monitoramento de Mídia', descricao: 'Monitoramento da imprensa e meios de comunicação relacionados ao tema.' },
  { titulo: 'Repositório de Fontes', descricao: 'Repositório de fontes primárias: discursos, documentos e material audiovisual.' }
];

const fallbackAtividades = [
  'Além da pesquisa, promovemos grupos de estudos mensais dedicados à leitura de obras das Ciências Sociais, Ciência Política e História.',
  'Também organizamos seminários públicos no IFCH-Unicamp e estamos preparando o lançamento de um podcast com entrevistas a pesquisadores da área.'
];

export default function QuemSomos() {
  const { config } = useConfig();
  const [integrantes, setIntegrantes] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Load Integrantes/Authors
  useEffect(() => {
    async function loadMembers() {
      try {
        setLoadingMembers(true);
        const { data, error } = await supabase
          .from('authors')
          .select('*')
          .order('nome', { ascending: true });
        
        if (!error && data) {
          setIntegrantes(data);
        }
      } catch (e) {
        console.error('Error fetching OEDLA authors:', e);
      } finally {
        setLoadingMembers(false);
      }
    }
    loadMembers();
  }, []);

  const qsParagrafos = config?.quem_somos?.paragrafos || fallbackQuemSomos;
  const origemParagrafos = config?.nossa_origem?.paragrafos || fallbackOrigem;
  const atividadesParagrafos = config?.atividades?.paragrafos || fallbackAtividades;
  const missaoItens = config?.atividades?.missao || fallbackMissao;

  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      
      {/* Sobre o Observatório */}
      <section className="mb-20">
        <p className="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-4">Sobre o Observatório</p>
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-8">Quem somos</h1>
        <div id="qs-quem-somos" className="font-sans text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed space-y-6">
          {qsParagrafos.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="font-sans text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Nossas Redes</p>
          <div className="flex flex-wrap gap-4 oedla-social-links">
            {config?.redes_sociais ? (
              <SocialLinks links={config.redes_sociais} className="social-link" />
            ) : (
              <p className="font-sans text-sm text-gray-500">Carregando redes...</p>
            )}
          </div>
        </div>
      </section>

      {/* Nossa Origem */}
      <section id="origem" className="mb-20">
        <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white mb-6">Nossa Origem</h2>
        <div id="qs-nossa-origem" className="space-y-6">
          {origemParagrafos.map((p, idx) => {
            if (idx === 0) {
              return (
                <p key={idx} className="font-sans text-xl text-gray-800 dark:text-gray-200 font-medium mb-6">
                  <em className="italic font-serif">{p}</em>
                </p>
              );
            }
            return (
              <p key={idx} className="font-sans text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                {p}
              </p>
            );
          })}
        </div>
      </section>

      {/* Nossa Missão */}
      <section id="missao" className="mb-20">
        <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white mb-6">Nossa Missão de Difusão</h2>
        <p className="font-sans text-lg text-gray-600 dark:text-gray-400 mb-10">O OEDLA atua na difusão dos seguintes conteúdos:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10" id="qs-missao">
          {missaoItens.map((item, idx) => (
            <div key={idx}>
              <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-2">{item.titulo}</h3>
              <p className="font-sans text-base text-gray-600 dark:text-gray-400">{item.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Atividades */}
      <section id="atividades" className="mb-24">
        <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white mb-6">Atividades</h2>
        <div id="qs-atividades" className="font-sans text-lg text-gray-600 dark:text-gray-400 leading-relaxed space-y-6">
          {atividadesParagrafos.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      </section>

      {/* Equipe */}
      <section id="equipe">
        <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white mb-10 border-b border-gray-200 dark:border-gray-800 pb-4">Equipe</h2>
        <div className="flex flex-col gap-0" id="integrantes-grid" aria-live="polite">
          {loadingMembers ? (
            <p className="font-sans text-sm text-gray-500 py-8 text-center">Buscando equipe...</p>
          ) : integrantes.length > 0 ? (
            integrantes.map(person => {
              const profileUrl = `/integrante/${person.id}`;
              return (
                <article key={person.id} className="group relative flex items-start gap-6 py-8 border-b border-gray-200 dark:border-gray-800 last:border-0">
                  <Link className="absolute inset-0 z-10" to={profileUrl} aria-label={person.nome}></Link>
                  {person.foto ? (
                    <div className="relative z-20 block w-20 h-20 md:w-24 md:h-24 shrink-0">
                      <img
                        className="w-full h-full object-cover rounded-full transition-all duration-500"
                        src={person.foto}
                        alt={`Foto de ${person.nome}`}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-600 text-xl font-bold">
                      {person.nome ? person.nome.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                      {person.nome}
                    </h2>
                    <p className="font-sans text-xs md:text-sm font-bold uppercase tracking-widest text-primary">
                      {person.cargo} &bull; {person.formacao}
                    </p>
                    <div className="relative z-20 mt-2 flex gap-3">
                      <SocialLinks links={person.links} className="integrante-link" />
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="font-sans text-sm text-gray-500 py-8 text-center">Nenhum integrante cadastrado.</p>
          )}
        </div>
      </section>

    </main>
  );
}
