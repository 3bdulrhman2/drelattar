import React from 'react';
import { AlertCircle, CalendarOff, Bell, Info } from 'lucide-react';
import { useSiteContent, useLang } from '../../i18n';
import { getCairoTodayString } from '../../lib/cairoTime';

export const ClinicNoticeBanner: React.FC = () => {
  const { data } = useSiteContent();
  const { t, isEn } = useLang();
  const { bookingSettings, visibility } = data;

  const todayStr = getCairoTodayString();

  // 1. Check if clinic is marked closed today
  if (bookingSettings.isClosedToday) {
    return (
      <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white px-4 py-2.5 text-xs sm:text-sm font-bold text-center flex items-center justify-center gap-2 shadow-md animate-fadeIn z-30">
        <CalendarOff className="w-4 h-4 shrink-0 animate-pulse text-rose-200" />
        <span>
          {bookingSettings.closedTodayReason?.trim()
            ? bookingSettings.closedTodayReason
            : t('تنويه: الحجز بالعيادة متوقف مؤقتاً اليوم. نستقبلكم مجدداً في مواعيد العمل القادمة.')}
        </span>
      </div>
    );
  }

  // 2. Check active scheduled holidays covering today
  const activeHolidayToday = (bookingSettings.holidays || []).find(
    (h) => h.isActive && todayStr >= h.startDate && todayStr <= h.endDate
  );

  if (activeHolidayToday) {
    return (
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white px-4 py-2.5 text-xs sm:text-sm font-bold text-center flex items-center justify-center gap-2 shadow-md animate-fadeIn z-30">
        <CalendarOff className="w-4 h-4 shrink-0 text-amber-200" />
        <span>
          {activeHolidayToday.customMessage ||
            (isEn
              ? `${t('تنويه: العيادة في عطلة')} (${activeHolidayToday.title}) ${activeHolidayToday.startDate} – ${activeHolidayToday.endDate}.`
              : `تنويه: العيادة في عطلة (${activeHolidayToday.title}) من ${activeHolidayToday.startDate} حتى ${activeHolidayToday.endDate}.`)}
        </span>
      </div>
    );
  }

  // 3. Check active custom announcements
  const activeAnnouncement = (bookingSettings.announcements || []).find((a) => {
    if (!a.isActive) return false;
    if (a.startDate && todayStr < a.startDate) return false;
    if (a.endDate && todayStr > a.endDate) return false;
    return true;
  });

  if (activeAnnouncement) {
    const bgStyles =
      activeAnnouncement.type === 'alert' || activeAnnouncement.type === 'closure'
        ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white'
        : activeAnnouncement.type === 'warning'
        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900'
        : 'bg-gradient-to-r from-brand-royal via-brand-medical to-brand-cyan text-white';

    return (
      <div
        className={`${bgStyles} px-4 py-2.5 text-xs sm:text-sm font-bold text-center flex items-center justify-center gap-2 shadow-md animate-fadeIn z-30`}
      >
        <Info className="w-4 h-4 shrink-0" />
        <span>
          <strong className="underline decoration-white/40">{activeAnnouncement.title}:</strong>{' '}
          {activeAnnouncement.content}
        </span>
      </div>
    );
  }

  // 4. Legacy emergency notice banner (preserved)
  if (visibility.emergencyNoticeActive && visibility.emergencyNoticeText) {
    return (
      <div className="bg-amber-500 text-slate-900 px-4 py-2 text-xs sm:text-sm font-bold text-center flex items-center justify-center gap-2 shadow-sm z-30">
        <Bell className="w-4 h-4 animate-bounce" />
        <span>{visibility.emergencyNoticeText}</span>
      </div>
    );
  }

  return null;
};
