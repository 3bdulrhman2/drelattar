import React, { useState } from 'react';
import {
  LayoutDashboard,
  User,
  Building,
  HeartPulse,
  Sparkles,
  Clock,
  Share2,
  Star,
  Calendar,
  Sliders,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useContent } from '../../context/ContentContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { OverviewTab } from './tabs/OverviewTab';
import { DoctorInfoTab } from './tabs/DoctorInfoTab';
import { ClinicInfoTab } from './tabs/ClinicInfoTab';
import { ServicesTab } from './tabs/ServicesTab';
import { EquipmentTab } from './tabs/EquipmentTab';
import { HoursTab } from './tabs/HoursTab';
import { SocialMediaTab } from './tabs/SocialMediaTab';
import { GoogleReviewsTab } from './tabs/GoogleReviewsTab';
import { FutureBookingTab } from './tabs/FutureBookingTab';
import { SiteVisibilityTab } from './tabs/SiteVisibilityTab';
import { HolidaysManagementTab } from './tabs/HolidaysManagementTab';
import { SecretaryAccountsTab } from './tabs/SecretaryAccountsTab';
import { CalendarOff, Users } from 'lucide-react';

interface AdminDashboardProps {
  onBackToSite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToSite }) => {
  const { user, logout } = useAuth();
  const { isBackendSynced, isSaving, saveToSupabase } = useContent();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: '1. نظرة عامة', icon: LayoutDashboard },
    { id: 'doctor', label: '2. بيانات الطبيب', icon: User },
    { id: 'clinic', label: '3. معلومات العيادة', icon: Building },
    { id: 'services', label: '4. الخدمات الطبية (13)', icon: HeartPulse },
    { id: 'equipment', label: '5. التجهيزات والأجهزة', icon: Sparkles },
    { id: 'hours', label: '6. مواعيد العمل', icon: Clock },
    { id: 'social', label: '7. التواصل الاجتماعي', icon: Share2 },
    { id: 'reviews', label: '8. آراء وسائل التواصل والتقييمات', icon: Star },
    { id: 'booking', label: '9. نظام الحجز المستقبلي', icon: Calendar },
    { id: 'holidays', label: '10. الإجازات وتنظيم المواعيد', icon: CalendarOff },
    { id: 'secretaries', label: '11. مشرفي الحجوزات (السكرتارية)', icon: Users },
    { id: 'visibility', label: '12. الرؤية والإعدادات', icon: Sliders },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab onSelectTab={setActiveTab} />;
      case 'doctor':
        return <DoctorInfoTab />;
      case 'clinic':
        return <ClinicInfoTab />;
      case 'services':
        return <ServicesTab />;
      case 'equipment':
        return <EquipmentTab />;
      case 'hours':
        return <HoursTab />;
      case 'social':
        return <SocialMediaTab />;
      case 'reviews':
        return <GoogleReviewsTab />;
      case 'booking':
        return <FutureBookingTab />;
      case 'holidays':
        return <HolidaysManagementTab />;
      case 'secretaries':
        return <SecretaryAccountsTab />;
      case 'visibility':
        return <SiteVisibilityTab />;
      default:
        return <OverviewTab onSelectTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col" dir="rtl">
      
      {/* Top Admin Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-royal/40 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
                لوحة تحكم عيادة د. محمد السيد العطار
              </h1>
              <span className="text-[11px] text-slate-400">نظام الإدارة الآمن (Admin Console)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Backend sync indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-slate-800 border border-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                !isSupabaseConfigured
                  ? 'bg-amber-400'
                  : isSaving
                  ? 'bg-amber-400 animate-ping'
                  : isBackendSynced
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-300">
              {!isSupabaseConfigured
                ? 'تخزين محلي'
                : isSaving
                ? 'جاري المزامنة...'
                : isBackendSynced
                ? 'سحابي متصل ومتزامن'
                : 'بحاجة للمزامنة السحابية'}
            </span>
            {isSupabaseConfigured && (
              <button
                onClick={() => saveToSupabase()}
                disabled={isSaving}
                className="mr-1 text-[11px] text-brand-cyan hover:underline disabled:opacity-50 font-bold"
                title="مزامنة التعديلات السحابية فوراً"
              >
                {isSaving ? '...' : 'مزامنة الآن'}
              </button>
            )}
          </div>

          <button
            onClick={onBackToSite}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <span>معاينة الموقع</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={logout}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar Tabs */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } md:block w-full md:w-64 lg:w-72 bg-slate-900/90 border-l border-slate-800 shrink-0 p-4 space-y-1`}
        >
          <div className="mb-4 px-3 py-2 bg-slate-800/60 rounded-xl text-xs text-slate-400 flex items-center justify-between">
            <span>المستخدم:</span>
            <span className="font-semibold text-white">{user?.name || 'مدير العيادة'}</span>
          </div>

          <div className="space-y-1">
            {tabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-right ${
                    isActive
                      ? 'bg-brand-royal text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-brand-lime' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 md:hidden space-y-2">
            <button
              onClick={onBackToSite}
              className="w-full py-2.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold text-center"
            >
              الرجوع إلى الموقع العام
            </button>
          </div>
        </aside>

        {/* Main Workspace for the tab */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActiveTab()}
        </main>

      </div>

    </div>
  );
};
