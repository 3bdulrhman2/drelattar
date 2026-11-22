import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MessageCircle,
  CalendarOff,
} from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { supabase } from '../../lib/supabase';
import {
  getCairoDateTime,
  generateDaySlots,
  getUpcomingCairoDays,
  formatTimeArabic,
  formatTimeArabicFull,
  formatAppointmentDateArabic,
  isDateClosed,
} from '../../lib/cairoTime';

export const PublicBookingModule: React.FC = () => {
  const { data, addBookingAppointment } = useContent();
  const { bookingSettings, clinic, doctor } = data;

  const { cairoTodayStr, formattedDateArabic } = getCairoDateTime();
  const advanceDaysCount = Number(bookingSettings.maxAdvanceDays) > 0 ? Number(bookingSettings.maxAdvanceDays) : 14;
  const upcomingDays = useMemo(() => getUpcomingCairoDays(advanceDaysCount), [cairoTodayStr, advanceDaysCount]);

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>(upcomingDays[0]?.dateStr || cairoTodayStr);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [service, setService] = useState('كشف باطنة عامة ورعاية حرجة');
  const [notes, setNotes] = useState('');
  const [submittedBooking, setSubmittedBooking] = useState<{
    id: string;
    patientName: string;
    patientPhone: string;
    date: string;
    time: string;
    service: string;
  } | null>(null);

  // Dynamic hours from admin panel
  const workingHoursConfig = useMemo(() => ({
    startTimeRegular: bookingSettings.startTime || '13:00',
    endTimeRegular: bookingSettings.endTime || '21:00',
    startTimeFriday: bookingSettings.startTimeFriday || '16:00',
    endTimeFriday: bookingSettings.endTimeFriday || '22:00',
    slotDurationMinutes: bookingSettings.slotDurationMinutes || 60,
  }), [bookingSettings]);

  const slotIntervalLabel = useMemo(() => {
    const mins = Number(bookingSettings.slotDurationMinutes) || 60;
    if (mins === 15) return 'كل ربع ساعة';
    if (mins === 30) return 'كل نصف ساعة';
    if (mins === 45) return 'كل ساعة إلا ربع';
    return 'كل ساعة';
  }, [bookingSettings.slotDurationMinutes]);

  const [bookedTimesForSelectedDate,setBookedTimes]=useState<string[]>([]);
  const [availabilityReady,setAvailabilityReady]=useState(false);
  const [submitError,setSubmitError]=useState('');
  const [isSubmitting,setIsSubmitting]=useState(false);
  const request=useRef<{fingerprint:string;id:string}|null>(null);
  const refreshAvailability = async () => {
    if(!supabase||!bookingSettings.isEnabled){setAvailabilityReady(false);return;}
    const {data:rows,error}=await supabase.rpc('get_booked_slots',{p_date:selectedDate});
    if(error){setAvailabilityReady(false);setSubmitError('تعذر تحديث المواعيد. لم نتأكد من حالة الطلب؛ راجع العيادة قبل إرسال طلب مختلف.');return;}
    setBookedTimes((rows||[]).map((r:any)=>r.appointment_time));setAvailabilityReady(true);
  };
  useEffect(()=>{
    let active=true;setAvailabilityReady(false);setSelectedTime('');setSubmitError('');
    if(supabase&&bookingSettings.isEnabled){
      supabase.rpc('get_booked_slots',{p_date:selectedDate}).then(({data:rows,error})=>{
        if(!active)return;
        if(error){setSubmitError('تعذر التحقق من المواعيد. لم يُرسل أي طلب.');return;}
        setBookedTimes((rows||[]).map((r:any)=>r.appointment_time));setAvailabilityReady(true);
      });
    }
    return()=>{active=false;};
  },[selectedDate,bookingSettings.isEnabled]);

  // Check if selected date is closed by admin, secretary or holiday
  const selectedDateClosure = useMemo(() => {
    return isDateClosed(selectedDate, bookingSettings);
  }, [selectedDate, bookingSettings]);

  // Generate slots (1 per hour) for selected date, applying:
  // 1. Dynamic operating hours from admin
  // 2. 1 slot per hour
  // 3. Minimum 3 hours advance booking rule
  // 4. Omission of already booked slots
  // 5. Total closure of day if clinic is closed
  const availableSlots = useMemo(() => {
    if (!availabilityReady || selectedDateClosure.isClosed) return [];
    const allSlots = generateDaySlots(selectedDate, bookedTimesForSelectedDate, workingHoursConfig);
    return allSlots.filter((s) => s.isAvailable);
  }, [selectedDate, bookedTimesForSelectedDate, workingHoursConfig, selectedDateClosure, availabilityReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(isSubmitting||!availabilityReady)return;
    setSubmitError('');
    if (selectedDateClosure.isClosed) {
      alert(`عذراً، هذا اليوم غير متاح للحجز (${selectedDateClosure.reason || 'العيادة مغلقة'}). يرجى اختيار يوم آخر.`);
      return;
    }
    if (!patientName.trim() || !patientPhone.trim() || !selectedDate || !selectedTime) {
      alert('يرجى ملء جميع البيانات الأساسية واختيار موعد الكشف');
      return;
    }

    // Availability is advisory. The server is authoritative, and a retry must
    // be allowed to recover an already-saved receipt after a lost response.
    const input={patientName:patientName.trim(),patientPhone:patientPhone.trim(),appointmentDate:selectedDate,appointmentTime:selectedTime};
    const fingerprint=JSON.stringify(input);
    if(request.current?.fingerprint!==fingerprint)request.current={fingerprint,id:crypto.randomUUID()};
    setIsSubmitting(true);
    try {
      const receipt=await addBookingAppointment(input,request.current.id);
      setSubmittedBooking({id:receipt.id,patientName:input.patientName,patientPhone:input.patientPhone,
        date:selectedDate,time:selectedTime,service:'زيارة العيادة'});
      request.current=null;
    } catch(error) {
      setSubmitError(error instanceof Error?error.message:'لم يتم حفظ الطلب.');
      await refreshAvailability();
      return;
    } finally {setIsSubmitting(false);}

    // Reset fields
    setSelectedTime('');
    setPatientName('');
    setPatientPhone('');
    setNotes('');
  };

  const servicesList = [
    'كشف باطنة عامة ورعاية حرجة',
    'فحص الموجات فوق الصوتية (السونار)',
    'تخطيط ورسم كهربية القلب (ECG)',
    'متابعة وتشخيص السكري ومقاومة الإنسولين',
    'ضبط ضغط الدم والدهون والوقاية الوعائية',
    'تشخيص أمراض الجهاز الهضمي والكبد والقولون',
    'جلسات أكسجين وتنفس بالبخار (Nebulizer)',
    'استشارة طبية وفحص شامل',
  ];

  if (!bookingSettings.isEnabled) return null;
  return (
    <section id="booking" className="py-16 lg:py-24 bg-gradient-to-b from-white via-purple-50/30 to-brand-bg relative overflow-hidden">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-brand-royal/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold shadow-xs">
            <Calendar className="w-4 h-4 text-purple-700" />
            <span>نظام الحجز المسبق الإلكتروني</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-brand-dark leading-tight">
            احجز موعد كشفك مسبقاً بكل سهولة
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-brand-muted leading-relaxed">
            اختر الموعد الأنسب لك من المواعيد المتاحة؛ المواعيد بتوقيت القاهرة الرسمي، وبمعدل حجز واحد كل ساعة لضمان راحتكم وعدم التكدس (يلزم الحجز قبل الموعد بـ 3 ساعات على الأقل).
          </p>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-purple-800 bg-purple-50 py-1.5 px-4 rounded-xl border border-purple-100 w-fit mx-auto">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>التوقيت الحالي: بتوقيت القاهرة (Africa/Cairo) • {formattedDateArabic}</span>
          </div>
        </div>

        {/* BOOKING SUCCESS SCREEN */}
        {submittedBooking ? (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-emerald-200 shadow-xl text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                تم استلام طلب الحجز بنجاح
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-brand-dark">
                أهلاً بك يا {submittedBooking.patientName}، طلبك مسجل لدينا!
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto">
                تم حفظ طلبك بحالة انتظار المراجعة. الموعد غير مؤكد نهائياً حتى تؤكده العيادة.
              </p>
            </div>

            {/* Appointment Ticket Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 max-w-md mx-auto text-right space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">رقم الحجز:</span>
                <span className="font-mono font-bold text-brand-royal text-sm">{submittedBooking.id}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">اسم المريض:</span>
                <span className="font-bold text-slate-800">{submittedBooking.patientName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">رقم التواصل:</span>
                <span className="font-mono font-bold text-slate-800" dir="ltr">{submittedBooking.patientPhone}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">الطبيب:</span>
                <span className="font-bold text-slate-800">{doctor.nameAr}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">تاريخ الحجز:</span>
                <span className="font-bold text-purple-700">{formatAppointmentDateArabic(submittedBooking.date)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">موعد الزيارة (توقيت القاهرة):</span>
                <span className="font-black text-emerald-700 text-sm">{formatTimeArabicFull(submittedBooking.time)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">نوع الخدمة:</span>
                <span className="font-bold text-slate-800">{submittedBooking.service}</span>
              </div>
              <div className="flex items-start justify-between pt-1">
                <span className="text-slate-500 shrink-0">مقر العيادة:</span>
                <span className="font-medium text-slate-700 text-left">{clinic.address}</span>
              </div>
            </div>

            {/* WhatsApp Confirmation Action with Exact User Template */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={import.meta.env.MODE === 'isolated' ? undefined : `https://wa.me/201060918977?text=${encodeURIComponent(
`السلام عليكم، أرغب في تأكيد حجز موعد بالعيادة.

اسم المريض: ${submittedBooking.patientName}
رقم التواصل: ${submittedBooking.patientPhone}
رقم الحجز: ${submittedBooking.id}
تاريخ الحجز: ${formatAppointmentDateArabic(submittedBooking.date)}
موعد الزيارة: ${formatTimeArabicFull(submittedBooking.time)}

شكرًا لحضرتكم.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{import.meta.env.MODE === 'isolated' ? 'التواصل الخارجي معطل في النسخة التجريبية' : 'مراجعة طلب الموعد مع العيادة عبر الواتساب'}</span>
              </a>

              <button
                onClick={() => setSubmittedBooking(null)}
                className="px-5 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
              >
                حجز موعد آخر
              </button>
            </div>
          </div>
        ) : (
          /* MAIN BOOKING FORM */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border/80 shadow-soft space-y-8 text-right"
          >
            
            {submitError && <p role="alert" className="p-4 rounded-xl bg-red-50 text-red-800">{submitError}</p>}
            {!availabilityReady && !submitError && <p role="status">جار التحقق من المواعيد...</p>}
            {/* STEP 1: SELECT DATE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-brand-dark flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs flex items-center justify-center font-bold">1</span>
                  <span>اختر يوم الكشف:</span>
                </h3>
                <span className="text-xs text-brand-muted">متاح لـ {advanceDaysCount} يوماً قادمة</span>
              </div>

              {/* Day selection pills carousel */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
                {upcomingDays.map((day) => {
                  const isSelected = selectedDate === day.dateStr;
                  const dayClosure = isDateClosed(day.dateStr, bookingSettings);
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(day.dateStr);
                        setSelectedTime(''); // Reset selected time when date changes
                      }}
                      className={`shrink-0 px-4 py-2.5 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'bg-purple-700 border-purple-700 text-white shadow-md scale-[1.02]'
                          : dayClosure.isClosed
                          ? 'bg-rose-50/70 border-rose-200 text-slate-600 hover:bg-rose-100/60'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-200'
                      }`}
                    >
                      <span className="block text-xs font-bold leading-tight">{day.dayNameAr}</span>
                      <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                        {day.dateFormattedAr}
                      </span>
                      {dayClosure.isClosed && (
                        <span className={`block text-[9px] font-black mt-0.5 ${isSelected ? 'text-rose-200' : 'text-rose-500'}`}>
                          إجازة / مغلق
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: SELECT TIME SLOT (1 SLOT PER HOUR - DISAPPEARS WHEN BOOKED) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="text-sm sm:text-base font-bold text-brand-dark flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs flex items-center justify-center font-bold">2</span>
                  <span>اختر التوقيت المتاح ({slotIntervalLabel}):</span>
                </h3>
                <span className="text-xs font-bold text-purple-700">
                  {selectedDateClosure.isClosed ? 'مغلق' : `${availableSlots.length} مواعيد شاغرة متاحة`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                • فاصل المواعيد: {slotIntervalLabel} لمنع التكدس • يشترط الحجز قبل الموعد بـ 3 ساعات على الأقل • الإتاحة النهائية تُراجع عند حفظ الطلب
              </p>

              {selectedDateClosure.isClosed ? (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold text-center flex flex-col items-center gap-2">
                  <CalendarOff className="w-6 h-6 text-rose-600 animate-pulse" />
                  <span>{selectedDateClosure.reason || 'نعتذر، العيادة مغلقة في هذا اليوم ولا يتم استقبال حجوزات جديدة.'}</span>
                  <span className="text-[11px] font-normal text-rose-600">يرجى اختيار يوم آخر متاح من الأيام الموضحة بالأعلى.</span>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-2.5">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md scale-105'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300'
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        <span>{slot.labelAr}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs sm:text-sm font-bold text-amber-900">
                    عذراً، اكتملت جميع المواعيد المتاحة لهذا اليوم ({selectedDate})
                  </p>
                  <p className="text-xs text-amber-700">
                    يرجى اختيار يوم آخر من الأيام بالأعلى، أو الاتصال بالعيادة مباشرة للحالات الطارئة.
                  </p>
                </div>
              )}

              {selectedTime && (
                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>الموعد المختار: {formatTimeArabic(selectedTime)} بتوقيت القاهرة</span>
                </p>
              )}
            </div>

            {/* STEP 3: PATIENT INFORMATION */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-brand-dark flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs flex items-center justify-center font-bold">3</span>
                <span>بيانات المريض للتأكيد:</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم المريض ثلاثي / رباعي *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="مثال: أحمد محمد علي"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-brand-dark placeholder-slate-400 focus:outline-hidden focus:border-purple-600 focus:bg-white transition-colors"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                {/* Patient Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    رقم هاتف المريض أو المرافق (للتأكيد) *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="010xxxxxxxx"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-brand-dark placeholder-slate-400 focus:outline-hidden focus:border-purple-600 focus:bg-white transition-colors text-right"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                </div>


              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-brand-muted">
                * تُراجع إتاحة الموعد عند الحفظ. الطلب ينتظر تأكيد العيادة.
              </div>

              <button
                type="submit"
                disabled={!selectedTime || isSubmitting || !availabilityReady}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 via-indigo-600 to-brand-royal text-white font-bold text-xs sm:text-sm px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Calendar className="w-4 h-4 text-brand-lime" />
                <span>
                  {isSubmitting ? 'جار حفظ الطلب...' : selectedTime
                    ? `إرسال طلب الحجز (${formatTimeArabic(selectedTime)})`
                    : 'اختر التوقيت أولاً لتأكيد الحجز'}
                </span>
              </button>
            </div>

          </form>
        )}

      </div>
    </section>
  );
};
