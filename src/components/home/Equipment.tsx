import React from 'react';
import { Gauge, Activity, Scan, Heart, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { useSiteContent, useLang } from '../../i18n';

const equipmentIconMap: Record<string, React.FC<{ className?: string }>> = {
  Gauge,
  Activity,
  Scan,
  Heart,
};

export const Equipment: React.FC = () => {
  const { data } = useSiteContent();
  const { t } = useLang();
  const { equipment, visibility } = data;

  if (!visibility.showEquipmentSection) {
    return null;
  }

  return (
    <section id="equipment" className="py-16 lg:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-lime-light text-brand-dark text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-lime-dark" />
            <span>{t('التجهيزات والتقنيات الطبية')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark">
            {t('أجهزة تشخيصية متطورة لرعاية دقيقة')}
          </h2>
          <p className="text-sm sm:text-base text-brand-muted">
            {t('حرصاً على سلامة المرضى، تم تجهيز عيادة الدكتور محمد السيد العطار بأحدث الأجهزة التشخيصية المعتمدة')}
          </p>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {equipment.map((item, index) => {
            const IconComp = equipmentIconMap[item.icon] || Activity;
            return (
              <div
                key={item.id || index}
                className="bg-brand-bg/50 rounded-2xl p-6 border border-brand-border/70 hover:border-brand-royal/40 hover:bg-white hover:shadow-elevated transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-soft border border-slate-100 flex items-center justify-center text-brand-royal group-hover:scale-110 group-hover:text-brand-medical transition-all mb-5">
                    <IconComp className="w-7 h-7" />
                  </div>

                  <h3 className="text-base font-bold text-brand-dark mb-2 leading-snug group-hover:text-brand-royal transition-colors">
                    {item.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-brand-border/50">
                  <div className="flex items-start gap-1.5 text-xs font-medium text-brand-medical">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-brand-medical" />
                    <span>{item.importance}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note on clinic cleanliness and safety */}
        <div className="mt-10 p-5 rounded-2xl bg-brand-cyan-light/50 border border-brand-cyan/25 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 text-brand-royal flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-brand-medical" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-brand-dark">
                {t('أعلى معايير التعقيم ومكافحة العدوى')}
              </p>
              <p className="text-xs text-brand-muted">
                {t('تخضع جميع الأجهزة والأدوات لبروتوكولات تعقيم وتطهير دورية وصارمة لضمان بيئة علاجية آمنة.')}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-brand-royal px-3 py-1.5 rounded-lg bg-white shadow-sm border border-brand-border">
            {t('سلامتكم أولويتنا')}
          </span>
        </div>

      </div>
    </section>
  );
};
