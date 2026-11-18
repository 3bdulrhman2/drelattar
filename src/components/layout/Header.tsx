import React, { useState, useEffect } from 'react';
import { Phone, Clock, MapPin, Menu, X, ArrowLeft, ShieldCheck, Stethoscope } from 'lucide-react';
import { useContent } from '../../context/ContentContext';

interface HeaderProps {
  onNavigateAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateAdmin }) => {
  const { data } = useContent();
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
    { name: 'الرئيسية', href: '#hero' },
    { name: 'عن الدكتور', href: '#about' },
    { name: 'الخدمات الطبية', href: '#services' },
    { name: 'التجهيزات الطبية', href: '#equipment' },
    { name: 'آراء المرضى', href: '#reviews' },
    { name: 'الأسئلة الشائعة', href: '#faq' },
    { name: 'موقع العيادة', href: '#location' },
    { name: 'اتصل بنا', href: '#contact' },
  ];

  return (
    <>
      {/* Top authoritative announcement bar */}
      <div className="bg-brand-royal-dark text-white/90 text-xs py-2 px-4 border-b border-white/10 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-white/90">
              <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{clinic.landmark} – {clinic.city}، {clinic.governorate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <Clock className="w-3.5 h-3.5 text-brand-lime" />
              <span>مواعيد العمل: {clinic.hoursRegular} | الجمعة: 4:00 م - 10:00 م</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-brand-cyan-light/80">فرع واحد مجهز لاستقبالكم</span>
            <a
              href={`tel:${clinic.phoneClinic}`}
              className="font-semibold text-brand-cyan hover:underline flex items-center gap-1"
              dir="ltr"
            >
              <Phone className="w-3 h-3" />
              {clinic.phoneClinic}
            </a>
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
            <a href="#hero" className="flex items-center gap-3.5 group">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/brand/clinic-logo.png"
                  alt={clinic.name}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-base sm:text-lg font-bold text-brand-royal tracking-tight group-hover:text-brand-medical transition-colors">
                  {doctor.nameAr}
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-brand-muted line-clamp-1 max-w-[240px] sm:max-w-none">
                  {doctor.title}
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-3 py-1.5 text-sm font-medium text-brand-dark hover:text-brand-royal hover:bg-brand-cyan-light/50 rounded-lg transition-all"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* CTA Direct Calling Action Button */}
            <div className="hidden sm:flex items-center gap-3">
              <a
                href={`tel:${clinic.phoneClinic}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-royal to-brand-medical text-white text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl shadow-soft hover:shadow-hover hover:brightness-105 active:scale-95 transition-all"
              >
                <Phone className="w-4 h-4 text-brand-lime" />
                <span>اتصل بالعيادة</span>
              </a>

              {onNavigateAdmin && (
                <button
                  onClick={onNavigateAdmin}
                  title="لوحة الإدارة"
                  className="p-2 text-brand-muted hover:text-brand-royal hover:bg-slate-100 rounded-lg transition-colors text-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <a
                href={`tel:${clinic.phoneClinic}`}
                aria-label="اتصال بالعيادة"
                className="p-2.5 bg-brand-cyan-light text-brand-royal rounded-xl border border-brand-cyan/30"
              >
                <Phone className="w-5 h-5 text-brand-medical" />
              </a>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="القائمة الرئيسية"
                className="p-2.5 text-brand-dark hover:bg-slate-100 rounded-xl transition-colors"
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
                <span>اتصال بالعيادة ({clinic.phoneClinic})</span>
              </a>

              <a
                href={`tel:${clinic.phoneDoctor}`}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-brand-dark py-2.5 rounded-xl font-medium text-sm border border-slate-200 hover:bg-slate-200"
              >
                <Stethoscope className="w-4 h-4 text-brand-medical" />
                <span>هاتف الدكتور ({clinic.phoneDoctor})</span>
              </a>

              {onNavigateAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateAdmin();
                  }}
                  className="w-full text-center text-xs text-brand-muted hover:text-brand-royal py-2 font-medium"
                >
                  الدخول للوحة الإدارة
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
