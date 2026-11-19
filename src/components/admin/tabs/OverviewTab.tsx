import React from 'react';
import {
  ShieldCheck,
  Calendar,
  HeartPulse,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  ImageIcon,
} from 'lucide-react';
import { useContent } from '../../../context/ContentContext';

interface OverviewTabProps {
  onSelectTab: (tabId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onSelectTab }) => {
  const { data, isBackendSynced } = useContent();
  const { services, equipment, bookingSettings, bookings, socialReviewImages } = data;

  return (
    <div className="space-y-8 text-right">
      
      {/* Top Banner: Content Sync State */}
      <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
        isBackendSynced
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
              <CheckCircle2 className={`w-5 h-5 ${isBackendSynced ? 'text-emerald-400' : 'text-brand-cyan'} shrink-0`} />
              <span>نظام إدارة محتوى العيادة الآمن (Admin Console)</span>
            </div>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed max-w-2xl">
              كافة التعديلات التي تجريها على بيانات الطبيب، مواعيد العمل، الخدمات الطبية، والآراء، تُحفظ تلقائياً وتنعكس فورياً للزوار عبر جميع الأجهزة.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-white/10 text-slate-200 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isBackendSynced ? 'bg-emerald-400 animate-pulse' : 'bg-brand-cyan'}`} />
              <span>{isBackendSynced ? 'سحابي متزامن' : 'نظام نشط'}</span>
            </span>
          </div>
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
            <span>آراء وسائل التواصل</span>
            <ImageIcon className="w-4 h-4 text-blue-400" />
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
