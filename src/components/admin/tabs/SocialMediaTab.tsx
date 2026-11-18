import React, { useState } from 'react';
import { Save, Check, Share2 } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';

export const SocialMediaTab: React.FC = () => {
  const { data, updateSocial } = useContent();
  const { social } = data;

  const [form, setForm] = useState({
    facebook: social.facebook,
    instagram: social.instagram,
    tiktok: social.tiktok,
    whatsappClinic: social.whatsappClinic,
    whatsappDoctor: social.whatsappDoctor,
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSocial(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-right max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">روابط التواصل الاجتماعي والواتساب</h3>
          <p className="text-xs text-slate-400">تحديث الروابط الرسمية لصفحات فيسبوك، إنستغرام، تيك توك ومحادثات واتساب</p>
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
          <span>تم حفظ روابط التواصل الاجتماعي بنجاح.</span>
        </div>
      )}

      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">رابط صفحة Facebook</label>
          <input
            type="url"
            value={form.facebook}
            onChange={(e) => setForm({ ...form, facebook: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">رابط حساب Instagram</label>
          <input
            type="url"
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">رابط حساب TikTok</label>
          <input
            type="url"
            value={form.tiktok}
            onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
            dir="ltr"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-700/60">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">رابط WhatsApp العيادة</label>
            <input
              type="text"
              value={form.whatsappClinic}
              onChange={(e) => setForm({ ...form, whatsappClinic: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">رابط WhatsApp الطبيب</label>
            <input
              type="text"
              value={form.whatsappDoctor}
              onChange={(e) => setForm({ ...form, whatsappDoctor: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
              dir="ltr"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
