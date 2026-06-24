import React from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import SocialLinks from '../Common/SocialLinks';

export default function Footer() {
  const { config } = useConfig();
  const redes = config?.redes_sociais || [];
  
  // Add RSS Feed to redes
  const rssLink = { titulo: 'Feed RSS', url: '/feed.xml', icone: 'rss' };
  const allRedes = [...redes, rssLink];

  return (
    <footer className="site-footer bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 mt-20" role="contentinfo">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="footer-brand-block col-span-1">
          <h2 className="leading-tight mb-4 text-gray-900 dark:text-white text-center md:text-left">
            <span className="block font-archivo-narrow text-xs font-semibold tracking-[0.15em] mb-1 uppercase">Observatório da</span>
            <span className="block font-archivo-black text-xl uppercase tracking-tight leading-none mb-0.5">Extrema Direita</span>
            <span className="block font-archivo-black text-xl uppercase tracking-tight leading-none">Latino-Americana</span>
          </h2>
          <p className="font-sans text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-center md:text-left">
            Análises acadêmicas e pesquisas sobre os movimentos de extrema direita na América Latina, promovendo o debate
            crítico e informado sobre os desafios democráticos contemporâneos.
          </p>
        </div>

        <div className="footer-links-block col-span-1">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 text-center md:text-left">Navegação</h3>
          <ul className="space-y-3 text-center md:text-left">
            <li>
              <Link to="/" className="font-sans text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
                Página inicial
              </Link>
            </li>
            <li>
              <Link to="/quemsomos" className="font-sans text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
                Quem somos
              </Link>
            </li>
            <li>
              <Link to="/quemsomos#equipe" className="font-sans text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
                Integrantes
              </Link>
            </li>
            <li>
              <Link to="/blog" className="font-sans text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/noticias" className="font-sans text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
                Notícias
              </Link>
            </li>
            <li>
              <Link to="/eventos" className="font-sans text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
                Eventos
              </Link>
            </li>
          </ul>
        </div>

        <div className="footer-contact-block col-span-1">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 text-center md:text-left">Informações</h3>
          <div className="space-y-3 font-sans text-sm text-gray-600 dark:text-gray-300 text-center md:text-left">
            <p><strong>Atuação:</strong> Pesquisa acadêmica, monitoramento eleitoral e análise conjuntural.</p>
            <p><strong>Local:</strong> América Latina</p>
            <p><strong>Apoio:</strong> Unicamp | CNPq | CAPES</p>
          </div>
          <div className="mt-6 flex flex-col gap-2 items-center md:items-start">
            <h4 className="font-sans text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Nossas Redes</h4>
            <div className="oedla-social-links flex flex-wrap gap-3 justify-center md:justify-start">
              <SocialLinks links={allRedes} className="social-link" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="font-sans text-xs text-gray-500 dark:text-gray-400">
          OEDLA. Todos os direitos reservados. |{' '}
          <Link to="/login" className="hover:text-primary transition-colors">
            Acesso Restrito
          </Link>
        </p>
        <p className="font-sans text-xs text-gray-500 dark:text-gray-400">
          Site feito por{' '}
          <a href="https://universitas-io.github.io/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors font-semibold">
            Universitas Solutions
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
