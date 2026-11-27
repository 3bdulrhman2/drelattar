import React from 'react';
import { GraduationCap, Award, Building2, Stethoscope, CheckCircle, Shield, Sparkles, BookOpen } from 'lucide-react';
import { useSiteContent, useLang } from '../../i18n';

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
                <div className="relative aspect-[3/4] bg-gradient-to-b from-brand-cyan-light via-brand-bg to-brand-lime/30">
                  <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-brand-cyan/25 blur-2xl pointer-events-none" />
                  <div className="absolute bottom-16 -left-12 w-44 h-44 rounded-full bg-brand-lime/30 blur-2xl pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-royal/10 to-transparent pointer-events-none" />
                  <img
                    src="/brand/doctor-cutout.png"
                    alt={isEn ? doctor.nameEn : doctor.nameAr}
                    className="absolute inset-x-0 bottom-0 mx-auto h-[96%] w-auto max-w-none object-contain object-bottom drop-shadow-[0_10px_25px_rgba(15,23,42,0.18)]"
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
