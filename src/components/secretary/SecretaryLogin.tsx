import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import type { SecretaryAccount } from '../../types';

interface SecretaryLoginProps {
  onBackToSite: () => void;
  onLoginSuccess: (account: SecretaryAccount) => void;
}

export const SecretaryLogin: React.FC<SecretaryLoginProps> = ({ onBackToSite, onLoginSuccess }) => {
  const { data } = useContent();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      setLoading(false);
      return;
    }

    const accounts = data.secretaryAccounts || [];
    const matchedAccount = accounts.find(
      (a) => a.username.toLowerCase() === cleanUser
    );

    // Default fallback secretary account for immediate testability
    const isDefaultFallback =
      cleanUser === 'secretary' && cleanPass === 'ElattarSecretary2026!';

    if (isDefaultFallback) {
      const fallbackAccount: SecretaryAccount = {
        id: 'sec-default',
        username: 'secretary',
        passwordHash: 'ElattarSecretary2026!',
        name: 'مشرف الحجوزات الرئيسي',
        phone: '01060918977',
        isActive: true,
        permissions: {
          canManageBookings: true,
          canCloseToday: true,
          canCloseSpecificDates: true,
          canScheduleHolidays: true,
          canPostAnnouncements: true,
        },
        createdAt: new Date().toISOString(),
      };
      sessionStorage.setItem('drelattar_secretary_session', JSON.stringify(fallbackAccount));
      onLoginSuccess(fallbackAccount);
      setLoading(false);
      return;
    }

    if (!matchedAccount) {
      setError('اسم المستخدم غير مسجل. يرجى التواصل مع إدارة العيادة.');
      setLoading(false);
      return;
    }

    if (!matchedAccount.isActive) {
      setError('تم تعطيل هذا الحساب مؤقتاً من قِبل إدارة العيادة.');
      setLoading(false);
      return;
    }

    if (matchedAccount.passwordHash !== cleanPass) {
      setError('كلمة المرور غير صحيحة. يرجى التأكد وإعادة المحاولة.');
      setLoading(false);
      return;
    }

    sessionStorage.setItem('drelattar_secretary_session', JSON.stringify(matchedAccount));
    onLoginSuccess(matchedAccount);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-darker to-slate-950 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-brand-cyan/20">
      
      {/* Back to site button */}
      <button
        onClick={onBackToSite}
        className="absolute top-6 right-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-2 px-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للموقع الرئيسي</span>
      </button>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl text-right space-y-6">
        
        {/* Clinic Logo & Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white p-2 shadow-lg border border-slate-700/50 flex items-center justify-center">
            <img
              src="/brand/clinic-logo.png"
              alt="عيادة د. محمد السيد العطار"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-brand-royal/30 text-brand-cyan border border-brand-royal/40">
              <Shield className="w-3.5 h-3.5" />
              <span>لوحة مشرف الحجوزات (السكرتارية)</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              عيادة د. محمد السيد العطار
            </h1>
            <p className="text-xs text-slate-400">
              إدارة حجوزات المرضى، تأكيد المواعيد، وتنظيم أوقات العيادة
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسم المستخدم (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: secretary أو الاسم المخصص"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-brand-cyan pl-10"
                dir="ltr"
                required
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-brand-cyan pl-10"
                dir="ltr"
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-royal hover:bg-brand-medical text-white font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول إلى لوحة الحجوزات'}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            لوحة مخصصة لمنسقي وسكرتارية الحجوزات فقط. للوصول الإداري الكامل يرجى التوجه لـ{' '}
            <a href="/admin" className="text-brand-cyan hover:underline">
              لوحة الإدارة الرئيسية
            </a>.
          </p>
        </div>

      </div>
    </div>
  );
};
