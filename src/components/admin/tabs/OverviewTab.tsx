import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  Users,
  HeartPulse,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Key,
  ExternalLink,
  RefreshCw,
  X,
  Database,
  Check,
} from 'lucide-react';
import { useContent } from '../../../context/ContentContext';
import {
  isSupabaseConfigured,
  setDirectSupabaseCredentials,
  clearDirectSupabaseCredentials,
  getActiveSupabaseCredentials,
} from '../../../lib/supabase';

interface OverviewTabProps {
  onSelectTab: (tabId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onSelectTab }) => {
  const { data } = useContent();
  const { services, equipment, bookingSettings, bookings, socialReviewImages } = data;

  const activeCreds = getActiveSupabaseCredentials();
  const [showConfigBox, setShowConfigBox] = useState(!isSupabaseConfigured);
  const [inputUrl, setInputUrl] = useState(activeCreds.url || '');
  const [inputKey, setInputKey] = useState(activeCreds.anonKey || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      setErrorMsg('يرجى إدخال رابط المشروع والمفتاح العام معاً');
      return;
    }
    if (!inputUrl.startsWith('https://')) {
      setErrorMsg('رابط المشروع يجب أن يبدأ بـ https:// (مثال: https://xyz.supabase.co)');
      return;
    }
    setErrorMsg('');
    setDirectSupabaseCredentials(inputUrl, inputKey);
  };

  const handleDisconnect = () => {
    if (confirm('هل أنت متأكد من قطع الاتصال المباشر والعودة لوضع التخزين المحلي؟')) {
      clearDirectSupabaseCredentials();
    }
  };

  return (
    <div className="space-y-8 text-right">
      
      {/* Top Banner Alert on Supabase state */}
      <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
        isSupabaseConfigured 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
          : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
              {isSupabaseConfigured ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>الاتصال السحابي (Supabase) نشط ومتزامن بنجاح</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                  <span>وضع التخزين المحلي نشط (لم يتم الربط مع سوبابيز بعد)</span>
                </>
              )}
            </div>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed max-w-2xl">
              {isSupabaseConfigured
                ? `قاعدة البيانات السحابية متصلة (${activeCreds.source === 'manual' ? 'مفاتيح المتصفح المباشرة' : 'متغيرات بيئة Vercel'}). يتم حفظ وتحديث كافة البيانات في الوقت الفعلي.`
                : 'التعديلات الحالية محفوظة ومفعلة محلياً فقط. إذا قمت بإضافة المفاتيح في Vercel تأكد من عمل Redeploy، أو يمكنك إدخال المفاتيح هنا مباشرة للاتصال الفوري.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowConfigBox(!showConfigBox)}
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{isSupabaseConfigured ? 'إعدادات المفاتيح' : 'إدخال المفاتيح مباشرة'}</span>
            </button>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/15">
              {isSupabaseConfigured ? 'سحابي متصل' : 'تخزين محلي'}
            </span>
          </div>
        </div>

        {/* Expandable Manual Key Input Box */}
        {showConfigBox && (
          <div className="mt-5 pt-5 border-t border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-cyan" />
                <span>ربط سوبابيز الفوري المباشر (Direct Supabase Connection)</span>
              </h4>
              <button
                onClick={() => setShowConfigBox(false)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              يمكنك لصق مفاتيح سوبابيز هنا مباشرة للاتصال الفوري دون انتظار إعادة بناء الموقع على Vercel:
            </p>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveCredentials} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Project URL (رابط المشروع من سوبابيز)
                  </label>
                  <input
                    type="url"
                    required
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://xxxxxxxx.supabase.co"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    anon public key (المفتاح العام)
                  </label>
                  <input
                    type="password"
                    required
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="eyJh..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وتفعيل الاتصال بسوبابيز الآن</span>
                </button>

                {activeCreds.source === 'manual' && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-xs text-rose-400 hover:underline px-3 py-2"
                  >
                    قطع الاتصال والعودة للتخزين المحلي
                  </button>
                )}
              </div>
            </form>

            {/* Vercel Troubleshooting Tips */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
              <p className="font-bold text-brand-cyan flex items-center gap-1.5">
                <span>💡 لماذا لم يظهر الاتصال تلقائياً بعد إضافة المتغيرات في Vercel؟</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pr-1">
                <li>
                  <strong className="text-white">خطوة Redeploy الإلزامية:</strong> عند إضافة متغيرات جديدة في Vercel، لا تطبق تلقائياً على النسخة القديمة؛ يجب الذهاب إلى <strong className="text-white">Deployments</strong> والضغط على <strong className="text-white">...</strong> بجانب أحدث Deployment واختيار <strong className="text-white">Redeploy</strong>.
                </li>
                <li>
                  <strong className="text-white">تسمية المفاتيح:</strong> يجب أن تبدأ بـ <strong className="text-emerald-400">VITE_</strong> حصراً: <code className="text-slate-200">VITE_SUPABASE_URL</code> و <code className="text-slate-200">VITE_SUPABASE_ANON_KEY</code> (أي متغير بدون VITE_ يتجاهله المتصفح).
                </li>
              </ul>
            </div>

          </div>
        )}
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>الخدمات الطبية</span>
            <HeartPulse className="w-4 h-4 text-brand-cyan" />
          </div>
          <p className="text-2xl font-black text-white">{services.length} خدمة</p>
          <button
            onClick={() => onSelectTab('services')}
            className="text-xs text-brand-cyan hover:underline flex items-center gap-1 pt-1"
          >
            <span>إدارة الخدمات</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>الأجهزة والتقنيات</span>
            <Sparkles className="w-4 h-4 text-brand-lime" />
          </div>
          <p className="text-2xl font-black text-white">{equipment.length} أجهزة معتمدة</p>
          <button
            onClick={() => onSelectTab('equipment')}
            className="text-xs text-brand-lime hover:underline flex items-center gap-1 pt-1"
          >
            <span>إدارة التجهيزات</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>آراء وسائل التواصل</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{socialReviewImages?.length || 0} صورة</p>
          <button
            onClick={() => onSelectTab('reviews')}
            className="text-xs text-blue-300 hover:underline flex items-center gap-1 pt-1"
          >
            <span>إدارة الآراء والمحادثات</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>حالة نظام الحجز المستقبلي</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${bookingSettings.isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <p className="text-lg font-bold text-white">
              {bookingSettings.isEnabled ? 'مفعل للجمهور' : 'معطل ومحمي (الافتراضي)'}
            </p>
          </div>
          <button
            onClick={() => onSelectTab('booking')}
            className="text-xs text-purple-300 hover:underline flex items-center gap-1 pt-1"
          >
            <span>إعدادات الحجز</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* Clinic & Doctor Snapshot Card */}
      <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/60 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-cyan" />
          <span>بيانات العيادة المعتمدة والمعروضة حالياً</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-1">
            <span className="text-slate-400">الطبيب:</span>
            <p className="font-bold text-white text-sm">د. محمد السيد العطار</p>
            <p className="text-slate-400 text-[11px]">أخصائي الباطنة العامة والعناية المركزة والحالات الحرجة</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-1">
            <span className="text-slate-400">مقر العيادة:</span>
            <p className="font-bold text-white text-sm">مركز الحسينية - محافظة الشرقية</p>
            <p className="text-slate-400 text-[11px]">كوبري واحد بحر البقر – أمام موقف السيارات</p>
          </div>
        </div>
      </div>

    </div>
  );
};
