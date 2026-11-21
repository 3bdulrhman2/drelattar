import React, { useState } from 'react';
import { Save, Check, MapPin, Phone, Building } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';

export const ClinicInfoTab: React.FC = () => {
  const { data, updateClinic } = useContent();
  const { clinic } = data;

  const [form, setForm] = useState({
    name: clinic.name,
    address: clinic.address,
    landmark: clinic.landmark,
    city: clinic.city,
    governorate: clinic.governorate,
    branchesCount: clinic.branchesCount,
    phoneClinic: clinic.phoneClinic,
    phoneDoctor: clinic.phoneDoctor,
    googleMapsUrl: clinic.googleMapsUrl,
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const handleChange = (field: keyof typeof form, value: any) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    updateClinic(nextForm);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinic(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-right max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>معلومات العيادة والمقر</span>
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
              يُحفظ تلقائياً ✓
            </span>
          </h3>
          <p className="text-xs text-slate-400">العنوان، العلامة المميزة، أرقام الهواتف، ورابط الخريطة</p>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>تأكيد الحفظ ✓</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>تم حفظ بيانات العيادة بنجاح.</span>
        </div>
      )}

      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم العيادة الرسمي</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">العنوان المكتوب بالتفصيل</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">العلامة المميزة (Landmark)</label>
            <input
              type="text"
              value={form.landmark}
              onChange={(e) => handleChange('landmark', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">المركز والمحافظة</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">رقم هاتف العيادة الأساسي</label>
            <input
              type="text"
              value={form.phoneClinic}
              onChange={(e) => handleChange('phoneClinic', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">رقم هاتف الدكتور</label>
            <input
              type="text"
              value={form.phoneDoctor}
              onChange={(e) => handleChange('phoneDoctor', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">رابط خرائط Google الرسمي (Google Maps Link)</label>
          <input
            type="url"
            value={form.googleMapsUrl}
            onChange={(e) => handleChange('googleMapsUrl', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
            dir="ltr"
          />
        </div>

      </div>
    </form>
  );
};
