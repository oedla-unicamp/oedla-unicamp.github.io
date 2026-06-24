import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('info_oedla')
        .select('*')
        .eq('id', 'main')
        .single();

      if (err) throw err;
      setConfig(data);
      setError(null);
    } catch (e) {
      console.error('Error loading OEDLA config:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, error, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
