import React from 'react';
import { Phone, ArrowDown, Award, ShieldCheck, HeartPulse, Sparkles, Stethoscope, ChevronLeft, Calendar } from 'lucide-react';
import { useSiteContent, useLang } from '../../i18n';

interface HeroProps {
  onNavigateBooking?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigateBooking }) => {
  const { data } = useSiteContent();
  const { t, isEn } = useLang();
  const { doctor, clinic, bookingSettings } = data;

  return (
    <section id="hero" className="relative overflow-hidden w-full max-w-full pt-8 pb-16 lg:py-20 bg-gradient-to-b from-white via-brand-bg to-brand-bg">
      {/* Subtle medical background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#123E91_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Decorative gradient glow spots */}
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none translate-x-1/4" />
      <div className="absolute bottom-10 left-0 w-72 h-72 bg-brand-royal/5 rounded-full blur-3xl pointer-events-none -translate-x-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Text and Actions Column */}
          <div className="lg:col-span-7 space-y-6 text-right">
            
            {/* Top Verified Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-cyan-light/80 border border-brand-cyan/30 text-brand-royal text-xs sm:text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
              <ShieldCheck className="w-4 h-4 text-brand-medical" />
              <span>{t('عيادة معتمدة – فرع كوبري واحد الصالحية، الحسينية')}</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-brand-dark tracking-tight text-balance pb-2 ${isEn ? '' : 'leading-[1.5] md:leading-[1.5]'}`}>
                {t('رعايتك الصحية')} <span className="inline-block bg-gradient-to-l from-brand-royal via-brand-medical to-brand-cyan bg-clip-text text-transparent pt-1 pb-2">{t('تبدأ من هنا')}</span>
              </h1>
              
              <div className="inline-block py-1">
                <span className="text-xl sm:text-2xl font-bold text-brand-royal block">
                  {doctor.nameAr}
                </span>
                <span className="text-sm sm:text-base font-semibold text-brand-medical">
                  {doctor.title}
                </span>
              </div>
            </div>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-brand-muted leading-relaxed max-w-2xl font-normal">
              {t('رعاية طبية متخصصة في أمراض الباطنة العامة والعناية المركزة والحالات الحرجة، بخبرة واهتمام بصحتك.')}
            </p>

            {/* Primary & Secondary Call to Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href={`tel:${clinic.phoneClinic}`}
                className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-brand-royal via-brand-royal-light to-brand-medical text-white text-base font-bold px-7 py-3.5 rounded-xl shadow-elevated hover:shadow-hover hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Phone className="w-4 h-4 text-brand-lime" />
                </div>
                <span>{t('اتصل الآن')}</span>
              </a>

              {/* احجز موعدك (Navigates to dedicated /booking page - controlled by bookingSettings.isEnabled) */}
              {bookingSettings.isEnabled && (
                <a
                  href="/booking"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigateBooking) {
                      onNavigateBooking();
                    } else {
                      window.history.pushState(null, '', '/booking');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-700 via-indigo-600 to-brand-royal text-white text-base font-bold px-7 py-3.5 rounded-xl shadow-elevated hover:shadow-hover hover:scale-[1.02] active:scale-[0.98] transition-all group animate-fadeIn cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <Calendar className="w-4 h-4 text-brand-lime" />
                  </div>
                  <span>{t('احجز موعدك')}</span>
                </a>
              )}

              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 bg-white text-brand-royal text-base font-semibold px-6 py-3.5 rounded-xl border-2 border-brand-royal/15 hover:border-brand-royal/40 hover:bg-slate-50 transition-all"
              >
                <span>{t('تعرف على الخدمات')}</span>
                <ChevronLeft className="w-4 h-4 text-brand-medical" />
              </a>
            </div>

            {/* Quick Consultation Note */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs sm:text-sm text-brand-muted border-t border-brand-border/70 pt-4">
              <div className="flex items-center gap-1.5 font-medium text-brand-dark whitespace-nowrap">
                <Stethoscope className="w-4 h-4 text-brand-medical" />
                <span>{t('الكشف والمتابعة:')}</span>
              </div>
              <p>{t('الحضور المباشر بالعيادة أو الترتيب المسبق هاتفياً دون انتظار.')}</p>
            </div>
          </div>

          {/* Doctor Portrait Visual Column */}
          <div className="lg:col-span-5 flex justify-center relative pb-6 sm:pb-8 w-full max-w-full">
            <div className="relative w-full max-w-[340px] sm:max-w-[420px] mx-auto">
              
              {/* Decorative Frame Glow */}
              <div className="absolute -inset-1 sm:-inset-3 bg-gradient-to-tr from-brand-royal/20 via-brand-cyan/20 to-brand-lime/20 rounded-[2.5rem] blur-xl opacity-70 transform -rotate-1 pointer-events-none" />

              {/* Doctor Real Image Card */}
              <div className="relative rounded-[2rem] overflow-hidden bg-white shadow-2xl border-4 border-white">
                <img
                  src={doctor.avatarMedical}
                  alt={`${doctor.nameAr} - ${doctor.title}`}
                  className="w-full h-auto object-cover object-top aspect-[4/5] hover:scale-105 transition-transform duration-700 ease-out"
                  loading="eager"
                />

                {/* Subtle gradient vignette at bottom of image */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-darker/70 via-transparent to-transparent pointer-events-none" />

                {/* Overlaid Doctor Title Pill inside portrait */}
                <div className="absolute bottom-4 right-4 left-4 text-white text-right pointer-events-none z-10">
                  <div className="bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-xl border border-white/40 shadow-lg text-brand-dark">
                    <p className="font-bold text-sm sm:text-base text-brand-royal leading-tight">
                      {doctor.nameAr}
                    </p>
                    <p className="text-[11px] sm:text-xs text-brand-muted mt-0.5 font-medium line-clamp-1">
                      {doctor.education}
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Experience Badge (خبرة 8 سنوات) */}
              <div className="absolute -top-3 right-0 sm:-right-4 z-20 bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-elevated border border-brand-border flex items-center gap-2.5 sm:gap-3 animate-bounce [animation-duration:4s]">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-lime-light flex items-center justify-center text-brand-royal shrink-0">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-brand-royal" />
                </div>
                <div className="text-right">
                  <span className="block text-[11px] sm:text-xs font-medium text-brand-muted">{t('المسيرة المهنية')}</span>
                  <span className="block text-xs sm:text-sm font-bold text-brand-dark">{t('خبرة 8 سنوات')}</span>
                </div>
              </div>

              {/* Floating Specialty Badge (Moved down ~0.5cm so text underneath is fully visible) */}
              <div className="absolute -bottom-8 left-0 sm:-left-3 z-20 bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-elevated border border-brand-border flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-cyan-light flex items-center justify-center text-brand-medical shrink-0">
                  <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-right">
                  <span className="block text-[10px] sm:text-[11px] font-medium text-brand-muted">{t('التخصص الدقيق')}</span>
                  <span className="block text-[11px] sm:text-xs font-bold text-brand-royal">{t('باطنة & عناية مركزة')}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
