import React, { useState } from 'react';
import { Save, Check, Calendar, Clock, ToggleLeft, ToggleRight, CheckCircle, XCircle, AlertCircle, Plus, Phone, User, Filter } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';
import { BookingAppointment, FutureBookingSettings } from '../../../types';

export const FutureBookingTab: React.FC = () => {
  const { data, updateBookingSettings, addBookingAppointment, updateBookingStatus } = useContent();
  const { bookingSettings, bookings } = data;

  const [settings, setSettings] = useState<FutureBookingSettings>({ ...bookingSettings });
  const [savedNotice, setSavedNotice] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Test appointment form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newDate, setNewDate] = useState('2026-11-20');
  const [newTime, setNewTime] = useState('17:00');

  const daysOfWeek = [
    { id: 'Saturday', label: 'السبت' },
    { id: 'Sunday', label: 'الأحد' },
    { id: 'Monday', label: 'الاثنين' },
    { id: 'Tuesday', label: 'الثلاثاء' },
    { id: 'Wednesday', label: 'الأربعاء' },
    { id: 'Thursday', label: 'الخميس' },
    { id: 'Friday', label: 'الجمعة' },
  ];

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateBookingSettings(settings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const toggleDay = (dayId: string) => {
    setSettings(prev => {
      const exists = prev.allowedDays.includes(dayId);
      return {
        ...prev,
        allowedDays: exists
          ? prev.allowedDays.filter(d => d !== dayId)
          : [...prev.allowedDays, dayId],
      };
    });
  };

  const handleCreateTestBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newPatientPhone) return;

    addBookingAppointment({
      patientName: newPatientName,
      patientPhone: newPatientPhone,
      appointmentDate: newDate,
      appointmentTime: newTime,
      notes: 'حجز تجريبي من لوحة الإدارة لاختبار تدفق النظام',
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
            <span>وحدة الحجز المستقبلي (Future Booking Module)</span>
          </h3>
          <p className="text-xs text-slate-400">
            نظام حجز إلكتروني متكامل محمي خلف راية برمجية (Feature Flag)، معطل افتراضياً للجمهور
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="inline-flex items-center gap-2 bg-brand-royal hover:bg-brand-medical text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>حفظ إعدادات الحجز</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>تم حفظ إعدادات وتحديثات وحدة الحجز بنجاح.</span>
        </div>
      )}

      {/* Feature Flag Activation Switch */}
      <div className={`p-6 rounded-3xl border transition-all ${
        settings.isEnabled
          ? 'bg-purple-950/40 border-purple-500/40'
          : 'bg-slate-800/90 border-slate-700/80'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${settings.isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <h4 className="text-base font-bold text-white">
                تفعيل الحجز الإلكتروني العام على الموقع
              </h4>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {settings.isEnabled
                ? 'الحجز الإلكتروني نشط ومتاح حالياً للزوار على الواجهة العامة للموقع.'
                : 'الحجز الإلكتروني معطل ومحمي حالياً (الحالة الافتراضية الموصى بها). لا يظهر أي نموذج أو زر حجز للجمهور، ويتم التنسيق هاتفياً.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
            className={`p-1 rounded-full transition-colors ${settings.isEnabled ? 'text-purple-400' : 'text-slate-500'}`}
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
        <h4 className="text-sm font-bold text-white border-b border-slate-700/60 pb-2">
          إعدادات الأيام والأوقات المتاحة للحجز
        </h4>

        {/* Days of week selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            أيام الاستقبال المسموح بحجزها
          </label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map(day => {
              const active = settings.allowedDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Window */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">بدء موعد الاستقبال</label>
            <input
              type="time"
              value={settings.startTime}
              onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">نهاية موعد الاستقبال</label>
            <input
              type="time"
              value={settings.endTime}
              onChange={(e) => setSettings({ ...settings, endTime: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">أقصى عدد كشوفات يومياً</label>
            <input
              type="number"
              value={settings.maxDailyBookings}
              onChange={(e) => setSettings({ ...settings, maxDailyBookings: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* Bookings Management & Requests */}
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white">إدارة طلبات ومواعيد المرضى ({bookings.length})</h4>
            <p className="text-xs text-slate-400">متابعة واعتماد أو إلغاء مواعيد الحجز</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs bg-slate-900 hover:bg-slate-700 text-purple-300 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة موعد تجريبي</span>
            </button>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            تصفية:
          </span>
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                statusFilter === st ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' && 'الكل'}
              {st === 'pending' && 'قيد الانتظار'}
              {st === 'confirmed' && 'مؤكد'}
              {st === 'completed' && 'مكتمل'}
              {st === 'cancelled' && 'ملغي'}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs bg-slate-900/50 rounded-xl border border-slate-700/50">
            لا توجد طلبات حجز مسجلة حالياً ضمن هذا التصنيف.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{b.patientName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      b.status === 'cancelled' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      b.status === 'completed' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {b.status === 'pending' && 'قيد المراجعة'}
                      {b.status === 'confirmed' && 'تم التأكيد'}
                      {b.status === 'completed' && 'تم الكشف'}
                      {b.status === 'cancelled' && 'ملغي'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1" dir="ltr">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {b.patientPhone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {b.appointmentDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {b.appointmentTime}
                    </span>
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2">
                  {b.status !== 'confirmed' && (
                    <button
                      onClick={() => updateBookingStatus(b.id, 'confirmed')}
                      className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-lg text-xs font-semibold"
                    >
                      تأكيد
                    </button>
                  )}
                  {b.status !== 'cancelled' && (
                    <button
                      onClick={() => updateBookingStatus(b.id, 'cancelled')}
                      className="px-2.5 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded-lg text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  )}
                  {b.status !== 'completed' && (
                    <button
                      onClick={() => updateBookingStatus(b.id, 'completed')}
                      className="px-2.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-xs font-semibold"
                    >
                      إتمام
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Add Test Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTestBooking}
            className="bg-slate-800 rounded-2xl p-6 border border-slate-700 w-full max-w-md space-y-4 text-right"
          >
            <h4 className="text-base font-bold text-white">إضافة موعد كشف تجريبي</h4>

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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                dir="ltr"
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
                <label className="block text-xs text-slate-300 mb-1">الوقت</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
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
                إضافة الحجز
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
