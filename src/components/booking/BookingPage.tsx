import React, { useEffect } from 'react';
import {
  ArrowRight,
  Phone,
  Calendar,
  ShieldCheck,
  MapPin,
  Clock,
  Stethoscope,
  MessageCircle,
  AlertCircle,
  Home,
} from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { PublicBookingModule } from '../home/PublicBookingModule';
import { Footer } from '../layout/Footer';
import { QuickCallFloating } from '../home/QuickCallFloating';

interface BookingPageProps {
  onBackToSite: () => void;
  onNavigateAdmin?: () => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  onBackToSite,
  onNavigateAdmin,
}) => {
  const { data } = useContent();
  const { doctor, clinic, bookingSettings } = data;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = `حجز موعد | ${doctor.nameAr}`;
    return () => {
      document.title = `${doctor.nameAr} - ${doctor.title}`;
    };
  }, [doctor]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-dark selection:bg-purple-100 selection:text-purple-900" dir="rtl">
      
      {/* Top Header Bar for Booking Page */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-border/60 shadow-soft py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Back to Home Button */}
          <button
            onClick={onBackToSite}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all group"
          >
            <ArrowRight className="w-4 h-4 text-brand-royal group-hover:-translate-x-0.5 transition-transform" />
            <span>الرجوع للرئيسية</span>
          </button>

          {/* Doctor Identity in Header */}
          <div className="flex items-center gap-2.5 sm:gap-3 text-right">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-brand-royal/10 shrink-0 border border-brand-border">
              <img
                src={doctor.avatarMedical}
                alt={doctor.nameAr}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <h1 className="text-xs sm:text-base font-bold text-brand-royal leading-tight">
                {doctor.nameAr}
              </h1>
              <p className="text-[10px] sm:text-xs text-brand-muted hidden sm:block">
                صفحة حجز المواعيد الرسمية المعتمدة
              </p>
            </div>
          </div>

          {/* Direct Phone Shortcut */}
          <a
            href={`tel:${clinic.phoneClinic}`}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-royal/10 hover:bg-brand-royal/20 text-brand-royal text-xs font-bold transition-all"
          >
            <Phone className="w-3.5 h-3.5 text-brand-lime" />
            <span dir="ltr">{clinic.phoneClinic}</span>
          </a>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Breadcrumb / Notice */}
          <div className="flex items-center justify-between text-xs text-brand-muted">
            <div className="flex items-center gap-1.5">
              <button onClick={onBackToSite} className="hover:text-brand-royal flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span>الرئيسية</span>
              </button>
              <span>/</span>
              <span className="font-semibold text-purple-700">حجز موعد كشف</span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium text-[11px]">طلب حجز يخضع لتأكيد العيادة</span>
            </div>
          </div>

          {/* IF BOOKING IS DISABLED BY ADMIN: Display Courteous Fallback Card */}
          {!bookingSettings.isEnabled ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-brand-border shadow-elevated text-center max-w-2xl mx-auto space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
                  الحجز الإلكتروني غير مفعل حالياً
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-brand-dark pt-2">
                  الكشف والمتابعة بالحضور المباشر أو التنسيق الهاتفي
                </h2>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed max-w-md mx-auto">
                  تستقبل عيادة الدكتور محمد السيد العطار المرضى الكرام يومياً خلال مواعيد العمل الرسمية، ويمكنكم التنسيق الهاتفي المسبق لضمان راحتكم.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={`tel:${clinic.phoneClinic}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand-royal to-brand-medical text-white font-bold px-7 py-3 rounded-xl shadow-md hover:scale-[1.02] transition-all text-sm"
                >
                  <Phone className="w-4 h-4 text-brand-lime" />
                  <span>اتصل بالعيادة: {clinic.phoneClinic}</span>
                </a>

                <a
                  href={`https://wa.me/201060918977?text=${encodeURIComponent(
                    'السلام عليكم يا دكتور، أود الاستفسار عن حجز موعد كشف في العيادة.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-md text-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تواصل عبر الواتساب</span>
                </a>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={onBackToSite}
                  className="text-xs text-brand-royal font-bold hover:underline inline-flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>العودة لصفحة العيادة الرئيسية</span>
                </button>
              </div>
            </div>
          ) : (
            /* IF BOOKING IS ENABLED: Render the Full Public Booking Module */
            <div className="space-y-8 animate-fadeIn">
              <PublicBookingModule />
            </div>
          )}

          {/* Clinic Information Summary Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-brand-border/80 shadow-xs flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-brand-dark">التخصص الطبي</h4>
                <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                  {doctor.title}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-brand-border/80 shadow-xs flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-cyan-light text-brand-royal flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-brand-dark">مقر العيادة</h4>
                <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                  {clinic.landmark} – {clinic.city}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-brand-border/80 shadow-xs flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-lime-light text-brand-royal flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-brand-dark">مواعيد العمل</h4>
                <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                  السبت إلى الخميس: 1:00 م - 9:00 م | الجمعة: 4:00 م - 10:00 م
                </p>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Standard Footer */}
      <Footer onNavigateAdmin={onNavigateAdmin} />

      {/* Floating Call Button on Mobile */}
      <QuickCallFloating />

    </div>
  );
};

export default BookingPage;
