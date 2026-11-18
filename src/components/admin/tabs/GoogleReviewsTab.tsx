import React, { useState } from 'react';
import { Save, Check, ExternalLink, Key, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';
import { OFFICIAL_MAPS_LINK } from '../../../lib/googlePlaces';

export const GoogleReviewsTab: React.FC = () => {
  const { data, updateGoogleApiSettings } = useContent();
  const [apiKey, setApiKey] = useState(data.googlePlacesApiKey || '');
  const [placeId, setPlaceId] = useState(data.googlePlaceId || '');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateGoogleApiSettings(apiKey, placeId);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const isConfigured = Boolean(apiKey.trim() && placeId.trim());

  return (
    <form onSubmit={handleSave} className="space-y-6 text-right max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">إعدادات تكامل تقييمات Google Places API</h3>
          <p className="text-xs text-slate-400">ربط واجهة Google Places الرسمية لجلب أحدث التقييمات الحقيقية</p>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-brand-royal hover:bg-brand-medical text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all"
        >
          <Save className="w-4 h-4" />
          <span>حفظ الإعدادات</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>تم حفظ مفاتيح Google Places بنجاح.</span>
        </div>
      )}

      {/* Integration Status Box */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${
        isConfigured
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-slate-900 border-slate-700 text-slate-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <div>
            <span className="block text-xs font-bold">
              {isConfigured ? 'الواجهة البرمجية مهيأة للاتصال' : 'الوضع الاحتياطي الفائق نشط (Graceful Fallback)'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isConfigured
                ? 'يتم طلب أحدث 5 تقييمات مكتوبة مع معدل النجوم الرسمي من Google'
                : 'يتم توجيه الزوار بذكاء لمشاهدة وإضافة التقييمات على صفحة العيادة الرسمية بخرائط Google'}
            </span>
          </div>
        </div>

        <a
          href={OFFICIAL_MAPS_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-cyan hover:underline flex items-center gap-1 shrink-0"
        >
          <span>معاينة الرابط</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* API Configuration Form */}
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Google Places API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan font-mono"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Google Place ID للعيادة
          </label>
          <input
            type="text"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            placeholder="ChIJ..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan font-mono"
            dir="ltr"
          />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 text-xs text-slate-400 space-y-2 leading-relaxed">
          <p className="font-semibold text-slate-200">إرشادات تفعيل واجهة Google Places (New):</p>
          <ul className="list-disc list-inside space-y-1 text-[11px]">
            <li>قم بتفعيل مكتبة Places API (New) في مشروعك بـ Google Cloud Console.</li>
            <li>أنشئ API Key وقيّده بدومين موقع العيادة للأمان.</li>
            <li>وفقاً لسياسة Google، تُرجع الواجهة بحد أقصى أحدث 5 تقييمات مكتوبة مع البيانات الوصفية.</li>
          </ul>
        </div>
      </div>
    </form>
  );
};
