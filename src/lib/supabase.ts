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

// Built-in Supabase Project Configuration for Dr. Elattar Clinic
// The anon key is intentionally public by design in client-side web apps
const DEFAULT_SUPABASE_URL = 'https://jpamutyomblwobwntoky.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwYW11dHlvbWJsd29id250b2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwNDgxNzIsImV4cCI6MjExMDYyNDE3Mn0.SKV19QKCDGZSbOK5HQExWqULwfakEXvzkzI8YJPOayw';

const supabaseUrl =
  getEnvOrStorage('VITE_SUPABASE_URL', 'drelattar_supabase_url') || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'drelattar_supabase_anon_key') || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { 'x-client-info': 'drelattar-fast-web' },
      },
    })
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
