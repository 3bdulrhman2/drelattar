import React, { useState } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { useContent } from '../../context/ContentContext';

export const PublicBookingModule: React.FC = () => {
  const { data, addBookingAppointment } = useContent();
  const { bookingSettings } = data;

  // STRICT FEATURE FLAG: If disabled, render absolutely nothing
  if (!bookingSettings.isEnabled) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState(bookingSettings.startTime || '14:00');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim() || !appointmentDate) return;

    addBookingAppointment({
      patientName,
      patientPhone,
      appointmentDate,
      appointmentTime,
      notes,
    });

    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setPatientName('');
    setPatientPhone('');
    setAppointmentDate('');
    setNotes('');
    setIsOpen(false);
  };

  return (
    <div className="py-8 bg-purple-50/60 border-y border-purple-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
        <div>
          <span className="inline-block text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full mb-1">
            خدمة إضافية متاحة الآن
          </span>
          <h3 className="text-base sm:text-lg font-bold text-brand-dark">
            طلب حجز موعد كشف إلكتروني مسبق
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted">
            يمكنك إرسال طلب حجز لتأكيد موعدك مباشرة لدى إدارة العيادة.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all shrink-0"
        >
          طلب حجز موعد
        </button>
      </div>

      {/* Booking Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-purple-100 text-right relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute left-4 top-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-brand-dark">
                  تم استلام طلب الحجز بنجاح
                </h4>
                <p className="text-xs sm:text-sm text-brand-muted max-w-xs mx-auto">
                  شكراً لك {patientName}. سيقوم طاقم العيادة بمراجعة الموعد والتواصل معك على رقم الهاتف ({patientPhone}) لتأكيده.
                </p>
                <button
                  onClick={handleReset}
                  className="bg-brand-royal text-white px-6 py-2.5 rounded-xl text-xs font-bold"
                >
                  حسناً، تم
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-right">
                  <h4 className="text-lg font-bold text-brand-dark">
                    طلب موعد كشف بعيادة د. محمد السيد العطار
                  </h4>
                  <p className="text-xs text-brand-muted mt-1">
                    يرجى إدخال بيانات المريض لاختيار الوقت المناسب
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1">
                    اسم المريض ثلاثي
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="الاسم بالكامل"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-brand-royal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1">
                    رقم الهاتف المحمول (للتأكيد والمتابعة)
                  </label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-brand-royal text-left"
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">
                      تاريخ الكشف المطلوب
                    </label>
                    <input
                      type="date"
                      required
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">
                      الوقت التقريبي المفضل
                    </label>
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-royal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1">
                    ملاحظات أو شكوى طبية رئيسية (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثل: متابعة ضغط وسكر، كشف جديد، فحص بعد الخروج من المستشفى..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-royal"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-brand-muted hover:text-brand-dark"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-royal hover:bg-brand-medical text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all"
                  >
                    إرسال طلب الحجز
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
