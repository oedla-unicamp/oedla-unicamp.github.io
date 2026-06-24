import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import QuemSomos from './pages/QuemSomos';
import Blog from './pages/Blog';
import Noticias from './pages/Noticias';
import Eventos from './pages/Eventos';
import PostDetail from './pages/PostDetail';
import EventoDetail from './pages/EventoDetail';
import IntegranteDetail from './pages/IntegranteDetail';
import Login from './pages/Login';
import Admin from './pages/Admin';
import { ThemeProvider } from './context/ThemeContext';
import { ConfigProvider } from './context/ConfigContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider>
      <ThemeProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="quemsomos" element={<QuemSomos />} />
              <Route path="blog" element={<Blog />} />
              <Route path="noticias" element={<Noticias />} />
              <Route path="eventos" element={<Eventos />} />
              <Route path="post/:slug" element={<PostDetail />} />
              <Route path="evento/:slug" element={<EventoDetail />} />
              <Route path="integrante/:slug" element={<IntegranteDetail />} />
              <Route path="login" element={<Login />} />
              <Route path="admin" element={<Admin />} />
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </ConfigProvider>
  </React.StrictMode>
);
