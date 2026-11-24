import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {disableStaffDeviceBeforeLogout} from '../lib/staffDeviceRegistration';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
export interface AuthUser { id: string; email: string; role: 'admin' | 'secretary'; name: string }
interface AuthContextType {
  user: AuthUser | null; isAuthenticated: boolean; isLoading: boolean; isSupabaseAuth: boolean;
  login: (password: string, email?: string) => Promise<{success: boolean; error?: string}>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const epoch = useRef(0);
  const currentUserId = useRef<string|null>(null);
  currentUserId.current=user?.id||null;
  const resolveStaff = async (session: any): Promise<AuthUser | null> => {
    if (!supabase || !session?.user?.id) return null;
    const {data, error} = await supabase.from('clinic_staff').select('user_id,role,name,is_active')
      .eq('user_id', session.user.id).eq('is_active', true).maybeSingle();
    if (error || !data || !['admin','secretary'].includes(data.role)) return null;
    return {id: session.user.id, email: session.user.email || '', role: data.role, name: data.name};
  };
  useEffect(() => {
    // Retire UI-only sessions. They are never credentials and cannot restore access.
    for (const key of ['drelattar_admin_session_v1','drelattar_secretary_session','drelattar_clinic_content_v2']) {
      try {localStorage.removeItem(key); sessionStorage.removeItem(key);} catch {/* Storage may be disabled. */}
    }
    let active = true;
    if (!supabase) { setIsLoading(false); return; }
    const {data: listener} = supabase.auth.onAuthStateChange((_event, session) => {
      const version = ++epoch.current;
      if(!session?.user?.id||session.user.id!==currentUserId.current){setUser(null);setIsLoading(true);}
      // Keep same-user forms mounted during visibility/token callbacks.
      // Do not call auth/database methods synchronously inside the Auth callback lock.
      setTimeout(async () => {
        const staff = await resolveStaff(session);
        if (active && version === epoch.current) { setUser(staff); setIsLoading(false); }
      }, 0);
    });
    supabase.auth.getSession().then(async ({data}) => {
      const version = ++epoch.current;
      const staff = await resolveStaff(data.session);
      if (active && version === epoch.current) { setUser(staff); setIsLoading(false); }
    });
    return () => { active = false; ++epoch.current; listener.subscription.unsubscribe(); };
  }, []);
  const login = async (password: string, email = '') => {
    setUser(null); setIsLoading(true);
    try {
      if (!supabase || !email.trim()) throw new Error('غير متصل');
      const {data, error} = await supabase.auth.signInWithPassword({email: email.trim(), password});
      if (error) throw error;
      const staff = await resolveStaff(data.session);
      if (!staff) { await supabase.auth.signOut(); throw new Error('غير مخول'); }
      ++epoch.current; setUser(staff);
      return {success: true};
    } catch {
      setUser(null);
      return {success: false, error: 'تعذر تسجيل الدخول بحساب موظف مخول. لا توجد كلمة مرور محلية بديلة.'};
    } finally { setIsLoading(false); }
  };
  const logout = async () => { if(!await disableStaffDeviceBeforeLogout()){alert('تعذر إيقاف إشعارات الجهاز. اتصل بالإنترنت وحاول تسجيل الخروج مرة أخرى');return;} const result=await supabase?.auth.signOut();if(result?.error){alert('تعذر تسجيل الخروج. راجع اتصال الإنترنت وحاول مرة أخرى');return;}++epoch.current; setUser(null); };
  return <AuthContext.Provider value={{user,isAuthenticated:!!user,isLoading,isSupabaseAuth:isSupabaseConfigured,login,logout}}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const c=useContext(AuthContext); if (!c) throw new Error('AuthProvider missing'); return c; };
