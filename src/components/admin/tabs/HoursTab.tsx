import React, { useState, useEffect } from 'react';
import { Save, Check, Clock, Calendar, Sparkles } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';

export const HoursTab: React.FC = () => {
  const { data, updateClinic, updateBookingSettings } = useContent();
  const { clinic, bookingSettings } = data;

  const [form, setForm] = useState({
    hoursRegular: clinic.hoursRegular,
    hoursFriday: clinic.hoursFriday,
  });

  const [slotDuration, setSlotDuration] = useState<number>(bookingSettings.slotDurationMinutes || 60);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setSlotDuration(bookingSettings.slotDurationMinutes || 60);
  }, [bookingSettings.slotDurationMinutes]);

  const handleSlotSelect = (minutes: number) => {
    setSlotDuration(minutes);
    updateBookingSettings({ slotDurationMinutes: minutes });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleHoursChange = (field: keyof typeof form, val: string) => {
    const nextForm = { ...form, [field]: val };
    setForm(nextForm);
    updateClinic(nextForm);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinic(form);
    updateBookingSettings({ slotDurationMinutes: slotDuration });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-right max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>مواعيد عمل العيادة وفترات الحجز</span>
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
              يُحفظ تلقائياً ✓
            </span>
          </h3>
          <p className="text-xs text-slate-400">تحديث أوقات الاستقبال الأسبوعية وفترات الحجز المتاحة للمرضى</p>
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
          <span>تم حفظ مواعيد العمل وفترات الحجز بنجاح.</span>
        </div>
      )}

      {/* Slot Interval Selector */}
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-purple-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>الفاصل الزمني بين مواعيد الكشف (مدة الموعد):</span>
          </label>
          <span className="text-[11px] text-brand-lime font-bold">
            {slotDuration === 15 ? 'كل ربع ساعة (15 دقيقة)' :
             slotDuration === 30 ? 'كل نصف ساعة (30 دقيقة)' :
             slotDuration === 45 ? 'كل ساعة إلا ربع (45 دقيقة)' :
             'كل ساعة كاملة (60 دقيقة)'}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          يمكنك تغيير تكرار المواعيد في أي وقت، وسيتم تقسيم ساعات العمل بالموقع تلقائياً بناءً على اختيارك:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {[
            { minutes: 15, label: 'كل ربع ساعة', badge: '15 دقيقة', sub: '4 مواعيد / ساعة' },
            { minutes: 30, label: 'كل نصف ساعة', badge: '30 دقيقة', sub: 'موعدان / ساعة' },
            { minutes: 45, label: 'ساعة إلا ربع', badge: '45 دقيقة', sub: 'فحص واستشارة' },
            { minutes: 60, label: 'كل ساعة', badge: '60 دقيقة', sub: 'موعد واحد / ساعة' },
          ].map(opt => {
            const isSelected = slotDuration === opt.minutes;
            return (
              <button
                key={opt.minutes}
                type="button"
                onClick={() => handleSlotSelect(opt.minutes)}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600/30 border-purple-400 text-white shadow-md shadow-purple-500/20 ring-1 ring-purple-400 scale-[1.02]'
                    : 'bg-slate-900/90 border-slate-700/70 text-slate-300 hover:border-purple-400/50 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {opt.label}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected ? 'bg-purple-500 text-white font-bold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {opt.badge}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mb-1">
                  {opt.sub}
                </span>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[9px]">
                  {isSelected ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> مفعل ومحفوظ
                    </span>
                  ) : (
                    <span className="text-slate-500">اضغط للاختيار</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            مواعيد السبت إلى الخميس (النظام الأسبوعي)
          </label>
          <input
            type="text"
            value={form.hoursRegular}
            onChange={(e) => handleHoursChange('hoursRegular', e.target.value)}
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
            onChange={(e) => handleHoursChange('hoursFriday', e.target.value)}
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
