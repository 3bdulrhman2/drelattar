import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  Calendar,
  Clock,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Phone,
  User,
  Filter,
  Trash2,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useContent } from '../../../context/ContentContext';
import { FutureBookingSettings } from '../../../types';
import { getCairoDateTime, formatTimeArabic } from '../../../lib/cairoTime';

export const FutureBookingTab: React.FC = () => {
  const {
    data,
    updateClinic,
    updateBookingSettings,
    addBookingAppointment,
    updateBookingStatus,
    deleteBookingAppointment,
  } = useContent();
  const { bookingSettings, bookings } = data;

  const { cairoTodayStr, cairoHour, cairoMinute, formattedDateArabic } = getCairoDateTime();

  const [settings, setSettings] = useState<FutureBookingSettings>({ ...bookingSettings });
  const [savedNotice, setSavedNotice] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Keep local tab settings in sync if remote Supabase loads or updates
  useEffect(() => {
    setSettings({ ...bookingSettings });
  }, [bookingSettings]);

  // Test appointment form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newDate, setNewDate] = useState(cairoTodayStr);
  const [newTime, setNewTime] = useState('14:00');
  const [newService, setNewService] = useState('كشف باطنة عامة ورعاية حرجة');

  const daysOfWeek = [
    { id: 'Saturday', label: 'السبت' },
    { id: 'Sunday', label: 'الأحد' },
    { id: 'Monday', label: 'الاثنين' },
    { id: 'Tuesday', label: 'الثلاثاء' },
    { id: 'Wednesday', label: 'الأربعاء' },
    { id: 'Thursday', label: 'الخميس' },
    { id: 'Friday', label: 'الجمعة' },
  ];

  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateBookingSettings(settings, {
      hoursRegular: `السبت إلى الخميس: من ${formatTimeArabic(settings.startTime || '13:00')} حتى ${formatTimeArabic(settings.endTime || '21:00')}`,
      hoursFriday: `الجمعة: من ${formatTimeArabic(settings.startTimeFriday || '16:00')} حتى ${formatTimeArabic(settings.endTimeFriday || '22:00')}`,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const toggleDay = (dayId: string) => {
    setSettings(prev => {
      const exists = prev.allowedDays.includes(dayId);
      const newDays = exists
        ? prev.allowedDays.filter(d => d !== dayId)
        : [...prev.allowedDays, dayId];
      updateBookingSettings({ allowedDays: newDays });
      return {
        ...prev,
        allowedDays: newDays,
      };
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleCreateTestBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newPatientPhone) return;

    addBookingAppointment({
      patientName: newPatientName.trim(),
      patientPhone: newPatientPhone.trim(),
      appointmentDate: newDate,
      appointmentTime: newTime,
      service: newService,
      notes: 'حجز تجريبي من لوحة الإدارة',
    });

    setNewPatientName('');
    setNewPatientPhone('');
    setShowAddModal(false);
  };

  const filteredBookings = statusFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === statusFilter);

  return (
    <div className="space-y-8 text-right max-w-4xl">
      
      {/* Header & Main Save */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span>وحدة الحجز المسبق وإدارة المواعيد (Cairo Timezone)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تفعيل أو تعطيل زر «احجز موعدك الآن» والصفحة العامة، مع إدارة طلبات الحجز المسبقة (ميعادين كل ساعة)
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>حفظ إعدادات الحجز</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>تم حفظ وتحديث إعدادات الحجز بنجاح ومزامنتها سحابياً.</span>
        </div>
      )}

      {/* Cairo Time Indicator */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-brand-cyan shrink-0" />
          <span>
            التوقيت الرسمي الحالي المعتمد للحجوزات: <strong className="text-white">توقيت القاهرة (Africa/Cairo)</strong>
          </span>
        </div>
        <div className="text-brand-cyan font-bold">
          {formattedDateArabic} • الساعة {formatTimeArabic(`${cairoHour}:${cairoMinute}`)}
        </div>
      </div>

      {/* Feature Flag Activation Switch (Controlled by Admin) */}
      <div className={`p-6 rounded-3xl border transition-all ${
        settings.isEnabled
          ? 'bg-purple-950/40 border-purple-500/40 shadow-lg'
          : 'bg-slate-800/90 border-slate-700/80'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${settings.isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <h4 className="text-base font-bold text-white">
                حالة زر «احجز موعدك الآن» وصفحة الحجز على الموقع العام
              </h4>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {settings.isEnabled
                ? '🟢 الحجز الإلكتروني مفعل الآن للجمهور! يظهر زر «احجز موعدك الآن» في هيدر الموقع بعد زر «اتصل الآن»، ويمكن للمرضى اختيار المواعيد الشاغرة.'
                : '🔴 الحجز الإلكتروني معطل ومحمي حالياً (الوضع الافتراضي). زر «احجز موعدك الآن» وصفحة الحجز مخفيان تماماً عن الزوار، ويتم الكشف هاتفياً أو بالحضور المباشر.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextVal = !settings.isEnabled;
              setSettings(prev => ({ ...prev, isEnabled: nextVal }));
              updateBookingSettings({ isEnabled: nextVal });
              setSavedNotice(true);
              setTimeout(() => setSavedNotice(false), 3000);
            }}
            className={`p-1 rounded-full transition-colors shrink-0 ${settings.isEnabled ? 'text-purple-400' : 'text-slate-500'}`}
            title={settings.isEnabled ? 'اضغط للتعطيل' : 'اضغط للتفعيل'}
          >
            {settings.isEnabled ? (
              <ToggleRight className="w-12 h-12" />
            ) : (
              <ToggleLeft className="w-12 h-12" />
            )}
          </button>
        </div>
      </div>

      {/* Booking Parameters Form */}
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-5">
        <h4 className="text-sm font-bold text-white border-b border-slate-700/60 pb-2 flex items-center justify-between">
          <span>إعدادات نظام المواعيد وساعات العمل المعتمدة</span>
          <span className="text-xs font-semibold text-brand-lime bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            {settings.slotDurationMinutes === 15 ? '4 حجوزات / ساعة (كل 15 دقيقة)' :
             settings.slotDurationMinutes === 30 ? 'حجزان / ساعة (كل نصف ساعة)' :
             settings.slotDurationMinutes === 45 ? 'فحص واستشارة (كل 45 دقيقة)' :
             'حجز واحد / ساعة (كل 60 دقيقة)'}
          </span>
        </h4>

        {/* Dynamic Working Hours Control */}
        {/* Slot Duration / Interval Selector */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-purple-500/40 space-y-3.5 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400 shrink-0" />
              <span>الفاصل الزمني بين المواعيد (عدد الحجوزات في الساعة):</span>
            </span>
            <span className="text-[11px] text-brand-lime font-bold bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-xl">
              المفعل سحابياً: {
                settings.slotDurationMinutes === 15 ? 'كل ربع ساعة (4 كشوفات في الساعة)' :
                settings.slotDurationMinutes === 30 ? 'كل نصف ساعة (كشفان في الساعة)' :
                settings.slotDurationMinutes === 45 ? 'كل ساعة إلا ربع (45 دقيقة)' :
                'كل ساعة كاملة (كشف واحد في الساعة)'
              }
            </span>
          </div>

          <p className="text-[11px] text-slate-300">
            اضغط على الخيار المطلوب لتعديله، <strong>يتم الحفظ السحابي والتطبيق على الموقع والعيادة فورياً وبشكل تلقائي:</strong>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { minutes: 15, label: 'كل ربع ساعة', badge: '15 دقيقة', sub: '4 مواعيد / ساعة' },
              { minutes: 30, label: 'كل نصف ساعة', badge: '30 دقيقة', sub: 'موعدان / ساعة' },
              { minutes: 45, label: 'ساعة إلا ربع', badge: '45 دقيقة', sub: 'فحص واستشارة' },
              { minutes: 60, label: 'كل ساعة', badge: '60 دقيقة', sub: 'موعد واحد / ساعة' },
            ].map(option => {
              const isSelected = (settings.slotDurationMinutes || 60) === option.minutes;
              return (
                <button
                  key={option.minutes}
                  type="button"
                  onClick={() => {
                    const newMinutes = option.minutes;
                    setSettings(prev => ({ ...prev, slotDurationMinutes: newMinutes }));
                    updateBookingSettings({ slotDurationMinutes: newMinutes });
                    setSavedNotice(true);
                    setTimeout(() => setSavedNotice(false), 3000);
                  }}
                  className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-md shadow-purple-500/20 ring-2 ring-purple-400 scale-[1.02]'
                      : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:border-purple-400/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {option.label}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isSelected ? 'bg-purple-500 text-white font-bold' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {option.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 mb-1">
                    {option.sub}
                  </span>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-700/50 text-[10px]">
                    {isSelected ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> تم الحفظ والتفعيل
                      </span>
                    ) : (
                      <span className="text-slate-500">اضغط للاختيار</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              * بمجرد الضغط يتم تقسيم مواعيد الحجز المتاحة للمرضى تلقائياً دون الحاجة لإعادة ضبط الفترات.
            </span>
            <button
              type="button"
              onClick={() => {
                updateBookingSettings({ slotDurationMinutes: settings.slotDurationMinutes || 60 });
                setSavedNotice(true);
                setTimeout(() => setSavedNotice(false), 3000);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>تأكيد حفظ الفاصل</span>
            </button>
          </div>
        </div>

        {/* Operating Hours Configuration (Regular & Friday) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Regular Days (Saturday - Thursday) */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                <span>مواعيد السبت إلى الخميس:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {settings.slotDurationMinutes === 15 ? 'كل ربع ساعة' :
                 settings.slotDurationMinutes === 30 ? 'كل نصف ساعة' :
                 settings.slotDurationMinutes === 45 ? 'كل 45 دقيقة' :
                 'حجز واحد لكل ساعة'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">ساعة البدء (24h)</label>
                <input
                  type="time"
                  value={settings.startTime || '13:00'}
                  onChange={(e) => setSettings(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-hidden focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ساعة الانتهاء (24h)</label>
                <input
                  type="time"
                  value={settings.endTime || '21:00'}
                  onChange={(e) => setSettings(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-hidden focus:border-purple-400"
                />
              </div>
            </div>

            <p className="text-[11px] text-brand-cyan">
              الحالي: من {formatTimeArabic(settings.startTime || '13:00')} حتى {formatTimeArabic(settings.endTime || '21:00')}
            </p>
          </div>

          {/* Friday Working Hours */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-lime" />
                <span>مواعيد يوم الجمعة:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {settings.slotDurationMinutes === 15 ? 'كل ربع ساعة' :
                 settings.slotDurationMinutes === 30 ? 'كل نصف ساعة' :
                 settings.slotDurationMinutes === 45 ? 'كل 45 دقيقة' :
                 'حجز واحد لكل ساعة'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">ساعة البدء (24h)</label>
                <input
                  type="time"
                  value={settings.startTimeFriday || '16:00'}
                  onChange={(e) => setSettings(prev => ({ ...prev, startTimeFriday: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-hidden focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ساعة الانتهاء (24h)</label>
                <input
                  type="time"
                  value={settings.endTimeFriday || '22:00'}
                  onChange={(e) => setSettings(prev => ({ ...prev, endTimeFriday: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-hidden focus:border-purple-400"
                />
              </div>
            </div>

            <p className="text-[11px] text-brand-lime">
              الحالي: من {formatTimeArabic(settings.startTimeFriday || '16:00')} حتى {formatTimeArabic(settings.endTimeFriday || '22:00')}
            </p>
          </div>

        </div>

        {/* Days of week selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            أيام العمل المتاحة للحجز الإلكتروني
          </label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map(day => {
              const active = settings.allowedDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot rule explanation */}
        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/50 text-xs text-slate-300 space-y-1.5">
          <p className="font-bold text-brand-lime flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>قواعد الحجز الذكية الصارمة:</span>
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1 pr-1 list-disc list-inside leading-relaxed">
            <li><strong className="text-white">الفاصل الزمني التلقائي:</strong> يتم تقسيم ساعات العمل تلقائياً بحسب اختيارك ({
              settings.slotDurationMinutes === 15 ? 'كل ربع ساعة - 15 دقيقة' :
              settings.slotDurationMinutes === 30 ? 'كل نصف ساعة - 30 دقيقة' :
              settings.slotDurationMinutes === 45 ? 'كل 45 دقيقة' :
              'كل ساعة - 60 دقيقة'
            }) لمنع أي تكدس للمرضى.</li>
            <li><strong className="text-white">مهلة 3 ساعات مسبقة:</strong> يشترط على المريض الحجز قبل الموعد بـ 3 ساعات على الأقل، وتُستبعد تلقائياً المواعيد الأقرب من ذلك.</li>
            <li><strong className="text-white">إخفاء الموعد المحجوز:</strong> الموعد الذي يقوم مريض بحجزه يختفي فوراً ولا يمكن لأي مريض آخر حجزه.</li>
            <li><strong className="text-white">التحديث اللحظي للمواعيد:</strong> أي تعديل في ساعات العمل أعلاه ينعكس فورياً وسحابياً على مواعيد الحجز المتاحة بالموقع.</li>
          </ul>
        </div>

      </div>

      {/* Bookings List Management */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              <span>طلبات الحجز المستلمة ({bookings.length})</span>
            </h4>
            <p className="text-xs text-slate-400">
              المواعيد المؤكدة والمحجوزة تختفي تلقائياً من المواعيد المتاحة للزوار
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden"
            >
              <option value="all">جميع الحالات ({bookings.length})</option>
              <option value="pending">قيد المراجعة ({bookings.filter(b => b.status === 'pending').length})</option>
              <option value="confirmed">مؤكد ({bookings.filter(b => b.status === 'confirmed').length})</option>
              <option value="completed">مكتمل ({bookings.filter(b => b.status === 'completed').length})</option>
              <option value="cancelled">ملغي ({bookings.filter(b => b.status === 'cancelled').length})</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حجز تجريبي</span>
            </button>
          </div>
        </div>

        {/* Bookings Table / Cards */}
        {filteredBookings.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
            لا توجد طلبات حجز مطابقة حالياً.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Patient Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{b.patientName}</span>
                    
                    {/* Status Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : b.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : b.status === 'completed'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {b.status === 'confirmed' && 'مؤكد'}
                      {b.status === 'pending' && 'قيد المراجعة'}
                      {b.status === 'completed' && 'مكتمل'}
                      {b.status === 'cancelled' && 'ملغي'}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">#{b.id}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>{b.appointmentDate}</span>
                    </span>

                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>الساعة {formatTimeArabic(b.appointmentTime)} (القاهرة)</span>
                    </span>

                    {b.service && (
                      <span className="text-[11px] text-brand-cyan">
                        • {b.service}
                      </span>
                    )}
                  </div>

                  {b.notes && (
                    <p className="text-[11px] text-slate-400">
                      ملاحظات: {b.notes}
                    </p>
                  )}
                </div>

                {/* Patient Direct Actions & Status Toggles */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                  
                  {/* WhatsApp contact */}
                  <a
                    href={`https://wa.me/20${b.patientPhone.replace(/\D/g, '').replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="محادثة واتساب"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">واتساب</span>
                  </a>

                  {/* Direct Phone Call */}
                  <a
                    href={`tel:${b.patientPhone}`}
                    className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="اتصال هاتفي"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{b.patientPhone}</span>
                  </a>

                  {/* Status Buttons */}
                  {b.status === 'pending' && (
                    <button
                      onClick={() => updateBookingStatus(b.id, 'confirmed')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      تأكيد
                    </button>
                  )}

                  {b.status !== 'cancelled' && (
                    <button
                      onClick={() => updateBookingStatus(b.id, 'cancelled')}
                      className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition-colors"
                      title="إلغاء الموعد وإعادة إتاحته في الموقع"
                    >
                      إلغاء
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف حجز المريض "${b.patientName}" نهائياً؟`)) {
                        deleteBookingAppointment(b.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                    title="حذف السجل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Add Test Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTestBooking}
            className="bg-slate-800 rounded-3xl p-6 border border-slate-700 w-full max-w-md space-y-4 text-right"
          >
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>إضافة موعد كشف تجريبي</span>
            </h4>

            <div>
              <label className="block text-xs text-slate-300 mb-1">اسم المريض</label>
              <input
                type="text"
                required
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                placeholder="مثال: أحمد محمود"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">رقم الهاتف</label>
              <input
                type="text"
                required
                value={newPatientPhone}
                onChange={(e) => setNewPatientPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-right"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">التاريخ</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">الوقت (القاهرة)</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'].map((t) => (
                    <option key={t} value={t}>
                      {formatTimeArabic(t)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
              >
                تأكيد وإضافة الحجز
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
