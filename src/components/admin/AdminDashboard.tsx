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
  ExternalLink,
  Bell,
  BellRing,
  Save,
  Check,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useContent } from '../../context/ContentContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { requestWebNotificationPermission, triggerLocalNotification } from '../../lib/pushNotifications';
import { BroadcastNotificationModal } from './BroadcastNotificationModal';
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
  const { isSaving, saveToSupabase } = useContent();

  // Tab persistence: remembers the active tab across page refreshes
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('drelattar_admin_active_tab') || 'overview';
    }
    return 'overview';
  });

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('drelattar_admin_active_tab', tabId);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [notificationStatus, setNotificationStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const handleManualSave = async () => {
    const res = await saveToSupabase();
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleToggleNotifications = async () => {
    const perm = await requestWebNotificationPermission();
    setNotificationStatus(perm);
    if (perm === 'granted') {
      triggerLocalNotification({
        title: 'تم تفعيل التنبيهات بنجاح! 🔔',
        body: 'سيصلك تنبيه صوتي وإشعار فوري عند قيام أي مريض بحجز موعد جديد بالعيادة.',
        type: 'new_booking',
      });
    } else if (perm === 'denied') {
      alert('الإشعارات محظورة في إعدادات المتصفح. لتفعيلها: اضغط على أيقونة القفل بجانب رابط الموقع في شريط العنوان واختر "سماح" للإشعارات.');
    }
  };

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
        return <OverviewTab onSelectTab={handleSelectTab} />;
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
        return <OverviewTab onSelectTab={handleSelectTab} />;
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

        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. Broadcast Notification to Everyone Button */}
          <button
            onClick={() => setBroadcastModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-all shadow-sm"
            title="نشر إشعار أو إعلان فوري لجميع المستخدمين وزوار الموقع"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">نشر إشعار للجميع 📢</span>
          </button>

          {/* 2. Save Changes Button */}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 text-white border border-emerald-500'
                : 'bg-brand-royal hover:bg-brand-medical text-white border border-brand-cyan/40 hover:scale-105 active:scale-95'
            }`}
            title="حفظ جميع تعديلات الموقع"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>تم الحفظ بنجاح ✓</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-brand-cyan" />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات 💾'}</span>
              </>
            )}
          </button>

          {/* 3. Notification Activation / Test Button */}
          <button
            onClick={handleToggleNotifications}
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              notificationStatus === 'granted'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-brand-royal/20 border-brand-cyan/40 text-brand-cyan hover:bg-brand-royal/40 animate-pulse'
            }`}
            title={
              notificationStatus === 'granted'
                ? 'الإشعارات مفعلة (انقر لإرسال تنبيه تجريبي)'
                : 'انقر لتفعيل التنبيه الصوتي وإشعارات المتصفح'
            }
          >
            {notificationStatus === 'granted' ? (
              <>
                <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                <span>الإشعارات مفعّلة</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-brand-cyan" />
                <span>تفعيل التنبيهات</span>
              </>
            )}
          </button>

          {/* 4. Preview Site */}
          <button
            onClick={onBackToSite}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <span>معاينة الموقع</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* 5. Logout */}
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
                    handleSelectTab(tab.id);
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

      {/* Broadcast Notification Modal */}
      <BroadcastNotificationModal
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
      />

    </div>
  );
};
