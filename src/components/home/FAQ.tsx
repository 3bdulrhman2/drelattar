import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Phone, MapPin, Clock } from 'lucide-react';
import { useSiteContent, useLang } from '../../i18n';

export const FAQ: React.FC = () => {
  const { data } = useSiteContent();
  const { t } = useLang();
  const { faq, visibility, clinic } = data;
  const [openId, setOpenId] = useState<string | null>(faq[0]?.id || null);

  if (!visibility.showFAQSection) {
    return null;
  }

  const toggleAccordion = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-16 lg:py-24 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-cyan-light text-brand-royal text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-brand-medical" />
            <span>{t('إجابات واضحة ودقيقة')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark">
            {t('الأسئلة الشائعة والمعلومات الهامة')}
          </h2>
          <p className="text-sm sm:text-base text-brand-muted">
            {t('إجابات شاملة عن كل ما يخص مواعيد العيادة، الخدمات المتوفرة، وكيفية الوصول والتواصل')}
          </p>
        </div>

        {/* Accordion Items */}
        <div className="space-y-3">
          {faq.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-brand-bg/60 border-brand-royal/30 shadow-soft'
                    : 'bg-white border-brand-border/70 hover:border-brand-royal/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(item.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-5 text-right font-bold text-sm sm:text-base text-brand-dark transition-colors gap-4"
                >
                  <span className="leading-snug">{item.question}</span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-brand-royal text-white' : 'bg-slate-100 text-brand-muted'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-brand-muted leading-relaxed border-t border-brand-border/40 mt-1">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Help Footer Box */}
        <div className="mt-10 p-5 rounded-2xl bg-brand-bg border border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div>
            <p className="text-sm font-bold text-brand-dark">{t('هل لديك استفسار طبي أو تنظيمي آخر؟')}</p>
            <p className="text-xs text-brand-muted mt-0.5">{t('يسعدنا استقبال اتصالاتكم والإجابة على كافة الأسئلة مباشرة.')}</p>
          </div>
          <a
            href={`tel:${clinic.phoneClinic}`}
            className="inline-flex items-center gap-2 bg-brand-royal text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-brand-medical transition-colors"
          >
            <Phone className="w-4 h-4 text-brand-lime" />
            <span>{t('اتصل الآن')} ({clinic.phoneClinic})</span>
          </a>
        </div>

      </div>
    </section>
  );
};
