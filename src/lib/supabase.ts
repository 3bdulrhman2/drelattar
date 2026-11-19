import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvOrStorage = (envKey: string, storageKey: string): string => {
  const envVal = import.meta.env[envKey];
  if (envVal && typeof envVal === 'string' && envVal.trim() !== '' && !envVal.includes('placeholder')) {
    return envVal.trim();
  }
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(storageKey);
    if (stored && stored.trim() !== '') {
      return stored.trim();
    }
  }
  return '';
};

const supabaseUrl = getEnvOrStorage('VITE_SUPABASE_URL', 'drelattar_supabase_url');
const supabaseAnonKey = getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'drelattar_supabase_anon_key');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const setDirectSupabaseCredentials = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    if (url.trim()) {
      localStorage.setItem('drelattar_supabase_url', url.trim());
    } else {
      localStorage.removeItem('drelattar_supabase_url');
    }

    if (anonKey.trim()) {
      localStorage.setItem('drelattar_supabase_anon_key', anonKey.trim());
    } else {
      localStorage.removeItem('drelattar_supabase_anon_key');
    }
    window.location.reload();
  }
};

export const clearDirectSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('drelattar_supabase_url');
    localStorage.removeItem('drelattar_supabase_anon_key');
    window.location.reload();
  }
};

export const getActiveSupabaseCredentials = () => {
  return {
    url: typeof window !== 'undefined' ? localStorage.getItem('drelattar_supabase_url') || supabaseUrl : supabaseUrl,
    anonKey: typeof window !== 'undefined' ? localStorage.getItem('drelattar_supabase_anon_key') || supabaseAnonKey : supabaseAnonKey,
    source: (typeof window !== 'undefined' && localStorage.getItem('drelattar_supabase_url')) ? 'manual' : (supabaseUrl ? 'env' : 'none')
  };
};
