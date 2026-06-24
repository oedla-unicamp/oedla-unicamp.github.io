import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useConfig } from '../context/ConfigContext';

export default function Admin() {
  const navigate = useNavigate();
  const { refreshConfig } = useConfig();
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active view: 'posts', 'edit-post', 'authors', 'edit-author', 'events', 'edit-event', 'info'
  const [activeTab, setActiveTab] = useState('posts');

  // Lists
  const [posts, setPosts] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [events, setEvents] = useState([]);

  // EasyMDE Ref
  const easyMdeRef = useRef(null);

  // Form states: Posts
  const [postForm, setPostForm] = useState({
    originalId: '',
    id: '',
    titulo: '',
    autor: '',
    data: '',
    tipo: 'artigo',
    destaque: false,
    categorias: '',
    tags: '',
    resumo: '',
    poster: ''
  });
  const [postBodyImage, setPostBodyImage] = useState('');
  const [postBodyMarkdown, setPostBodyMarkdown] = useState('');
  const [postSaving, setPostSaving] = useState(false);

  // Form states: Authors
  const [authorForm, setAuthorForm] = useState({
    originalId: '',
    id: '',
    nome: '',
    cargo: '',
    formacao: '',
    minibiografia: '',
    foto: '',
    linkLattes: '',
    linkOrcid: '',
    linkInstagram: '',
    linkX: '',
    linkBluesky: '',
    linkLinkedin: '',
    otherLinks: [] // array of { titulo, url }
  });
  const [authorSaving, setAuthorSaving] = useState(false);
  const [returnToPostOnAuthorSave, setReturnToPostOnAuthorSave] = useState(false);

  // Form states: Events
  const [eventForm, setEventForm] = useState({
    id: '',
    titulo: '',
    data: '',
    local: '',
    capa: '',
    descricao: ''
  });
  const [eventSaving, setEventSaving] = useState(false);

  // Form states: Info / Settings
  const [infoForm, setInfoForm] = useState({
    titulo: '',
    subtitulo: '',
    keywords: '',
    linkInstagram: '',
    linkX: '',
    linkBluesky: '',
    linkLinkedin: '',
    linkYoutube: '',
    linkFacebook: '',
    otherSocials: [], // array of { titulo, url }
    quem_somos: '',
    nossa_origem: '',
    atividades: '',
    missao: [], // array of { titulo, descricao }
    blog_keywords: '',
    blog_subtitulo: '',
    noticias_keywords: '',
    noticias_subtitulo: ''
  });
  const [infoSaving, setInfoSaving] = useState(false);

  // Authentication & Admin Check
  useEffect(() => {
    async function checkAuth() {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        navigate('/login');
        return;
      }
      
      setSession(currentSession);
      
      // Check admin role
      try {
        const { data: admin, error } = await supabase
          .from('admins')
          .select('uid')
          .eq('uid', currentSession.user.id)
          .single();
        
        if (error || !admin) {
          alert('Acesso negado: Usuário não é administrador.');
          await supabase.auth.signOut();
          navigate('/login');
          return;
        }
        
        setIsAdmin(true);
        loadPosts();
      } catch (err) {
        console.error(err);
        alert('Erro ao validar acesso administrador.');
        await supabase.auth.signOut();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [navigate]);

  // Load EasyMDE when edit-post view is mounted
  useEffect(() => {
    if (activeTab === 'edit-post' && window.EasyMDE) {
      // Destroy any lingering instance
      if (easyMdeRef.current) {
        easyMdeRef.current.toTextArea();
      }

      easyMdeRef.current = new window.EasyMDE({
        element: document.getElementById('post-conteudo-textarea'),
        spellChecker: false,
        status: false
      });

      easyMdeRef.current.value(postBodyMarkdown);

      easyMdeRef.current.codemirror.on('change', () => {
        setPostBodyMarkdown(easyMdeRef.current.value());
      });
    }

    return () => {
      if (easyMdeRef.current) {
        easyMdeRef.current.toTextArea();
        easyMdeRef.current = null;
      }
    };
  }, [activeTab, postBodyMarkdown]);

  // Load lists when tabs change
  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'posts') loadPosts();
      if (activeTab === 'authors') loadAuthors();
      if (activeTab === 'events') loadEvents();
      if (activeTab === 'info') loadInfo();
    }
  }, [activeTab, isAdmin]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const generateSlug = (str) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // ----- CRUD: POSTS -----
  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
      
      // Load authors into cache to populate options
      const { data: authorsData } = await supabase
        .from('authors')
        .select('id, nome')
        .order('nome', { ascending: true });
      if (authorsData) setAuthors(authorsData);
    } catch (e) {
      console.error('Error loading posts:', e);
    }
  };

  const handleNewPost = () => {
    setPostForm({
      originalId: '',
      id: '',
      titulo: '',
      autor: '',
      data: new Date().toISOString().split('T')[0],
      tipo: 'artigo',
      destaque: false,
      categorias: '',
      tags: '',
      resumo: '',
      poster: ''
    });
    setPostBodyMarkdown('');
    setPostBodyImage('');
    setActiveTab('edit-post');
  };

  const handleEditPost = async (id) => {
    try {
      const { data: p, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;

      setPostForm({
        originalId: p.id,
        id: p.id,
        titulo: p.titulo || '',
        autor: p.autor || '',
        data: p.data || '',
        tipo: p.tipo || 'artigo',
        destaque: !!p.destaque,
        categorias: (p.categorias || []).join(', '),
        tags: (p.tags || []).join(', '),
        resumo: p.resumo || '',
        poster: p.poster || ''
      });
      setPostBodyMarkdown(p.conteudo || '');
      setPostBodyImage('');
      setActiveTab('edit-post');
    } catch (err) {
      alert('Erro ao carregar publicação: ' + err.message);
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta publicação?')) {
      try {
        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (error) throw error;
        loadPosts();
      } catch (err) {
        alert('Erro ao deletar: ' + err.message);
      }
    }
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    setPostSaving(true);

    let id = postForm.id.trim();
    if (!id && !postForm.originalId) {
      id = generateSlug(postForm.titulo);
    } else if (postForm.originalId && !id) {
      id = postForm.originalId;
    }

    const postData = {
      id,
      titulo: postForm.titulo,
      autor: postForm.autor,
      data: postForm.data,
      tipo: postForm.tipo,
      destaque: postForm.destaque,
      categorias: postForm.categorias.split(',').map(s => s.trim()).filter(Boolean),
      tags: postForm.tags.split(',').map(s => s.trim()).filter(Boolean),
      resumo: postForm.resumo,
      poster: postForm.poster,
      conteudo: postBodyMarkdown,
      imagens: []
    };

    try {
      // If slug ID changed, delete old record
      if (postForm.originalId && postForm.originalId !== id) {
        await supabase.from('posts').delete().eq('id', postForm.originalId);
      }
      const { error } = await supabase.from('posts').upsert(postData);
      if (error) throw error;

      alert('Publicação salva com sucesso!');
      setActiveTab('posts');
    } catch (err) {
      alert('Erro ao salvar publicação: ' + err.message);
    } finally {
      setPostSaving(false);
    }
  };

  const handleImageUpload = async (e, bucketName, targetField, previewField) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (targetField === 'poster') {
        setPostForm(prev => ({ ...prev, poster: publicUrl }));
      } else if (targetField === 'foto') {
        setAuthorForm(prev => ({ ...prev, foto: publicUrl }));
      } else if (targetField === 'capa') {
        setEventForm(prev => ({ ...prev, capa: publicUrl }));
      } else if (targetField === 'body-image') {
        setPostBodyImage(`![Imagem](${publicUrl})`);
      }
      alert('Imagem carregada com sucesso!');
    } catch (err) {
      alert('Erro no upload: ' + err.message);
    }
  };

  const handleCopyBodyImage = () => {
    navigator.clipboard.writeText(postBodyImage);
    alert('Markdown de imagem copiado para a área de transferência!');
  };

  // ----- CRUD: MEMBERS/AUTHORS -----
  const loadAuthors = async () => {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      setAuthors(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewAuthor = (returnToPost = false) => {
    setReturnToPostOnAuthorSave(returnToPost);
    setAuthorForm({
      originalId: '',
      id: '',
      nome: '',
      cargo: '',
      formacao: '',
      minibiografia: '',
      foto: '',
      linkLattes: '',
      linkOrcid: '',
      linkInstagram: '',
      linkX: '',
      linkBluesky: '',
      linkLinkedin: '',
      otherLinks: []
    });
    setActiveTab('edit-author');
  };

  const handleEditAuthor = async (id) => {
    try {
      const { data: a, error } = await supabase
        .from('authors')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;

      const linkMap = {
        'Lattes': 'linkLattes',
        'ORCID': 'linkOrcid',
        'Instagram': 'linkInstagram',
        'X': 'linkX',
        'Bluesky': 'linkBluesky',
        'LinkedIn': 'linkLinkedin'
      };

      const linksState = {
        linkLattes: '',
        linkOrcid: '',
        linkInstagram: '',
        linkX: '',
        linkBluesky: '',
        linkLinkedin: ''
      };
      
      const otherLinks = [];

      (a.links || []).forEach(link => {
        const stateKey = linkMap[link.titulo];
        if (stateKey) {
          linksState[stateKey] = link.url || '';
        } else {
          otherLinks.push({ titulo: link.titulo, url: link.url });
        }
      });

      setAuthorForm({
        originalId: a.id,
        id: a.id,
        nome: a.nome || '',
        cargo: a.cargo || '',
        formacao: a.formacao || '',
        minibiografia: a.minibiografia || '',
        foto: a.foto || '',
        ...linksState,
        otherLinks
      });
      setReturnToPostOnAuthorSave(false);
      setActiveTab('edit-author');
    } catch (err) {
      alert('Erro ao carregar integrante: ' + err.message);
    }
  };

  const handleDeleteAuthor = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este integrante?')) {
      try {
        const { error } = await supabase.from('authors').delete().eq('id', id);
        if (error) throw error;
        loadAuthors();
      } catch (err) {
        alert('Erro ao deletar: ' + err.message);
      }
    }
  };

  const handleSaveAuthor = async (e) => {
    e.preventDefault();
    setAuthorSaving(true);

    let id = authorForm.id.trim();
    if (!id && !authorForm.originalId) {
      id = generateSlug(authorForm.nome);
    } else if (authorForm.originalId && !id) {
      id = authorForm.originalId;
    }

    const links = [];
    const linkKeys = [
      { key: 'linkLattes', title: 'Lattes' },
      { key: 'linkOrcid', title: 'ORCID' },
      { key: 'linkInstagram', title: 'Instagram' },
      { key: 'linkX', title: 'X' },
      { key: 'linkBluesky', title: 'Bluesky' },
      { key: 'linkLinkedin', title: 'LinkedIn' }
    ];

    linkKeys.forEach(({ key, title }) => {
      const val = authorForm[key].trim();
      if (val) {
        links.push({ titulo: title, url: val });
      }
    });

    authorForm.otherLinks.forEach(link => {
      if (link.titulo.trim() && link.url.trim()) {
        links.push({ titulo: link.titulo.trim(), url: link.url.trim() });
      }
    });

    const authorData = {
      id,
      nome: authorForm.nome,
      cargo: authorForm.cargo,
      formacao: authorForm.formacao,
      minibiografia: authorForm.minibiografia,
      foto: authorForm.foto,
      links
    };

    try {
      if (authorForm.originalId && authorForm.originalId !== id) {
        await supabase.from('authors').delete().eq('id', authorForm.originalId);
      }
      const { error } = await supabase.from('authors').upsert(authorData);
      if (error) throw error;

      alert('Integrante salvo com sucesso!');
      if (returnToPostOnAuthorSave) {
        setPostForm(prev => ({ ...prev, autor: id }));
        setActiveTab('edit-post');
      } else {
        setActiveTab('authors');
      }
    } catch (err) {
      alert('Erro ao salvar integrante: ' + err.message);
    } finally {
      setAuthorSaving(false);
    }
  };

  const handleAddAuthorOtherLink = () => {
    setAuthorForm(prev => ({
      ...prev,
      otherLinks: [...prev.otherLinks, { titulo: '', url: '' }]
    }));
  };

  const handleRemoveAuthorOtherLink = (idx) => {
    setAuthorForm(prev => ({
      ...prev,
      otherLinks: prev.otherLinks.filter((_, i) => i !== idx)
    }));
  };

  const handleAuthorOtherLinkChange = (idx, field, val) => {
    setAuthorForm(prev => {
      const updated = [...prev.otherLinks];
      updated[idx][field] = val;
      return { ...prev, otherLinks: updated };
    });
  };

  // ----- CRUD: EVENTS -----
  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewEvent = () => {
    setEventForm({
      id: '',
      titulo: '',
      data: new Date().toISOString().split('T')[0],
      local: '',
      capa: '',
      descricao: ''
    });
    setActiveTab('edit-event');
  };

  const handleEditEvent = async (id) => {
    try {
      const { data: ev, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;

      setEventForm({
        id: ev.id,
        titulo: ev.titulo || '',
        data: ev.data || '',
        local: ev.local || '',
        capa: ev.capa || '',
        descricao: ev.descricao || ''
      });
      setActiveTab('edit-event');
    } catch (err) {
      alert('Erro ao carregar evento: ' + err.message);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        const { error } = await supabase.from('eventos').delete().eq('id', id);
        if (error) throw error;
        loadEvents();
      } catch (err) {
        alert('Erro ao deletar: ' + err.message);
      }
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setEventSaving(true);

    const id = eventForm.id || crypto.randomUUID();

    const evData = {
      id,
      titulo: eventForm.titulo,
      data: eventForm.data,
      local: eventForm.local,
      capa: eventForm.capa,
      descricao: eventForm.descricao,
      imagens: []
    };

    try {
      const { error } = await supabase.from('eventos').upsert(evData);
      if (error) throw error;
      alert('Evento salvo com sucesso!');
      setActiveTab('events');
    } catch (err) {
      alert('Erro ao salvar evento: ' + err.message);
    } finally {
      setEventSaving(false);
    }
  };

  // ----- SETTINGS/INFO -----
  const loadInfo = async () => {
    try {
      const { data: info, error } = await supabase
        .from('info_oedla')
        .select('*')
        .eq('id', 'main')
        .single();
      
      if (error) throw error;

      const findRede = (titulo) => {
        const r = (info.redes_sociais || []).find(item => item.titulo && item.titulo.toLowerCase() === titulo.toLowerCase());
        return r ? r.url : '';
      };

      const otherSocials = [];
      const knownSocials = ['instagram', 'x', 'twitter', 'x (twitter)', 'bluesky', 'linkedin', 'youtube', 'facebook'];
      (info.redes_sociais || []).forEach(item => {
        if (item.titulo && !knownSocials.includes(item.titulo.toLowerCase())) {
          otherSocials.push({ titulo: item.titulo, url: item.url });
        }
      });

      setInfoForm({
        titulo: info.titulo || '',
        subtitulo: info.subtitulo || '',
        keywords: info.keywords || '',
        linkInstagram: findRede('Instagram') || '',
        linkX: findRede('X') || findRede('twitter') || '',
        linkBluesky: findRede('Bluesky') || '',
        linkLinkedin: findRede('LinkedIn') || '',
        linkYoutube: findRede('YouTube') || '',
        linkFacebook: findRede('Facebook') || '',
        otherSocials,
        quem_somos: (info.quem_somos?.paragrafos || []).join('\n'),
        nossa_origem: (info.nossa_origem?.paragrafos || []).join('\n'),
        atividades: (info.atividades?.paragrafos || []).join('\n'),
        missao: info.atividades?.missao || [],
        blog_keywords: info.blog_keywords || '',
        blog_subtitulo: info.blog_subtitulo || '',
        noticias_keywords: info.noticias_keywords || '',
        noticias_subtitulo: info.noticias_subtitulo || ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setInfoSaving(true);

    const redes_sociais = [
      { titulo: 'Instagram', url: infoForm.linkInstagram.trim() },
      { titulo: 'X', url: infoForm.linkX.trim() },
      { titulo: 'Bluesky', url: infoForm.linkBluesky.trim() },
      { titulo: 'LinkedIn', url: infoForm.linkLinkedin.trim() },
      { titulo: 'YouTube', url: infoForm.linkYoutube.trim() },
      { titulo: 'Facebook', url: infoForm.linkFacebook.trim() },
    ].filter(item => item.url !== '');

    infoForm.otherSocials.forEach(item => {
      if (item.titulo.trim() && item.url.trim()) {
        redes_sociais.push({ titulo: item.titulo.trim(), url: item.url.trim() });
      }
    });

    const infoData = {
      id: 'main',
      titulo: infoForm.titulo,
      subtitulo: infoForm.subtitulo,
      keywords: infoForm.keywords,
      redes_sociais,
      quem_somos: {
        paragrafos: infoForm.quem_somos.split('\n').map(s => s.trim()).filter(Boolean)
      },
      nossa_origem: {
        paragrafos: infoForm.nossa_origem.split('\n').map(s => s.trim()).filter(Boolean)
      },
      atividades: {
        paragrafos: infoForm.atividades.split('\n').map(s => s.trim()).filter(Boolean),
        missao: infoForm.missao.filter(m => m.titulo.trim() && m.descricao.trim())
      },
      blog_keywords: infoForm.blog_keywords,
      blog_subtitulo: infoForm.blog_subtitulo,
      noticias_keywords: infoForm.noticias_keywords,
      noticias_subtitulo: infoForm.noticias_subtitulo
    };

    try {
      const { error } = await supabase.from('info_oedla').upsert(infoData);
      if (error) throw error;
      alert('Configurações salvas com sucesso!');
      refreshConfig(); // Sincroniza cache global do contexto
    } catch (err) {
      alert('Erro ao salvar configurações: ' + err.message);
    } finally {
      setInfoSaving(false);
    }
  };

  const handleAddInfoSocial = () => {
    setInfoForm(prev => ({
      ...prev,
      otherSocials: [...prev.otherSocials, { titulo: '', url: '' }]
    }));
  };

  const handleRemoveInfoSocial = (idx) => {
    setInfoForm(prev => ({
      ...prev,
      otherSocials: prev.otherSocials.filter((_, i) => i !== idx)
    }));
  };

  const handleInfoSocialChange = (idx, field, val) => {
    setInfoForm(prev => {
      const updated = [...prev.otherSocials];
      updated[idx][field] = val;
      return { ...prev, otherSocials: updated };
    });
  };

  const handleAddInfoMissao = () => {
    setInfoForm(prev => ({
      ...prev,
      missao: [...prev.missao, { titulo: '', descricao: '' }]
    }));
  };

  const handleRemoveInfoMissao = (idx) => {
    setInfoForm(prev => ({
      ...prev,
      missao: prev.missao.filter((_, i) => i !== idx)
    }));
  };

  const handleInfoMissaoChange = (idx, field, val) => {
    setInfoForm(prev => {
      const updated = [...prev.missao];
      updated[idx][field] = val;
      return { ...prev, missao: updated };
    });
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <p className="font-sans text-sm text-gray-500">Carregando painel administrativo...</p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 admin-view-container min-h-screen">
      
      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-6 mb-8 w-full gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">Painel OEDLA</h1>
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-primary">Controle de Conteúdo (CMS)</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-sans text-xs text-gray-500 font-semibold">{session?.user?.email}</span>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm text-red-500 text-xs font-bold font-sans uppercase tracking-wider"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      {['posts', 'authors', 'events', 'info'].includes(activeTab) && (
        <div className="admin-nav-wrapper relative overflow-hidden mb-8 border-b border-gray-200 dark:border-gray-800 pb-2">
          <nav className="admin-nav flex gap-2 overflow-x-auto select-none no-scrollbar">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 text-xs font-bold font-sans uppercase tracking-wider border rounded-sm transition-all focus:outline-none ${
                activeTab === 'posts' ? 'active bg-primary border-primary text-gray-900' : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Publicações
            </button>
            <button
              onClick={() => setActiveTab('authors')}
              className={`px-4 py-2 text-xs font-bold font-sans uppercase tracking-wider border rounded-sm transition-all focus:outline-none ${
                activeTab === 'authors' ? 'active bg-primary border-primary text-gray-900' : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Integrantes
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 text-xs font-bold font-sans uppercase tracking-wider border rounded-sm transition-all focus:outline-none ${
                activeTab === 'events' ? 'active bg-primary border-primary text-gray-900' : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Eventos
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-xs font-bold font-sans uppercase tracking-wider border rounded-sm transition-all focus:outline-none ${
                activeTab === 'info' ? 'active bg-primary border-primary text-gray-900' : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Configurações
            </button>
          </nav>
        </div>
      )}

      {/* VIEW: POSTS LIST */}
      {activeTab === 'posts' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center w-full">
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Publicações</h2>
            <button
              onClick={handleNewPost}
              className="btn btn-primary px-4 py-2 font-sans font-bold text-xs uppercase tracking-wider bg-primary text-gray-900 hover:bg-yellow-400"
            >
              Nova Publicação
            </button>
          </div>

          <div className="w-full overflow-x-auto border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 shadow-sm">
            <table className="admin-table w-full border-collapse" id="table-posts">
              <thead>
                <tr className="bg-gray-55 dark:bg-gray-900 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="p-4">Título</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Destaque</th>
                  <th className="p-4">Data</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                {posts.length > 0 ? (
                  posts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{p.titulo || 'Sem título'}</td>
                      <td className="p-4 capitalize text-gray-500">{p.tipo || '-'}</td>
                      <td className="p-4">
                        {p.destaque ? (
                          <span className="text-[10px] bg-yellow-400 text-gray-900 font-bold px-2 py-0.5 rounded">Sim</span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Não</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs">{p.data || '-'}</td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditPost(p.id)}
                            className="btn btn-sm btn-ghost hover:bg-primary/10 hover:text-primary text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeletePost(p.id)}
                            className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">Nenhuma publicação encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: EDIT POST */}
      {activeTab === 'edit-post' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4">
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white" id="post-editor-title">
              {postForm.originalId ? 'Editar Publicação' : 'Nova Publicação'}
            </h2>
            <button
              onClick={() => setActiveTab('posts')}
              className="btn btn-ghost text-xs font-bold uppercase tracking-wider"
            >
              Voltar
            </button>
          </div>

          <form onSubmit={handleSavePost} id="form-post" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="hidden" value={postForm.originalId} />
            
            <div className="form-group flex flex-col gap-1.5 md:col-span-2">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Título</label>
              <input
                type="text"
                required
                value={postForm.titulo}
                onChange={(e) => setPostForm(prev => ({ ...prev, titulo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Slug (Opcional - Gerado automaticamente)</label>
              <input
                type="text"
                value={postForm.id}
                onChange={(e) => setPostForm(prev => ({ ...prev, id: e.target.value }))}
                placeholder="Ex: titulo-do-artigo"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Autor</label>
              <div className="flex gap-2 items-center">
                <select
                  required
                  value={postForm.autor}
                  onChange={(e) => setPostForm(prev => ({ ...prev, autor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Selecione o autor...</option>
                  {authors.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleNewAuthor(true)}
                  className="btn btn-outline border border-gray-200 dark:border-gray-800 px-3 py-2 hover:border-primary hover:text-primary transition-all text-xs font-bold uppercase"
                >
                  Novo
                </button>
              </div>
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Data de Publicação</label>
              <input
                type="date"
                required
                value={postForm.data}
                onChange={(e) => setPostForm(prev => ({ ...prev, data: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Tipo de Publicação</label>
              <select
                value={postForm.tipo}
                onChange={(e) => setPostForm(prev => ({ ...prev, tipo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="artigo">Artigo (Blog)</option>
                <option value="notícia">Notícia</option>
              </select>
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Categorias (Separadas por vírgula)</label>
              <input
                type="text"
                value={postForm.categorias}
                onChange={(e) => setPostForm(prev => ({ ...prev, categorias: e.target.value }))}
                placeholder="Ex: Democracia, Eleições, Extrema-direita"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Tags (Separadas por vírgula)</label>
              <input
                type="text"
                value={postForm.tags}
                onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Ex: Brasil, Populismo"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5 md:col-span-2">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Resumo / Subtítulo</label>
              <textarea
                value={postForm.resumo}
                onChange={(e) => setPostForm(prev => ({ ...prev, resumo: e.target.value }))}
                rows="3"
                required
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5 md:col-span-2">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Imagem de Capa (URL ou Arquivo)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={postForm.poster}
                  onChange={(e) => setPostForm(prev => ({ ...prev, poster: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
                />
                <input
                  type="file"
                  id="post-capa-file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'posts-images', 'poster')}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('post-capa-file').click()}
                  className="btn btn-outline border border-gray-200 dark:border-gray-800 px-3 py-2 hover:border-primary hover:text-primary transition-all text-xs font-bold uppercase"
                >
                  Carregar
                </button>
              </div>
              {postForm.poster && (
                <img
                  src={postForm.poster}
                  alt="Prévia da capa"
                  className="mt-2 w-48 h-auto aspect-video object-cover rounded border border-gray-200 dark:border-gray-800"
                />
              )}
            </div>

            {/* Markdown Body Upload Image */}
            <div className="form-group flex flex-col gap-1.5 md:col-span-2 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800 p-4 rounded mt-4">
              <label className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-500">Inserir Imagem no Texto</label>
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  id="post-body-image-file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'posts-images', 'body-image')}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('post-body-image-file').click()}
                  className="btn btn-outline border border-gray-200 dark:border-gray-800 px-3 py-2 hover:border-primary hover:text-primary transition-all text-xs font-bold uppercase"
                >
                  Upload de Imagem
                </button>
                {postBodyImage && (
                  <>
                    <input
                      type="text"
                      readOnly
                      value={postBodyImage}
                      className="flex-1 px-3 py-1.5 text-xs font-mono border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyBodyImage}
                      className="btn btn-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                    >
                      Copiar Markdown
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="form-group flex flex-col gap-1.5 md:col-span-2 mt-4">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Conteúdo do Post (Markdown)</label>
              <textarea id="post-conteudo-textarea" className="hidden" />
            </div>

            <div className="flex gap-4 md:col-span-2 mt-6">
              <label className="flex items-center gap-2 font-sans text-sm font-semibold select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={postForm.destaque}
                  onChange={(e) => setPostForm(prev => ({ ...prev, destaque: e.target.checked }))}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                />
                Destacar na Página Inicial
              </label>
            </div>

            <div className="flex gap-4 md:col-span-2 mt-8">
              <button
                type="submit"
                disabled={postSaving}
                className="btn btn-primary px-6 py-3 font-sans font-bold text-xs uppercase tracking-wider bg-primary text-gray-900 hover:bg-yellow-400 disabled:opacity-50"
              >
                {postSaving ? 'Salvando...' : 'Salvar Publicação'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className="btn border border-gray-200 dark:border-gray-800 px-6 py-3 text-xs font-bold uppercase tracking-wider"
              >
                Cancelar
              </button>
            </div>

          </form>
        </div>
      )}

      {/* VIEW: AUTHORS LIST */}
      {activeTab === 'authors' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center w-full">
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Integrantes</h2>
            <button
              onClick={() => handleNewAuthor(false)}
              className="btn btn-primary px-4 py-2 font-sans font-bold text-xs uppercase tracking-wider bg-primary text-gray-900 hover:bg-yellow-400"
            >
              Novo Integrante
            </button>
          </div>

          <div className="w-full overflow-x-auto border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 shadow-sm">
            <table className="admin-table w-full border-collapse">
              <thead>
                <tr className="bg-gray-55 dark:bg-gray-900 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="p-4">Nome</th>
                  <th className="p-4">Cargo</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                {authors.length > 0 ? (
                  authors.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{a.nome || 'Sem nome'}</td>
                      <td className="p-4 text-gray-500">{a.cargo || '-'}</td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditAuthor(a.id)}
                            className="btn btn-sm btn-ghost hover:bg-primary/10 hover:text-primary text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteAuthor(a.id)}
                            className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-500">Nenhum integrante encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: EDIT AUTHOR */}
      {activeTab === 'edit-author' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4">
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white" id="author-editor-title">
              {authorForm.originalId ? 'Editar Integrante' : 'Novo Integrante'}
            </h2>
            <button
              onClick={() => {
                if (returnToPostOnAuthorSave) {
                  setActiveTab('edit-post');
                } else {
                  setActiveTab('authors');
                }
              }}
              className="btn btn-ghost text-xs font-bold uppercase tracking-wider"
            >
              Voltar
            </button>
          </div>

          <form onSubmit={handleSaveAuthor} id="form-author" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="hidden" value={authorForm.originalId} />

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Nome</label>
              <input
                type="text"
                required
                value={authorForm.nome}
                onChange={(e) => setAuthorForm(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">ID / Slug (Opcional - Ex: andre-kaysel)</label>
              <input
                type="text"
                value={authorForm.id}
                onChange={(e) => setAuthorForm(prev => ({ ...prev, id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Cargo</label>
              <input
                type="text"
                required
                value={authorForm.cargo}
                onChange={(e) => setAuthorForm(prev => ({ ...prev, cargo: e.target.value }))}
                placeholder="Ex: Coordenador"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Formação acadêmica</label>
              <input
                type="text"
                required
                value={authorForm.formacao}
                onChange={(e) => setAuthorForm(prev => ({ ...prev, formacao: e.target.value }))}
                placeholder="Ex: Professor de Ciência Política - Unicamp"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5 md:col-span-2">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Mini-biografia</label>
              <textarea
                value={authorForm.minibiografia}
                onChange={(e) => setAuthorForm(prev => ({ ...prev, minibiografia: e.target.value }))}
                rows="4"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5 md:col-span-2">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Foto de perfil (URL ou Arquivo)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={authorForm.foto}
                  onChange={(e) => setAuthorForm(prev => ({ ...prev, foto: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
                />
                <input
                  type="file"
                  id="author-foto-file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'authors-images', 'foto')}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('author-foto-file').click()}
                  className="btn btn-outline border border-gray-200 dark:border-gray-800 px-3 py-2 hover:border-primary hover:text-primary transition-all text-xs font-bold uppercase"
                >
                  Carregar
                </button>
              </div>
              {authorForm.foto && (
                <img
                  src={authorForm.foto}
                  alt="Foto prévia"
                  className="mt-2 w-24 h-24 object-cover rounded-full border border-gray-200 dark:border-gray-800"
                />
              )}
            </div>

            {/* Social Links */}
            <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-800 pt-6 mt-4">
              <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white mb-4">Redes Sociais & Contatos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Currículo Lattes (URL)</label>
                  <input
                    type="url"
                    value={authorForm.linkLattes}
                    onChange={(e) => setAuthorForm(prev => ({ ...prev, linkLattes: e.target.value }))}
                    placeholder="http://lattes.cnpq.br/..."
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">ORCID (URL)</label>
                  <input
                    type="url"
                    value={authorForm.linkOrcid}
                    onChange={(e) => setAuthorForm(prev => ({ ...prev, linkOrcid: e.target.value }))}
                    placeholder="https://orcid.org/..."
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Instagram (URL)</label>
                  <input
                    type="url"
                    value={authorForm.linkInstagram}
                    onChange={(e) => setAuthorForm(prev => ({ ...prev, linkInstagram: e.target.value }))}
                    placeholder="https://instagram.com/..."
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">X (Twitter) (URL)</label>
                  <input
                    type="url"
                    value={authorForm.linkX}
                    onChange={(e) => setAuthorForm(prev => ({ ...prev, linkX: e.target.value }))}
                    placeholder="https://x.com/..."
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Bluesky (URL)</label>
                  <input
                    type="url"
                    value={authorForm.linkBluesky}
                    onChange={(e) => setAuthorForm(prev => ({ ...prev, linkBluesky: e.target.value }))}
                    placeholder="https://bsky.app/profile/..."
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">LinkedIn (URL)</label>
                  <input
                    type="url"
                    value={authorForm.linkLinkedin}
                    onChange={(e) => setAuthorForm(prev => ({ ...prev, linkLinkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Custom Links */}
            <div className="md:col-span-2 flex flex-col gap-2 mt-4">
              <div className="flex justify-between items-center">
                <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Outros Links Customizados</label>
                <button
                  type="button"
                  onClick={handleAddAuthorOtherLink}
                  className="btn btn-outline text-xs px-2 py-1 uppercase"
                >
                  Adicionar Link
                </button>
              </div>
              <div className="flex flex-col gap-2" id="author-other-links-container">
                {authorForm.otherLinks.map((link, idx) => (
                  <div key={idx} className="flex gap-2 items-center other-link-row mt-1 w-full">
                    <input
                      type="text"
                      placeholder="Nome (Ex: Site Pessoal)"
                      required
                      value={link.titulo}
                      onChange={(e) => handleAuthorOtherLinkChange(idx, 'titulo', e.target.value)}
                      className="w-[30%] px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs"
                    />
                    <input
                      type="url"
                      placeholder="URL (Ex: https://...)"
                      required
                      value={link.url}
                      onChange={(e) => handleAuthorOtherLinkChange(idx, 'url', e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAuthorOtherLink(idx)}
                      className="btn btn-ghost text-red-500 text-xs px-2 py-1.5"
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 md:col-span-2 mt-8">
              <button
                type="submit"
                disabled={authorSaving}
                className="btn btn-primary px-6 py-3 font-sans font-bold text-xs uppercase tracking-wider bg-primary text-gray-900 hover:bg-yellow-400 disabled:opacity-50"
              >
                {authorSaving ? 'Salvando...' : 'Salvar Integrante'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (returnToPostOnAuthorSave) {
                    setActiveTab('edit-post');
                  } else {
                    setActiveTab('authors');
                  }
                }}
                className="btn border border-gray-200 dark:border-gray-800 px-6 py-3 text-xs font-bold uppercase tracking-wider"
              >
                Cancelar
              </button>
            </div>

          </form>
        </div>
      )}

      {/* VIEW: EVENTS LIST */}
      {activeTab === 'events' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center w-full">
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Eventos</h2>
            <button
              onClick={handleNewEvent}
              className="btn btn-primary px-4 py-2 font-sans font-bold text-xs uppercase tracking-wider bg-primary text-gray-900 hover:bg-yellow-400"
            >
              Novo Evento
            </button>
          </div>

          <div className="w-full overflow-x-auto border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 shadow-sm">
            <table className="admin-table w-full border-collapse">
              <thead>
                <tr className="bg-gray-55 dark:bg-gray-900 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="p-4">Título</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Local</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                {events.length > 0 ? (
                  events.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{ev.titulo || 'Sem título'}</td>
                      <td className="p-4 font-mono text-xs">{ev.data || '-'}</td>
                      <td className="p-4 text-gray-500">{ev.local || '-'}</td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditEvent(ev.id)}
                            className="btn btn-sm btn-ghost hover:bg-primary/10 hover:text-primary text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">Nenhum evento agendado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: EDIT EVENT */}
      {activeTab === 'edit-event' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4">
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white" id="evento-editor-title">
              {eventForm.id ? 'Editar Evento' : 'Novo Evento'}
            </h2>
            <button
              onClick={() => setActiveTab('events')}
              className="btn btn-ghost text-xs font-bold uppercase tracking-wider"
            >
              Voltar
            </button>
          </div>

          <form onSubmit={handleSaveEvent} id="form-evento" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="hidden" value={eventForm.id} />

            <div className="form-group flex flex-col gap-1.5 md:col-span-2">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Título do Evento</label>
              <input
                type="text"
                required
                value={eventForm.titulo}
                onChange={(e) => setEventForm(prev => ({ ...prev, titulo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Data do Evento</label>
              <input
                type="date"
                required
                value={eventForm.data}
                onChange={(e) => setEventForm(prev => ({ ...prev, data: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Local</label>
              <input
                type="text"
                required
                value={eventForm.local}
                onChange={(e) => setEventForm(prev => ({ ...prev, local: e.target.value }))}
                placeholder="Ex: São Paulo, SP ou Online"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5 md:col-span-2">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Imagem de Capa (URL ou Arquivo)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eventForm.capa}
                  onChange={(e) => setEventForm(prev => ({ ...prev, capa: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
                />
                <input
                  type="file"
                  id="evento-capa-file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'eventos-images', 'capa')}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('evento-capa-file').click()}
                  className="btn btn-outline border border-gray-200 dark:border-gray-800 px-3 py-2 hover:border-primary hover:text-primary transition-all text-xs font-bold uppercase"
                >
                  Carregar
                </button>
              </div>
              {eventForm.capa && (
                <img
                  src={eventForm.capa}
                  alt="Capa prévia"
                  className="mt-2 w-48 h-auto aspect-video object-cover rounded border border-gray-200 dark:border-gray-800"
                />
              )}
            </div>

            <div className="form-group flex flex-col gap-1.5 md:col-span-2">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Descrição do Evento (Markdown)</label>
              <textarea
                value={eventForm.descricao}
                onChange={(e) => setEventForm(prev => ({ ...prev, descricao: e.target.value }))}
                rows="8"
                required
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none font-mono text-sm"
              />
            </div>

            <div className="flex gap-4 md:col-span-2 mt-8">
              <button
                type="submit"
                disabled={eventSaving}
                className="btn btn-primary px-6 py-3 font-sans font-bold text-xs uppercase tracking-wider bg-primary text-gray-900 hover:bg-yellow-400 disabled:opacity-50"
              >
                {eventSaving ? 'Salvando...' : 'Salvar Evento'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className="btn border border-gray-200 dark:border-gray-800 px-6 py-3 text-xs font-bold uppercase tracking-wider"
              >
                Cancelar
              </button>
            </div>

          </form>
        </div>
      )}

      {/* VIEW: SETTINGS/INFO */}
      {activeTab === 'info' && (
        <div className="flex flex-col gap-6">
          <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">Configurações Gerais do OEDLA</h2>

          <form onSubmit={handleSaveInfo} id="form-info" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Título do Site</label>
              <input
                type="text"
                required
                value={infoForm.titulo}
                onChange={(e) => setInfoForm(prev => ({ ...prev, titulo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Keywords Principais</label>
              <input
                type="text"
                required
                value={infoForm.keywords}
                onChange={(e) => setInfoForm(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="Ex: Investigação, Análise e Notícias"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5 md:col-span-2">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Subtítulo Hero Principal</label>
              <textarea
                value={infoForm.subtitulo}
                onChange={(e) => setInfoForm(prev => ({ ...prev, subtitulo: e.target.value }))}
                rows="2"
                required
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Social settings */}
            <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-800 pt-6 mt-4">
              <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white mb-4">Redes Sociais Institucionais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Instagram</label>
                  <input
                    type="url"
                    value={infoForm.linkInstagram}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, linkInstagram: e.target.value }))}
                    placeholder="https://instagram.com/..."
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">X (Twitter)</label>
                  <input
                    type="url"
                    value={infoForm.linkX}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, linkX: e.target.value }))}
                    placeholder="https://x.com/..."
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Bluesky</label>
                  <input
                    type="url"
                    value={infoForm.linkBluesky}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, linkBluesky: e.target.value }))}
                    placeholder="https://bsky.app/profile/..."
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">LinkedIn</label>
                  <input
                    type="url"
                    value={infoForm.linkLinkedin}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, linkLinkedin: e.target.value }))}
                    placeholder="https://linkedin.com/company/..."
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">YouTube</label>
                  <input
                    type="url"
                    value={infoForm.linkYoutube}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, linkYoutube: e.target.value }))}
                    placeholder="https://youtube.com/..."
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Facebook</label>
                  <input
                    type="url"
                    value={infoForm.linkFacebook}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, linkFacebook: e.target.value }))}
                    placeholder="https://facebook.com/..."
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Custom socials */}
            <div className="md:col-span-2 flex flex-col gap-2 mt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">Outros Links de Redes Sociais</label>
                <button
                  type="button"
                  onClick={handleAddInfoSocial}
                  className="btn btn-outline text-xs px-2 py-1 uppercase"
                >
                  Adicionar Rede
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {infoForm.otherSocials.map((social, idx) => (
                  <div key={idx} className="flex gap-2 items-center other-link-row mt-1 w-full">
                    <input
                      type="text"
                      placeholder="Rede (Ex: TikTok)"
                      required
                      value={social.titulo}
                      onChange={(e) => handleInfoSocialChange(idx, 'titulo', e.target.value)}
                      className="w-[30%] px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs"
                    />
                    <input
                      type="url"
                      placeholder="URL (Ex: https://...)"
                      required
                      value={social.url}
                      onChange={(e) => handleInfoSocialChange(idx, 'url', e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveInfoSocial(idx)}
                      className="btn btn-ghost text-red-500 text-xs px-2 py-1.5"
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Text boxes separated by newlines */}
            <div className="form-group flex flex-col gap-1.5 md:col-span-2 border-t border-gray-200 dark:border-gray-800 pt-6 mt-4">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Quem Somos - Parágrafos (Linha por parágrafo)</label>
              <textarea
                value={infoForm.quem_somos}
                onChange={(e) => setInfoForm(prev => ({ ...prev, quem_somos: e.target.value }))}
                rows="4"
                required
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none text-sm"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5 md:col-span-2">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Nossa Origem - Parágrafos (Linha por parágrafo)</label>
              <textarea
                value={infoForm.nossa_origem}
                onChange={(e) => setInfoForm(prev => ({ ...prev, nossa_origem: e.target.value }))}
                rows="4"
                required
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none text-sm"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5 md:col-span-2">
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Atividades - Parágrafos (Linha por parágrafo)</label>
              <textarea
                value={infoForm.atividades}
                onChange={(e) => setInfoForm(prev => ({ ...prev, atividades: e.target.value }))}
                rows="4"
                required
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none text-sm"
              />
            </div>

            {/* Mission items */}
            <div className="md:col-span-2 flex flex-col gap-2 mt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">Eixos da Missão de Difusão</label>
                <button
                  type="button"
                  onClick={handleAddInfoMissao}
                  className="btn btn-outline text-xs px-2 py-1 uppercase"
                >
                  Adicionar Eixo
                </button>
              </div>
              <div className="flex flex-col gap-4" id="info-missao-container">
                {infoForm.missao.map((m, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-3 bg-gray-55 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg missao-item-row">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-gray-400">Eixo de Difusão #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInfoMissao(idx)}
                        className="btn btn-ghost text-red-500 text-xs px-2"
                      >
                        Excluir
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Título do Item (Ex: Produção Científica)"
                      required
                      value={m.titulo}
                      onChange={(e) => handleInfoMissaoChange(idx, 'titulo', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs font-bold"
                    />
                    <textarea
                      placeholder="Descrição do Item..."
                      required
                      value={m.descricao}
                      onChange={(e) => handleInfoMissaoChange(idx, 'descricao', e.target.value)}
                      rows="2"
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Subtitles and keywords for Blog / Noticias pages */}
            <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-800 pt-6 mt-4">
              <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white mb-4">Configuração das Páginas de Listagem</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Blog - Keywords</label>
                  <input
                    type="text"
                    required
                    value={infoForm.blog_keywords}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, blog_keywords: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Blog - Subtítulo</label>
                  <textarea
                    required
                    value={infoForm.blog_subtitulo}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, blog_subtitulo: e.target.value }))}
                    rows="2"
                    className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Notícias - Keywords</label>
                  <input
                    type="text"
                    required
                    value={infoForm.noticias_keywords}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, noticias_keywords: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Notícias - Subtítulo</label>
                  <textarea
                    required
                    value={infoForm.noticias_subtitulo}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, noticias_subtitulo: e.target.value }))}
                    rows="2"
                    className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 mt-8">
              <button
                type="submit"
                disabled={infoSaving}
                className="btn btn-primary px-6 py-3 font-sans font-bold text-xs uppercase tracking-wider bg-primary text-gray-900 hover:bg-yellow-400 disabled:opacity-50"
              >
                {infoSaving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>

          </form>
        </div>
      )}

    </main>
  );
}
