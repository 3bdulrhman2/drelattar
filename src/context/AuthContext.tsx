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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check initial auth state
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            email: session.user.email || DEFAULT_ADMIN_EMAIL,
            role: 'admin',
            name: 'الدكتور محمد السيد العطار (إدارة)',
          });
        }
        setIsLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            email: session.user.email || DEFAULT_ADMIN_EMAIL,
            role: 'admin',
            name: 'الدكتور محمد السيد العطار (إدارة)',
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      // Local session check
      try {
        const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Session read error:', e);
      }
      setIsLoading(false);
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
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      } catch (e) {
        console.warn('Could not save session to sessionStorage', e);
      }
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: 'كلمة المرور غير صحيحة. يرجى إدخال كلمة مرور الإدارة المعتمدة.' };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    try {
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
