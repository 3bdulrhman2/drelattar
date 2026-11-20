import React, { useState } from 'react';
import { CalendarOff, Calendar, Plus, Trash2, Bell, Check, AlertCircle, Info, Sparkles } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';
import { getCairoDateTime, getCairoTodayString, formatAppointmentDateArabic } from '../../../lib/cairoTime';

export const HolidaysManagementTab: React.FC = () => {
  const {
    data,
    toggleCloseToday,
    toggleCloseDate,
    addHoliday,
    deleteHoliday,
    addAnnouncement,
    deleteAnnouncement,
    publishBroadcastNotification,
  } = useContent();

  const { bookingSettings } = data;
  const todayStr = getCairoTodayString();
  const cairoTime = getCairoDateTime();

  // Close specific date picker
  const [selectedDateToClose, setSelectedDateToClose] = useState(todayStr);

  // Holiday Form State
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayStart, setHolidayStart] = useState(todayStr);
  const [holidayEnd, setHolidayEnd] = useState(todayStr);
  const [holidayReason, setHolidayReason] = useState('');
  const [holidayNotice, setHolidayNotice] = useState(false);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<'info' | 'warning' | 'alert' | 'closure'>('info');
  const [annNotice, setAnnNotice] = useState(false);

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayTitle.trim() || !holidayStart || !holidayEnd) {
      alert('يرجى كتابة عنوان الإجازة وتاريخ البداية والنهاية');
      return;
    }

    addHoliday({
      title: holidayTitle.trim(),
      startDate: holidayStart,
      endDate: holidayEnd,
      reason: holidayReason.trim() || undefined,
      isActive: true,
      createdBy: 'admin',
    });

    setHolidayTitle('');
    setHolidayReason('');
    setHolidayNotice(true);
    setTimeout(() => setHolidayNotice(false), 3000);
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      alert('يرجى ملء عنوان ومحتوى التنبيه');
      return;
    }

    await publishBroadcastNotification(
      annTitle.trim(),
      annContent.trim(),
      annType as any,
      true
    );

    setAnnTitle('');
    setAnnContent('');
    setAnnNotice(true);
    setTimeout(() => setAnnNotice(false), 3000);
  };

  return (
    <div className="space-y-8 text-right max-w-4xl">
      
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <CalendarOff className="w-5 h-5 text-brand-cyan" />
          <span>إدارة الإجازات، الإغلاق المؤقت، والإعلانات</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          التحكم الكامل بأيام وساعات توقف الحجز، جدولة العطلات الرسمية، ونشر التنبيهات الفورية أعلى الموقع
        </p>
      </div>

      {holidayNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>تمت جدولة وتفعيل الإجازة الرسمية بنجاح ومزامنتها بالموقع.</span>
        </div>
      )}

      {annNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>تم نشر الإعلان فورياً في الشريط العلوي للموقع.</span>
        </div>
      )}

      {/* SECTION 1: Today's Closure Toggle & Specific Dates */}
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-6">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
          <Sparkles className="w-4 h-4 text-brand-cyan" />
          <span>التحكم في إغلاق اليوم ومواعيد محددة</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Today's Toggle Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">حالة حجوزات اليوم ({cairoTime.formattedDateArabic})</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  bookingSettings.isClosedToday
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {bookingSettings.isClosedToday ? 'مغلق اليوم' : 'مفتوح ومتاح'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              {bookingSettings.isClosedToday
                ? 'الحجز متوقف حالياً لليوم بالموقع. انقر الزر بالأسفل لإعادة الفتح.'
                : 'المرضى يستطيعون حجز مواعيد اليوم. انقر الزر لإيقاف الحجز لليوم فوراً.'}
            </p>

            <button
              type="button"
              onClick={() => {
                const nextState = !bookingSettings.isClosedToday;
                const reason = nextState
                  ? prompt('سبب إغلاق حجوزات اليوم (اختياري ليظهر للمرضى):', 'الحجز متوقف اليوم لظروف طارئة بالعيادة') || ''
                  : '';
                toggleCloseToday(nextState, reason);
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                bookingSettings.isClosedToday
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {bookingSettings.isClosedToday ? 'إعادة فتح حجوزات اليوم' : 'إغلاق حجوزات اليوم فوراً'}
            </button>
          </div>

          {/* Close Specific Future Date Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-3">
            <span className="font-bold text-white text-xs block">إغلاق موعد أو يوم محدد مستقبلاً:</span>
            <p className="text-[11px] text-slate-400">
              اختر أي يوم قادم لمنع المرضى من حجز مواعيد فيه عبر التقويم.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="date"
                value={selectedDateToClose}
                min={todayStr}
                onChange={(e) => setSelectedDateToClose(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden w-full"
              />
              <button
                type="button"
                onClick={() => {
                  const isAlreadyClosed = (bookingSettings.closedDates || []).includes(selectedDateToClose);
                  toggleCloseDate(selectedDateToClose, !isAlreadyClosed);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                  (bookingSettings.closedDates || []).includes(selectedDateToClose)
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {(bookingSettings.closedDates || []).includes(selectedDateToClose) ? 'إعادة فتح' : 'إغلاق هذا اليوم'}
              </button>
            </div>
          </div>

        </div>

        {/* Closed Dates Badges */}
        {bookingSettings.closedDates && bookingSettings.closedDates.length > 0 && (
          <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">الأيام الفردية المغلقة حالياً:</span>
            {bookingSettings.closedDates.map((date) => (
              <span
                key={date}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20"
              >
                <span>{formatAppointmentDateArabic(date)}</span>
                <button
                  onClick={() => toggleCloseDate(date, false)}
                  className="hover:text-rose-100"
                  title="إلغاء الإغلاق وفتح اليوم مجدداً"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Add Scheduled Holiday Form */}
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-5">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
          <Calendar className="w-4 h-4 text-brand-cyan" />
          <span>جدولة إجازة أو عطلة مسبقة للعيادة</span>
        </h4>

        <form onSubmit={handleAddHoliday} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                عنوان الإجازة (مثال: إجازة عيد الفطر / عطلة سنوية)
              </label>
              <input
                type="text"
                value={holidayTitle}
                onChange={(e) => setHolidayTitle(e.target.value)}
                placeholder="عنوان الإجازة..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                رسالة مخصصة للمرضى (اختياري)
              </label>
              <input
                type="text"
                value={holidayReason}
                onChange={(e) => setHolidayReason(e.target.value)}
                placeholder="مثال: نعتذر عن استقبال الكشوفات للإجازة ونستقبلكم السبت"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                تاريخ بداية الإجازة
              </label>
              <input
                type="date"
                value={holidayStart}
                onChange={(e) => setHolidayStart(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                تاريخ نهاية الإجازة
              </label>
              <input
                type="date"
                value={holidayEnd}
                onChange={(e) => setHolidayEnd(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-brand-royal hover:bg-brand-medical text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة وتفعيل الإجازة الآن</span>
            </button>
          </div>
        </form>

        {/* Existing Holidays List */}
        {bookingSettings.holidays && bookingSettings.holidays.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-slate-700/60">
            <span className="text-xs font-bold text-slate-300 block">الإجازات المجدولة المسجلة:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bookingSettings.holidays.map((h) => (
                <div
                  key={h.id}
                  className="bg-slate-900 p-3.5 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{h.title}</span>
                    <span className="text-[11px] text-brand-cyan">
                      من {h.startDate} حتى {h.endDate}
                    </span>
                    {h.reason && <p className="text-[11px] text-slate-400 mt-0.5">{h.reason}</p>}
                  </div>
                  <button
                    onClick={() => deleteHoliday(h.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                    title="حذف الإجازة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Custom Website Announcement Bar */}
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-5">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
          <Bell className="w-4 h-4 text-amber-400" />
          <span>شريط الإعلانات والتنبيهات المخصصة بالموقع</span>
        </h4>

        <form onSubmit={handleAddAnnouncement} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                عنوان التنبيه
              </label>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="مثال: تنويه هام بمواعيد الكشف"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                نوع وشكل التنبيه
              </label>
              <select
                value={annType}
                onChange={(e) => setAnnType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden"
              >
                <option value="info">إشعار إخباري عام (أزرق ملكي)</option>
                <option value="warning">تنبيه هام (أصفر / برتقالي)</option>
                <option value="alert">تنبيه عاجل / إغلاق (أحمر)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              محتوى التنبيه
            </label>
            <textarea
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="اكتب التنبيه أو الإعلان الذي سيظهر أعلى صفحات الموقع..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan min-h-[70px]"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all"
            >
              <Bell className="w-4 h-4" />
              <span>نشر التنبيه أعلى الموقع الآن</span>
            </button>
          </div>
        </form>

        {/* Existing Announcements List */}
        {bookingSettings.announcements && bookingSettings.announcements.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-slate-700/60">
            <span className="text-xs font-bold text-slate-300 block">التنبيهات المنشورة حالياً:</span>
            <div className="space-y-2">
              {bookingSettings.announcements.map((a) => (
                <div
                  key={a.id}
                  className="bg-slate-900 p-3.5 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-white block">{a.title}</span>
                    <p className="text-slate-300">{a.content}</p>
                  </div>
                  <button
                    onClick={() => deleteAnnouncement(a.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                    title="حذف الإعلان"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
