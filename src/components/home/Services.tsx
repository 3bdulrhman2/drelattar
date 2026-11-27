import React, { useState } from 'react';
import {
  HeartPulse,
  Activity,
  Zap,
  ShieldAlert,
  UserCheck,
  Brain,
  Stethoscope,
  FileSpreadsheet,
  Droplet,
  ShieldPlus,
  Users,
  Wind,
  Sparkles,
  Phone,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { useSiteContent, useLang } from '../../i18n';
import { MedicalService } from '../../types';

// Map icon string name to Lucide Icon component
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  HeartPulse,
  Activity,
  Zap,
  ShieldAlert,
  UserCheck,
  Brain,
  Stethoscope,
  FileSpreadsheet,
  Droplet,
  ShieldPlus,
  Users,
  Wind,
  Sparkles,
};

export const Services: React.FC = () => {
  const { data } = useSiteContent();
  const { t } = useLang();
  const { services, clinic } = data;
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: t('جميع الخدمات (13)') },
    { id: 'critical', label: t('العناية المركزة والحرجة') },
    { id: 'chronic', label: t('الأمراض المزمنة') },
    { id: 'sessions', label: t('جلسات التنفس والأكسجين') },
    { id: 'general', label: t('الباطنة العامة') },
  ];

  const filteredServices = activeCategory === 'all'
    ? services
    : services.filter((srv) => srv.category === activeCategory);

  return (
    <section id="services" className="py-16 lg:py-24 bg-brand-bg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-royal/10 text-brand-royal text-xs font-semibold">
            <HeartPulse className="w-3.5 h-3.5 text-brand-medical" />
            <span>{t('الخدمات الطبية المتكاملة')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark">
            {t('الخدمات الطبية بعيادة الدكتور محمد السيد العطار')}
          </h2>
          <p className="text-sm sm:text-base text-brand-muted">
            {t('رعاية تشخيصية وعلاجية مبنية على أحدث البروتوكولات الإكلينيكية لمختلف أمراض الباطنة والحالات الحرجة')}
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-brand-royal text-white shadow-soft scale-105'
                  : 'bg-white text-brand-muted hover:text-brand-dark hover:bg-slate-50 border border-brand-border/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid (13 exact cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => {
            const IconComponent = iconMap[service.icon] || Stethoscope;
            return (
              <div
                key={service.id || index}
                className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-hover border border-brand-border/60 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-cyan-light flex items-center justify-center text-brand-royal group-hover:bg-brand-royal group-hover:text-white transition-colors duration-300">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-brand-muted">
                      #{index + 1}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-brand-dark group-hover:text-brand-royal transition-colors mb-2.5 leading-snug">
                    {service.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-brand-medical font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('متابعة إكلينيكية دقيقة')}
                  </span>
                  <a
                    href={`tel:${clinic.phoneClinic}`}
                    className="text-brand-royal font-semibold hover:text-brand-medical transition-colors flex items-center gap-1"
                  >
                    <span>{t('استفسار')}</span>
                    <Phone className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Assurance Note */}
        <div className="mt-12 bg-white rounded-2xl p-6 border border-brand-border/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-bold text-brand-dark">
              {t('هل تحتاج إلى استشارة عاجلة أو متابعة خاصة لحالة حرجة؟')}
            </h4>
            <p className="text-xs sm:text-sm text-brand-muted">
              {t('يمكنك التنسيق المباشر مع طاقم العيادة لترتيب حضور المريض أو تقييم الفحوصات والتحاليل الطبية.')}
            </p>
          </div>
          <a
            href={`tel:${clinic.phoneClinic}`}
            className="shrink-0 bg-brand-royal text-white px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm hover:bg-brand-medical transition-colors flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-brand-lime" />
            <span>{t('اتصل للاستفسار')} ({clinic.phoneClinic})</span>
          </a>
        </div>

      </div>
    </section>
  );
};
