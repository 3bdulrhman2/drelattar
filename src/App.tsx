import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useContent } from './context/ContentContext';
import { Header } from './components/layout/Header';
import { Hero } from './components/home/Hero';
import { TrustIndicators } from './components/home/TrustIndicators';
import { AboutDoctor } from './components/home/AboutDoctor';
import { Services } from './components/home/Services';
import { Equipment } from './components/home/Equipment';
import { Reviews } from './components/home/Reviews';
import { FAQ } from './components/home/FAQ';
import { ClinicLocation } from './components/home/ClinicLocation';
import { ContactSection } from './components/home/ContactSection';
import { QuickCallFloating } from './components/home/QuickCallFloating';
import { BookingPage } from './components/booking/BookingPage';
import { Footer } from './components/layout/Footer';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DoctorCard } from './components/card/DoctorCard';
import { SecretaryLogin } from './components/secretary/SecretaryLogin';
import { SecretaryDashboard } from './components/secretary/SecretaryDashboard';
import { ClinicNoticeBanner } from './components/layout/ClinicNoticeBanner';
import { NotificationPromptModal } from './components/layout/NotificationPromptModal';
import type { SecretaryAccount } from './types';
import { Bell } from 'lucide-react';

type AppRoute = 'public' | 'admin' | 'card' | 'booking' | 'secretary';

const detectRoute = (): AppRoute => {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path.startsWith('/admin') || hash.includes('admin')) {
    return 'admin';
  }
  if (path.startsWith('/secretary') || hash.includes('secretary')) {
    return 'secretary';
  }
  if (
    path.startsWith('/card') ||
    path.startsWith('/vcard') ||
    path.startsWith('/pay') ||
    hash.includes('card') ||
    hash.includes('pay')
  ) {
    return 'card';
  }
  if (
    path.startsWith('/booking') ||
    path.startsWith('/book') ||
    hash === '#booking' ||
    hash.includes('booking')
  ) {
    return 'booking';
  }
  return 'public';
};

export const AppContent: React.FC = () => {
  const { user, logout } = useAuth();
  const { data } = useContent();

  const [route, setRoute] = useState<AppRoute>(detectRoute);

  useEffect(() => {
    if (import.meta.env.MODE !== 'isolated') return;
    const stopExternalContact = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest('a');
      const href = anchor?.getAttribute('href');
      if (!href) return;
      const target = new URL(href, window.location.href);
      if (target.origin !== window.location.origin || !['http:', 'https:'].includes(target.protocol)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    document.addEventListener('click', stopExternalContact, true);
    document.addEventListener('auxclick', stopExternalContact, true);
    return () => {
      document.removeEventListener('click', stopExternalContact, true);
      document.removeEventListener('auxclick', stopExternalContact, true);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(detectRoute());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState(null, '', '/admin');
    setRoute('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSecretary = () => {
    window.history.pushState(null, '', '/secretary');
    setRoute('secretary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPublic = () => {
    window.history.pushState(null, '', '/');
    setRoute('public');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToBooking = () => {
    window.history.pushState(null, '', '/booking');
    setRoute('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route: Digital Smart Card (Direct link: /card or /pay)
  if (route === 'card') {
    return <DoctorCard />;
  }

  // Route: Dedicated Booking Page (Direct link: /booking)
  if (route === 'booking') {
    return (
      <BookingPage
        onBackToSite={navigateToPublic}
        onNavigateAdmin={navigateToAdmin}
      />
    );
  }

  if (route === 'secretary') {
    // Keep the form mounted through Auth callbacks so a denied login keeps its error.
    if (user) {
      const admin = user.role === 'admin';
      const account: SecretaryAccount = {id:user.id, username:user.email, name:user.name,
        isActive:true, createdAt:'', permissions:{canManageBookings:true,canCloseToday:admin,
        canCloseSpecificDates:admin,canScheduleHolidays:admin,canPostAnnouncements:admin}};
      return <SecretaryDashboard account={account} onLogout={() => {void logout();}} onBackToSite={navigateToPublic}/>;
    }
    return <SecretaryLogin onBackToSite={navigateToPublic}/>;
  }
  if (route === 'admin') {
    if (user?.role === 'admin') return <AdminDashboard onBackToSite={navigateToPublic}/>;
    if (user) return <p role="alert" dir="rtl">هذا الحساب غير مخول بدخول لوحة الإدارة. استخدم بوابة السكرتارية.</p>;
    return <AdminLogin onBackToSite={navigateToPublic}/>;
  }

  // Public Clinic Website (Default)
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-dark selection:bg-brand-cyan/20 selection:text-brand-royal overflow-x-hidden w-full max-w-full relative">
      
      {/* Unified Clinic Notice / Closure / Announcement Banner */}
      <ClinicNoticeBanner />

      {/* Header Navigation */}
      <Header onNavigateAdmin={navigateToAdmin} />

      {/* Main Sections */}
      <main className="flex-1">
        {/* Hero Screen */}
        <Hero onNavigateBooking={navigateToBooking} />

        {/* Verified Trust Indicators */}
        <TrustIndicators />

        {/* About the Doctor */}
        <AboutDoctor />

        {/* 13 Exact Medical Services */}
        <Services />

        {/* 4 Diagnostic Medical Equipment (NO vacuum device) */}
        <Equipment />

        {/* Patient Reviews & Google Attribution */}
        <Reviews />

        {/* 8 Authoritative FAQ Questions */}
        <FAQ />

        {/* Clinic Location & Google Maps */}
        <ClinicLocation />

        {/* Functional Contact Actions */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer onNavigateAdmin={navigateToAdmin} />

      {/* Floating Quick Action Bar for Mobile */}
      <QuickCallFloating />

      {/* Polite Initial Visitor Notification Activation Prompt */}
      <NotificationPromptModal />

    </div>
  );
};

export default AppContent;
