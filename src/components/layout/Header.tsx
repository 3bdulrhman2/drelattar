import React, { useState, useEffect } from 'react';
import { Phone, Clock, MapPin, Menu, X, ArrowLeft, ShieldCheck, Stethoscope, Languages } from 'lucide-react';
import { useSiteContent, useLang } from '../../i18n';

interface HeaderProps {
  onNavigateAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateAdmin }) => {
  const { data } = useSiteContent();
  const { t, isEn, toggleLang } = useLang();
  const { clinic, doctor } = data;
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('الرئيسية'), href: '#hero' },
    { name: t('عن الدكتور'), href: '#about' },
    { name: t('الخدمات الطبية'), href: '#services' },
    { name: t('التجهيزات الطبية'), href: '#equipment' },
    { name: t('آراء المرضى'), href: '#reviews' },
    { name: t('الأسئلة الشائعة'), href: '#faq' },
    { name: t('موقع العيادة'), href: '#location' },
    { name: t('اتصل بنا'), href: '#contact' },
  ];

  return (
    <>
      {/* Top authoritative announcement bar */}
      <div className="bg-brand-royal-dark text-white/90 text-xs py-2 px-4 border-b border-white/10 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-white/90">
              <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{clinic.landmark} – {clinic.city}{isEn ? ',' : '،'} {clinic.governorate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <Clock className="w-3.5 h-3.5 text-brand-lime" />
              <span>
                {isEn
                  ? `${t('مواعيد العمل:', 'Working hours:')} Sat–Thu 1:00 PM – 9:00 PM | Fri 4:00 PM – 10:00 PM`
                  : `${t('مواعيد العمل:')} ${clinic.hoursRegular} | ${t('الجمعة: 4:00 م - 10:00 م')}`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-brand-cyan-light/80 hidden xl:inline">{t('فرع واحد مجهز لاستقبالكم')}</span>
            <a
              href={`tel:${clinic.phoneClinic}`}
              className="font-semibold text-brand-cyan hover:underline flex items-center gap-1"
              dir="ltr"
            >
              <Phone className="w-3 h-3" />
              {clinic.phoneClinic}
            </a>
            <button
              type="button"
              onClick={toggleLang}
              aria-label={t('تغيير اللغة')}
              title={t('تغيير اللغة')}
              className="flex items-center gap-1 rounded-full border border-white/30 px-2.5 py-1 font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors"
              dir="ltr"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{isEn ? 'AR' : 'EN'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main sticky navigation */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-elevated border-b border-brand-border/60 py-2.5'
            : 'bg-white shadow-soft border-b border-brand-border/40 py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Clinic Logo & Doctor Identity */}
            <a href="#hero" className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0">
              <div className="relative w-11 h-11 sm:w-14 sm:h-14 shrink-0 transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/brand/clinic-logo.png"
                  alt={clinic.name}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-sm sm:text-lg font-bold text-brand-royal tracking-tight group-hover:text-brand-medical transition-colors whitespace-nowrap">
                  {doctor.nameAr}
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-brand-muted whitespace-nowrap">
                  {isEn ? 'Internal Medicine & Intensive Care Specialist' : doctor.title}
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-2.5 py-1.5 text-[13px] font-medium text-brand-dark hover:text-brand-royal hover:bg-brand-cyan-light/50 rounded-lg transition-all whitespace-nowrap"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Mobile Menu Button Only (Call button removed to prevent name wrapping) */}
            <div className="flex items-center gap-1 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={t('القائمة الرئيسية')}
                className="p-2 text-brand-dark hover:bg-slate-100 rounded-xl transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-brand-border bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top duration-200">
            <div className="flex flex-col gap-1 mb-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-brand-bg rounded-lg flex items-center justify-between"
                >
                  <span>{link.name}</span>
                  <ArrowLeft className="w-4 h-4 text-brand-muted opacity-60" />
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-brand-border/60 flex flex-col gap-2.5">
              <a
                href={`tel:${clinic.phoneClinic}`}
                className="w-full flex items-center justify-center gap-2 bg-brand-royal text-white py-3 rounded-xl font-semibold text-sm shadow-md"
              >
                <Phone className="w-4 h-4 text-brand-lime" />
                <span>{t('اتصال بالعيادة')} ({clinic.phoneClinic})</span>
              </a>

              <a
                href={`tel:${clinic.phoneDoctor}`}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-brand-dark py-2.5 rounded-xl font-medium text-sm border border-slate-200 hover:bg-slate-200"
              >
                <Stethoscope className="w-4 h-4 text-brand-medical" />
                <span>{t('هاتف الدكتور')} ({clinic.phoneDoctor})</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  toggleLang();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 bg-brand-bg text-brand-royal py-2.5 px-4 rounded-xl font-semibold text-sm border border-brand-border hover:bg-brand-cyan-light/40"
                dir="ltr"
              >
                <span className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-brand-medical" />
                  <span>{isEn ? 'العربية' : 'English'}</span>
                </span>
                <span className="text-[11px] font-medium text-brand-muted" dir="ltr">
                  {isEn ? 'Arabic' : 'Change language'}
                </span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
