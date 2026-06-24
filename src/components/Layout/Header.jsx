import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `font-sans text-sm font-semibold text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary transition-colors border-b-2 pb-1 ${
      isActive ? 'text-primary border-primary' : 'border-transparent'
    }`;

  return (
    <header className={`site-header sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-light/90 dark:bg-dark/90 backdrop-blur-md overflow-hidden ${menuOpen ? 'menu-open' : ''}`}>
      <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <div className="flex flex-row justify-between items-center w-full md:w-auto">
          <NavLink to="/" className="flex flex-col items-start group relative" onClick={closeMenu}>
            <div className="relative">
              <div className="absolute left-[58%] md:left-[59%] top-[10%] bottom-[0%] w-14 sm:w-16 md:w-28 bg-primary z-0 opacity-80 mix-blend-multiply dark:mix-blend-normal pointer-events-none rounded-sm transition-all duration-300 group-hover:scale-105"></div>
              <span className="font-serif text-xl sm:text-2xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors relative z-20">
                OEDLA<span className="text-primary">.</span>
              </span>
              <img
                src="https://jnspgpmdmouvkmoqaxlc.supabase.co/storage/v1/object/public/public-assets/latin_america_map.png"
                alt="Mapa América Latina"
                className="absolute left-[68%] md:left-[68%] top-1/2 -translate-y-[45%] h-10 sm:h-12 md:h-24 w-auto opacity-20 dark:opacity-60 dark:invert pointer-events-none z-10"
              />
            </div>
          </NavLink>

          <button
            className="nav-toggle md:hidden p-2 focus:outline-none"
            type="button"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={toggleMenu}
          >
            <span className="block w-6 h-[2px] bg-gray-800 dark:bg-gray-200 mb-1 transition-transform"></span>
            <span className="block w-6 h-[2px] bg-gray-800 dark:bg-gray-200 mb-1 transition-opacity"></span>
            <span className="block w-6 h-[2px] bg-gray-800 dark:bg-gray-200 transition-transform"></span>
          </button>
        </div>

        <nav
          className={`main-nav ${menuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-6 items-center w-full md:w-auto mt-4 md:mt-0`}
          id="main-nav"
          aria-label="Navegação principal"
        >
          <NavLink to="/" className={navLinkClass} onClick={closeMenu}>
            Início
          </NavLink>
          <NavLink to="/quemsomos" className={navLinkClass} onClick={closeMenu}>
            Quem somos
          </NavLink>
          <NavLink to="/blog" className={navLinkClass} onClick={closeMenu}>
            Blog
          </NavLink>
          <NavLink to="/noticias" className={navLinkClass} onClick={closeMenu}>
            Notícias
          </NavLink>
          <NavLink to="/eventos" className={navLinkClass} onClick={closeMenu}>
            Eventos
          </NavLink>

          <button
            className="theme-toggle ml-2 w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-primary hover:border-primary hover:bg-primary/10 transition-all focus:outline-none"
            type="button"
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            onClick={() => {
              toggleTheme();
              closeMenu();
            }}
          >
            <span
              className={`theme-toggle-icon block w-3.5 h-3.5 rounded-full border-2 border-current relative ${
                theme === 'dark' ? 'border-transparent bg-current' : 'bg-transparent'
              }`}
              aria-hidden="true"
            ></span>
          </button>
        </nav>
      </div>
    </header>
  );
}
