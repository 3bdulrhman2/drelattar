import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { assertBackendTarget } from './clinicSecurity';
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
assertBackendTarget(import.meta.env.MODE, supabaseUrl);
const isLoopback = /^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(:[0-9]+)?$/.test(supabaseUrl);
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey.length > 20 &&
  (supabaseUrl.startsWith('https://') || (import.meta.env.MODE === 'isolated' && isLoopback)));
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false },
      global: { headers: { 'x-client-info': 'drelattar-secure-review' } },
    }) : null;
