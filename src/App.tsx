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
  const { isAuthenticated } = useAuth();
  const { data } = useContent();

  const [route, setRoute] = useState<AppRoute>(detectRoute);

  // Secretary session state
  const [secretaryUser, setSecretaryUser] = useState<SecretaryAccount | null>(() => {
    try {
      const stored = sessionStorage.getItem('drelattar_secretary_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

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

  const handleSecretaryLogout = () => {
    sessionStorage.removeItem('drelattar_secretary_session');
    setSecretaryUser(null);
    navigateToPublic();
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

  // Route: Secretary Portal (Direct link: /secretary)
  if (route === 'secretary') {
    if (secretaryUser) {
      return (
        <SecretaryDashboard
          account={secretaryUser}
          onLogout={handleSecretaryLogout}
          onBackToSite={navigateToPublic}
        />
      );
    }
    return (
      <SecretaryLogin
        onBackToSite={navigateToPublic}
        onLoginSuccess={(acc) => setSecretaryUser(acc)}
      />
    );
  }

  // Route: Admin Console (Direct link: /admin)
  if (route === 'admin') {
    if (isAuthenticated) {
      return <AdminDashboard onBackToSite={navigateToPublic} />;
    }
    return <AdminLogin onBackToSite={navigateToPublic} />;
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
