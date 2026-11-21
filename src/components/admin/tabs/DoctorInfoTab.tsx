import React, { useState } from 'react';
import { Save, Check, Stethoscope, Plus, Trash2 } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';

export const DoctorInfoTab: React.FC = () => {
  const { data, updateDoctor } = useContent();
  const { doctor } = data;

  const [form, setForm] = useState({
    nameAr: doctor.nameAr,
    nameEn: doctor.nameEn,
    title: doctor.title,
    education: doctor.education,
    experienceYears: doctor.experienceYears,
    bio: doctor.bio,
    specialties: [...doctor.specialties],
    credentials: [...doctor.credentials],
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const handleChange = (field: keyof typeof form, value: any) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    updateDoctor(nextForm);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDoctor(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleAddSpecialty = () => {
    const nextSpecialties = [...form.specialties, 'تخصص جديد'];
    const nextForm = { ...form, specialties: nextSpecialties };
    setForm(nextForm);
    updateDoctor(nextForm);
  };

  const handleRemoveSpecialty = (index: number) => {
    const nextSpecialties = form.specialties.filter((_, i) => i !== index);
    const nextForm = { ...form, specialties: nextSpecialties };
    setForm(nextForm);
    updateDoctor(nextForm);
  };

  const handleSpecialtyChange = (index: number, val: string) => {
    const next = [...form.specialties];
    next[index] = val;
    const nextForm = { ...form, specialties: next };
    setForm(nextForm);
    updateDoctor(nextForm);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-right max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>بيانات الطبيب والسيرة المهنية</span>
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
              يُحفظ تلقائياً ✓
            </span>
          </h3>
          <p className="text-xs text-slate-400">تعديل الاسم واللقب المهني والمؤهلات والخبرات</p>
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
          <span>تم حفظ بيانات الطبيب بنجاح وتحديث الموقع فورياً.</span>
        </div>
      )}

      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم باللغة العربية</label>
            <input
              type="text"
              value={form.nameAr}
              onChange={(e) => handleChange('nameAr', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم باللغة الإنجليزية</label>
            <input
              type="text"
              value={form.nameEn}
              onChange={(e) => handleChange('nameEn', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan text-left"
              dir="ltr"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">اللقب المهني والتخصص العام</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">المؤهل الأكاديمي والجامعة</label>
            <input
              type="text"
              value={form.education}
              onChange={(e) => handleChange('education', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">نبذة السيرة الذاتية والفلسفة الطبية</label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan leading-relaxed"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-300">قائمة التخصصات الدقيقة</label>
            <button
              type="button"
              onClick={handleAddSpecialty}
              className="text-xs text-brand-cyan hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة تخصص</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.specialties.map((spec, index) => (
              <div key={index} className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <input
                  type="text"
                  value={spec}
                  onChange={(e) => handleSpecialtyChange(index, e.target.value)}
                  className="bg-transparent border-0 text-white focus:outline-none w-28 sm:w-36 text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpecialty(index)}
                  className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </form>
  );
};
