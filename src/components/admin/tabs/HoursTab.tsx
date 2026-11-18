import React, { useState } from 'react';
import { Save, Check, Clock, Calendar } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';

export const HoursTab: React.FC = () => {
  const { data, updateClinic } = useContent();
  const { clinic } = data;

  const [form, setForm] = useState({
    hoursRegular: clinic.hoursRegular,
    hoursFriday: clinic.hoursFriday,
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinic(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-right max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">مواعيد عمل العيادة</h3>
          <p className="text-xs text-slate-400">تحديث أوقات الاستقبال الأسبوعية ويوم الجمعة</p>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-brand-royal hover:bg-brand-medical text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التعديلات</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>تم حفظ مواعيد العمل بنجاح.</span>
        </div>
      )}

      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            مواعيد السبت إلى الخميس (النظام الأسبوعي)
          </label>
          <input
            type="text"
            value={form.hoursRegular}
            onChange={(e) => setForm({ ...form, hoursRegular: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            مواعيد يوم الجمعة
          </label>
          <input
            type="text"
            value={form.hoursFriday}
            onChange={(e) => setForm({ ...form, hoursFriday: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
          />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 text-xs text-slate-400 leading-relaxed">
          * هذه المواعيد موثقة وتظهر في الشريط العلوي للموقع، قسم الموقع والتواصل، والتذييل، والبيانات المنظمة لـ Google SEO (JSON-LD).
        </div>
      </div>
    </form>
  );
};
