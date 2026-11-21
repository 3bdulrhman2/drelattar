import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthUser {
  email: string;
  role: 'admin';
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSupabaseAuth: boolean;
  login: (password: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'drelattar_admin_session_v1';
// Standard local admin passcode fallback (can also be configured via VITE_ADMIN_PASSWORD)
const DEFAULT_LOCAL_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'DrElattar2026!';
const DEFAULT_ADMIN_EMAIL = 'admin@drelattar.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronously initialize user from localStorage so there is ZERO logout flicker on page refresh
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Session read error:', e);
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Check initial auth state
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const authUser: AuthUser = {
            email: session.user.email || DEFAULT_ADMIN_EMAIL,
            role: 'admin',
            name: 'الدكتور محمد السيد العطار (إدارة)',
          };
          setUser(authUser);
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
          } catch (e) {}
        }
        setIsLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const authUser: AuthUser = {
            email: session.user.email || DEFAULT_ADMIN_EMAIL,
            role: 'admin',
            name: 'الدكتور محمد السيد العطار (إدارة)',
          };
          setUser(authUser);
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
          } catch (e) {}
        }
        // NOTE: If session is null, DO NOT clear user if local admin session exists in localStorage
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (password: string, email: string = DEFAULT_ADMIN_EMAIL): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data.user) {
          const authUser: AuthUser = {
            email: data.user.email || email,
            role: 'admin',
            name: 'الدكتور محمد السيد العطار',
          };
          setUser(authUser);
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
          } catch (e) {}
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase auth attempt notice, falling back to master password:', err);
      }
    }

    // Local admin authentication fallback (Always works with DrElattar2026!)
    if (password === DEFAULT_LOCAL_PASSWORD) {
      const authUser: AuthUser = {
        email,
        role: 'admin',
        name: 'مدير النظام (إدارة العيادة)',
      };
      setUser(authUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      } catch (e) {
        console.warn('Could not save session to localStorage', e);
      }
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: 'كلمة المرور غير صحيحة. يرجى إدخال كلمة مرور الإدارة المعتمدة.' };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('Session remove error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isSupabaseAuth: isSupabaseConfigured,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
