import React, { useState } from 'react';
import { Users, UserPlus, Key, Shield, ShieldCheck, ShieldAlert, Trash2, Edit3, Check, AlertCircle } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';
import type { SecretaryAccount } from '../../../types';

export const SecretaryAccountsTab: React.FC = () => {
  const { data, addSecretaryAccount, updateSecretaryAccount, deleteSecretaryAccount } = useContent();
  const { secretaryAccounts } = data;

  // Add Account Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState(false);

  // Password reset modal state
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !name.trim()) {
      alert('يرجى ملء اسم المستخدم وكلمة المرور واسم المشرف');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = (secretaryAccounts || []).find(
      (a) => a.username.toLowerCase() === cleanUsername
    );
    if (existing) {
      alert('اسم المستخدم هذا مسجل بالفعل. يرجى اختيار اسم مستخدم آخر.');
      return;
    }

    addSecretaryAccount({
      username: cleanUsername,
      passwordHash: password.trim(),
      name: name.trim(),
      phone: phone.trim() || undefined,
      isActive: true,
      permissions: {
        canManageBookings: true,
        canCloseToday: true,
        canCloseSpecificDates: true,
        canScheduleHolidays: true,
        canPostAnnouncements: true,
      },
    });

    setUsername('');
    setPassword('');
    setName('');
    setPhone('');
    setNotice(true);
    setTimeout(() => setNotice(false), 3000);
  };

  const handleSavePasswordReset = (id: string) => {
    if (!newPassword.trim()) {
      alert('يرجى كتابة كلمة المرور الجديدة');
      return;
    }
    updateSecretaryAccount(id, { passwordHash: newPassword.trim() });
    setResettingId(null);
    setNewPassword('');
    alert('تم تحديث كلمة مرور المشرف بنجاح.');
  };

  return (
    <div className="space-y-8 text-right max-w-4xl">
      
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-cyan" />
          <span>إدارة حسابات مشرفي الحجوزات (السكرتارية)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          إنشاء حسابات مخصصة لمشرفي وسكرتارية العيادة للوصول إلى لوحة الحجوزات وإغلاق المواعيد دون صلاحية تعديل الموقع أو إعدادات الإدارة
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>تم إنشاء وتفعيل حساب المشرف بنجاح ومزامنته سحابياً.</span>
        </div>
      )}

      {/* SECTION 1: Add New Secretary Form */}
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-5">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
          <UserPlus className="w-4 h-4 text-brand-cyan" />
          <span>إضافة حساب مشرف / سكرتير جديد</span>
        </h4>

        <form onSubmit={handleAddAccount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                اسم المشرف الكامل (Display Name)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أ / سارة أحمد (سكرتارية العيادة)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                رقم الهاتف للتواصل (اختياري)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                اسم المستخدم لتسجيل الدخول (Username)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: sara_clinic"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan"
                dir="ltr"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                كلمة المرور (Password)
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة مرور قوية للمشرف..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-brand-royal hover:bg-brand-medical text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حساب السكرتير الآن</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Accounts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-lime" />
            <span>الحسابات المسجلة حالياً ({secretaryAccounts?.length || 0})</span>
          </h4>
          <span className="text-xs text-slate-400">يمكنك تعطيل أو تغيير كلمة المرور فورياً</span>
        </div>

        {secretaryAccounts && secretaryAccounts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {secretaryAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{account.name}</span>
                    <button
                      onClick={() =>
                        updateSecretaryAccount(account.id, { isActive: !account.isActive })
                      }
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                        account.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                    >
                      {account.isActive ? '● نشط ومفعل' : '✕ معطل مؤقتاً'}
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <p>
                      اسم المستخدم:{' '}
                      <strong className="text-brand-cyan font-mono" dir="ltr">
                        {account.username}
                      </strong>
                    </p>
                    {account.phone && (
                      <p>
                        الهاتف: <span dir="ltr">{account.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Reset Row */}
                {resettingId === account.id ? (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
                    <label className="text-[11px] text-slate-300 font-semibold block">
                      كلمة المرور الجديدة:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="اكتب كلمة المرور الجديدة..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                        dir="ltr"
                      />
                      <button
                        onClick={() => handleSavePasswordReset(account.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shrink-0"
                      >
                        حفظ
                      </button>
                      <button
                        onClick={() => setResettingId(null)}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs shrink-0"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between border-t border-slate-700/60 pt-3">
                    <button
                      onClick={() => {
                        setResettingId(account.id);
                        setNewPassword('');
                      }}
                      className="text-xs text-brand-cyan hover:underline inline-flex items-center gap-1"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>تغيير كلمة المرور</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف حساب "${account.name}"؟`)) {
                          deleteSecretaryAccount(account.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="حذف الحساب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            لا توجد حسابات سكرتارية مسجلة حالياً. يمكنك إضافة أول حساب باستخدام النموذج أعلاه.
          </div>
        )}
      </div>

    </div>
  );
};
