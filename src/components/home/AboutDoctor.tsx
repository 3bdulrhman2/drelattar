import React from 'react';
import { GraduationCap, Award, Building2, Stethoscope, CheckCircle, Shield, Sparkles, BookOpen } from 'lucide-react';
import { useSiteContent, useLang } from '../../i18n';

// Blurred clinic-corridor backdrop (inlined so the About photo needs no separate asset)
const ABOUT_BG = 'data:image/jpeg;base64,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';

export const AboutDoctor: React.FC = () => {
  const { data } = useSiteContent();
  const { t, isEn } = useLang();
  const { doctor } = data;

  return (
    <section id="about" className="py-16 lg:py-24 bg-white relative overflow-hidden w-full max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-cyan-light text-brand-royal text-xs font-semibold">
            <Stethoscope className="w-3.5 h-3.5 text-brand-medical" />
            <span>{t('السيرة المهنية والخبرات الأكاديمية')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark">
            {t('عن الدكتور محمد السيد العطار')}
          </h2>
          <p className="text-base text-brand-muted">
            {t('التزام راسخ بالمعايير الطبية المعتمدة وخبرة إكلينيكية متخصصة في الحالات الحرجة وأمراض الباطنة')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Doctor Portrait on Neutral Background */}
          <div className="lg:col-span-5 order-2 lg:order-1 flex justify-center pb-16 sm:pb-20 w-full max-w-full">
            <div className="relative w-full max-w-[340px] sm:max-w-[360px] mx-auto">
              
              {/* Backplate decoration */}
              <div className="absolute -inset-1.5 sm:-inset-4 bg-gradient-to-br from-brand-royal/10 via-brand-cyan/10 to-brand-lime/10 rounded-3xl -rotate-1 sm:-rotate-2 pointer-events-none" />
              
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-slate-100">
                <div className="relative aspect-[3/4] overflow-hidden bg-brand-bg">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${ABOUT_BG})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-brand-royal/25 pointer-events-none" />
                  <img
                    src="/brand/doctor-cutout.png"
                    alt={isEn ? doctor.nameEn : doctor.nameAr}
                    className="absolute inset-x-0 bottom-0 mx-auto h-[96%] w-auto max-w-none object-contain object-bottom drop-shadow-[0_10px_25px_rgba(15,23,42,0.22)]"
                    loading="lazy"
                  />
                </div>
                
                {/* Official seal banner */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/50 to-transparent p-4 sm:p-5 text-white text-right z-10">
                  <p className="font-bold text-base">{doctor.nameAr}</p>
                  <p className="text-xs text-brand-cyan-light">{doctor.nameEn}</p>
                </div>
              </div>

              {/* Education floating badge (Moved down ~0.7cm so text behind it is completely visible) */}
              <div className="absolute -bottom-14 right-0 sm:-right-4 z-20 bg-white p-3 sm:p-3.5 rounded-2xl shadow-elevated border border-brand-border flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center text-brand-royal shrink-0">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-right">
                  <span className="block text-[10px] sm:text-[11px] text-brand-muted">{t('المؤهل الأكاديمي')}</span>
                  <span className="block text-xs sm:text-xs font-bold text-brand-dark">{t('طب الأزهر بالقاهرة')}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Detailed Biography and Credentials */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6 text-right">
            
            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-brand-royal">
                {doctor.title}
              </h3>
              <p className="text-base text-brand-muted leading-relaxed">
                {doctor.bio}
              </p>
            </div>

            {/* Academic Qualifications & Affiliations List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-lime-dark" />
                <span>{t('المؤهلات والمناصب الطبية الرسمية:')}</span>
              </h4>

              <div className="space-y-2.5">
                {doctor.credentials.map((cred, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-brand-bg/80 border border-brand-border/60 hover:border-brand-royal/30 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-brand-royal/10 text-brand-royal flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-semibold text-brand-dark leading-snug">
                      {cred}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Specialties Tags */}
            <div className="pt-2">
              <h4 className="text-sm font-bold text-brand-dark mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-medical" />
                <span>{t('مجالات الاختصاص والاهتمام الإكلينيكي:')}</span>
              </h4>
              
              <div className="flex flex-wrap gap-2">
                {doctor.specialties.map((spec, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-brand-cyan-light/70 text-brand-royal text-xs font-semibold border border-brand-cyan/25"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
