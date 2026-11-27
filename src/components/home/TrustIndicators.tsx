import React from 'react';
import { Award, GraduationCap, Stethoscope, HeartPulse, CheckCircle2 } from 'lucide-react';
import { useLang } from '../../i18n';

export const TrustIndicators: React.FC = () => {
  const { t } = useLang();
  const indicators = [
    {
      title: t('8 سنوات من الخبرة'),
      subtitle: t('ممارسة إكلينيكية وعناية مركزة'),
      icon: Award,
      badgeColor: 'bg-brand-lime-light text-brand-dark',
      iconColor: 'text-brand-lime-dark',
    },
    {
      title: t('خريج كلية الطب'),
      subtitle: t('جامعة الأزهر بالقاهرة'),
      icon: GraduationCap,
      badgeColor: 'bg-brand-cyan-light text-brand-royal',
      iconColor: 'text-brand-medical',
    },
    {
      title: t('متخصص في الباطنة والعناية المركزة'),
      subtitle: t('زمالة الباطنة والحالات الحرجة'),
      icon: Stethoscope,
      badgeColor: 'bg-blue-50 text-brand-royal',
      iconColor: 'text-brand-royal',
    },
    {
      title: t('متابعة الحالات المزمنة والحرجة'),
      subtitle: t('بروتوكولات علاجية شاملة ودقيقة'),
      icon: HeartPulse,
      badgeColor: 'bg-teal-50 text-teal-900',
      iconColor: 'text-teal-600',
    },
  ];

  return (
    <section className="py-8 bg-white border-y border-brand-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {indicators.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-2xl bg-brand-bg/70 hover:bg-brand-bg transition-colors border border-brand-border/50 group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.badgeColor} group-hover:scale-105 transition-transform`}>
                  <IconComponent className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold text-brand-dark leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
