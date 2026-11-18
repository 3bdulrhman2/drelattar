import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, Server, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

interface AdminLoginProps {
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToSite }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@drelattar.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(password, email);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'فشل تسجيل الدخول');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden" dir="rtl">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-brand-royal/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-brand-cyan/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top back button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-6">
        <button
          onClick={onBackToSite}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرجوع إلى الموقع العام</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Card Header */}
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/80 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-brand-royal/40 border border-brand-cyan/30 flex items-center justify-center mx-auto text-brand-cyan shadow-lg">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              لوحة إدارة العيادة
            </h2>
            <p className="text-xs text-slate-400">
              تسجيل دخول مخصص للإدارة الطبية المعتمدة فقط
            </p>
          </div>

          {/* Backend Status Notice */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shrink-0 ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <div className="text-right">
              <span className="font-semibold block text-slate-200">
                {isSupabaseConfigured ? 'قاعدة بيانات Supabase: متصلة ونشطة' : 'وضع الإدارة المحلي (Local Preview Mode)'}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {isSupabaseConfigured
                  ? 'المصادقة والتغييرات متزامنة مع السحابة'
                  : 'يمكن الدخول بكلمة مرور الإدارة المحلية (DrElattar2026!)'}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البريد الإلكتروني للإدارة
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan transition-colors"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-royal hover:bg-brand-medical text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg hover:shadow-brand-royal/30 disabled:opacity-50"
            >
              {isSubmitting ? 'جاري التحقق...' : 'تسجيل الدخول إلى لوحة التحكم'}
            </button>
          </form>

          {/* Security note */}
          <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-700/60">
            منطقة محمية ومشفرة. التسجيل العام مغلق بقرار أمني.
          </div>
        </div>
      </div>
    </div>
  );
};
