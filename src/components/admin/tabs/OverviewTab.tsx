import React from 'react';
import { ShieldCheck, Database, Calendar, Users, HeartPulse, Sparkles, MapPin, CheckCircle2, AlertTriangle, ArrowUpRight, HelpCircle } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';
import { isSupabaseConfigured } from '../../../lib/supabase';

interface OverviewTabProps {
  onSelectTab: (tabId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onSelectTab }) => {
  const { data } = useContent();
  const { doctor, clinic, services, equipment, bookingSettings, bookings, visibility } = data;

  return (
    <div className="space-y-8 text-right">
      
      {/* Top Banner Alert on Supabase state */}
      <div className={`p-5 rounded-2xl border ${
        isSupabaseConfigured 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
          : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
              {isSupabaseConfigured ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>الاتصال السحابي (Supabase) نشط ومتزامن</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>وضع المعاينة المحلي (Local Storage Active)</span>
                </>
              )}
            </div>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
              {isSupabaseConfigured
                ? 'يتم حفظ وتحديث كافة البيانات في قاعدة بيانات Supabase المؤمنة في الوقت الفعلي.'
                : 'التعديلات الحالية محفوظة ومفعلة محلياً في متصفحك. لربط تخزين سحابي دائم ومشترك عبر جميع الأجهزة، يرجى إضافة مفاتيح VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف البيئة .env.'}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 shrink-0">
            {isSupabaseConfigured ? 'سحابي' : 'محلي'}
          </span>
        </div>
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

        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>طلبات الحجز المستلمة</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{bookings.length} طلب</p>
          <span className="text-[11px] text-slate-400 block pt-1">
            {bookings.filter(b => b.status === 'pending').length} قيد المراجعة
          </span>
        </div>

      </div>

      {/* Clinic & Doctor Snapshot Card */}
      <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/60 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-cyan" />
          <span>بيانات العيادة المعتمدة والمعروضة حالياً</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-1.5">
            <span className="text-slate-400 font-semibold block">الطبيب المسؤول:</span>
            <p className="text-sm font-bold text-white">{doctor.nameAr}</p>
            <p className="text-brand-cyan">{doctor.title}</p>
            <p className="text-slate-400">{doctor.education}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-1.5">
            <span className="text-slate-400 font-semibold block">مقر العيادة ومواعيد العمل:</span>
            <p className="text-white font-medium">{clinic.address}</p>
            <p className="text-brand-lime">{clinic.hoursRegular}</p>
            <p className="text-slate-400">هواتف الاتصال: {clinic.phoneClinic} | {clinic.phoneDoctor}</p>
          </div>
        </div>
      </div>

    </div>
  );
};
