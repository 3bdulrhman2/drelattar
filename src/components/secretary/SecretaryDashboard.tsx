import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MessageCircle,
  CalendarOff,
  Plus,
  Trash2,
  LogOut,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import {
  getCairoDateTime,
  getCairoTodayString,
  formatTimeArabicFull,
  formatAppointmentDateArabic,
  isDateClosed,
} from '../../lib/cairoTime';
import type { SecretaryAccount, BookingAppointment } from '../../types';

interface SecretaryDashboardProps {
  account: SecretaryAccount;
  onLogout: () => void;
  onBackToSite: () => void;
}

export const SecretaryDashboard: React.FC<SecretaryDashboardProps> = ({
  account,
  onLogout,
  onBackToSite,
}) => {
  const {
    data,
    updateBookingStatus,
    toggleCloseToday,
    toggleCloseDate,
    addHoliday,
    deleteHoliday,
    addAnnouncement,
    deleteAnnouncement,
  } = useContent();

  const { bookings, bookingSettings, doctor } = data;
  const todayStr = getCairoTodayString();
  const cairoTime = getCairoDateTime();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'upcoming' | 'past'>('today');

  // Holiday Modal State
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayStart, setHolidayStart] = useState(todayStr);
  const [holidayEnd, setHolidayEnd] = useState(todayStr);
  const [holidayReason, setHolidayReason] = useState('');

  // Future Date Closure State
  const [selectedCloseDate, setSelectedCloseDate] = useState(todayStr);

  // Announcement Modal State
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [announceType, setAnnounceType] = useState<'info' | 'warning' | 'alert' | 'closure'>('info');

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return (bookings || []).filter((b) => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        b.patientName.toLowerCase().includes(searchLower) ||
        b.patientPhone.includes(searchLower) ||
        (b.id && b.id.toLowerCase().includes(searchLower));

      // Status
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;

      // Date
      let matchDate = true;
      if (dateFilter === 'today') {
        matchDate = b.appointmentDate === todayStr;
      } else if (dateFilter === 'tomorrow') {
        const tomorrow = new Date(todayStr + 'T12:00:00');
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        matchDate = b.appointmentDate === tomorrowStr;
      } else if (dateFilter === 'upcoming') {
        matchDate = b.appointmentDate >= todayStr;
      } else if (dateFilter === 'past') {
        matchDate = b.appointmentDate < todayStr;
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [bookings, searchTerm, statusFilter, dateFilter, todayStr]);

  // Statistics
  const stats = useMemo(() => {
    const list = bookings || [];
    const todayList = list.filter((b) => b.appointmentDate === todayStr);
    return {
      totalToday: todayList.length,
      pendingToday: todayList.filter((b) => b.status === 'pending').length,
      confirmedToday: todayList.filter((b) => b.status === 'confirmed').length,
      completedToday: todayList.filter((b) => b.status === 'completed').length,
      totalAll: list.length,
      totalPending: list.filter((b) => b.status === 'pending').length,
    };
  }, [bookings, todayStr]);

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayTitle.trim() || !holidayStart || !holidayEnd) {
      alert('يرجى كتابة عنوان الإجازة وتاريخ البداية والنهاية');
      return;
    }
    addHoliday({
      title: holidayTitle.trim(),
      startDate: holidayStart,
      endDate: holidayEnd,
      reason: holidayReason.trim() || undefined,
      isActive: true,
      createdBy: 'secretary',
    });
    setHolidayTitle('');
    setHolidayReason('');
    setShowHolidayModal(false);
  };

  const handleAddAnnounceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceContent.trim()) {
      alert('يرجى كتابة عنوان التنبيه ومحتواه');
      return;
    }
    addAnnouncement({
      title: announceTitle.trim(),
      content: announceContent.trim(),
      type: announceType,
      isActive: true,
      createdBy: 'secretary',
    });
    setAnnounceTitle('');
    setAnnounceContent('');
    setShowAnnounceModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-arabic text-right selection:bg-brand-cyan/20">
      
      {/* Top Navbar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-xs border border-slate-700 flex items-center justify-center shrink-0">
              <img src="/brand/clinic-logo.png" alt="شعار العيادة" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white">لوحة مشرف الحجوزات</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  متزامن حياً
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                عيادة {doctor.nameAr} • مرحباً بك: <strong className="text-brand-cyan">{account.name}</strong>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onBackToSite}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">معاينة الموقع</span>
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        
        {/* SECTION 1: Clinic Today Status & Quick Availability Bar */}
        <div className="bg-slate-800/80 rounded-2xl p-5 sm:p-6 border border-slate-700/60 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/70 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarOff className="w-5 h-5 text-brand-cyan" />
                <span>إدارة التوفر وإغلاق المواعيد الحية بالموقع</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تاريخ القاهرة الحالي: <strong className="text-white">{cairoTime.formattedDateArabic}</strong>
              </p>
            </div>

            {/* Status Pill */}
            <div>
              {bookingSettings.isClosedToday ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  حجوزات اليوم مغلقة بالموقع
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  الحجز متاح ومفتوح اليوم
                </span>
              )}
            </div>
          </div>

          {/* Quick Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Action 1: Toggle Today's Booking */}
            <button
              onClick={() => {
                const nextState = !bookingSettings.isClosedToday;
                const reason = nextState
                  ? prompt('سبب إغلاق حجوزات اليوم (اختياري لكي يظهر للمرضى):', 'الحجز متوقف اليوم لظروف طارئة') || ''
                  : '';
                toggleCloseToday(nextState, reason);
              }}
              className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                bookingSettings.isClosedToday
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">
                  {bookingSettings.isClosedToday ? 'إعادة فتح حجوزات اليوم' : 'إغلاق الحجوزات اليوم فوراً'}
                </span>
                <CalendarOff className="w-4 h-4 shrink-0" />
              </div>
              <p className="text-[11px] opacity-80 mt-1">
                {bookingSettings.isClosedToday
                  ? 'انقر لفتح الحجز مجدداً للمرضى'
                  : 'منع أي حجز جديد لليوم مع الحفاظ على الحجوزات السابقة'}
              </p>
            </button>

            {/* Action 2: Close specific future date */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
              <span className="text-xs font-bold text-slate-200 block">إغلاق موعد أو يوم محدد:</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedCloseDate}
                  min={todayStr}
                  onChange={(e) => setSelectedCloseDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-hidden w-full"
                />
                <button
                  type="button"
                  onClick={() => {
                    const isAlreadyClosed = (bookingSettings.closedDates || []).includes(selectedCloseDate);
                    toggleCloseDate(selectedCloseDate, !isAlreadyClosed);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                    (bookingSettings.closedDates || []).includes(selectedCloseDate)
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {(bookingSettings.closedDates || []).includes(selectedCloseDate) ? 'إعادة فتح' : 'إغلاق اليوم'}
                </button>
              </div>
            </div>

            {/* Action 3: Add Official Holiday */}
            <button
              onClick={() => setShowHolidayModal(true)}
              className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-right transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-brand-cyan">
                <span className="text-xs font-bold">جدولة إجازة رسمية</span>
                <Plus className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                تحديد فترة عطلة (عيد، سفر، إجازة) ليتم حجبها تلقائياً بالموقع
              </p>
            </button>

            {/* Action 4: Post Announcement Banner */}
            <button
              onClick={() => setShowAnnounceModal(true)}
              className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-right transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-xs font-bold">نشر تنبيه أو إعلان للموقع</span>
                <Bell className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                عرض شريط إشعار فوري أعلى الموقع للزوار
              </p>
            </button>

          </div>

          {/* Active Holidays & Closed Dates Summary */}
          {((bookingSettings.closedDates && bookingSettings.closedDates.length > 0) ||
            (bookingSettings.holidays && bookingSettings.holidays.length > 0)) && (
            <div className="pt-2 border-t border-slate-700/50 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">الأيام والإجازات المغلقة حالياً:</span>
              
              {/* Closed single dates */}
              {(bookingSettings.closedDates || []).map((date) => (
                <span
                  key={date}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20"
                >
                  <span>{formatAppointmentDateArabic(date)}</span>
                  <button
                    onClick={() => toggleCloseDate(date, false)}
                    className="hover:text-rose-100"
                    title="إعادة فتح هذا اليوم"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {/* Scheduled holidays */}
              {(bookingSettings.holidays || []).map((h) => (
                <span
                  key={h.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20"
                >
                  <span>{h.title} ({h.startDate} إلى {h.endDate})</span>
                  <button
                    onClick={() => deleteHoliday(h.id)}
                    className="hover:text-amber-100"
                    title="حذف الإجازة"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60">
            <span className="text-slate-400 text-xs block">حجوزات اليوم</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats.totalToday}</span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60">
            <span className="text-amber-400 text-xs block">بانتظار التأكيد (اليوم)</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{stats.pendingToday}</span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60">
            <span className="text-blue-400 text-xs block">مؤكدة (اليوم)</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{stats.confirmedToday}</span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60">
            <span className="text-emerald-400 text-xs block">تم الكشف (اليوم)</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats.completedToday}</span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60">
            <span className="text-slate-400 text-xs block">إجمالي الحجوزات</span>
            <span className="text-2xl font-black text-slate-200 mt-1 block">{stats.totalAll}</span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60">
            <span className="text-purple-400 text-xs block">إجمالي بانتظار التأكيد</span>
            <span className="text-2xl font-black text-purple-400 mt-1 block">{stats.totalPending}</span>
          </div>
        </div>

        {/* SECTION 3: Bookings List with Search & Filters */}
        <div className="bg-slate-800/80 rounded-2xl p-5 sm:p-6 border border-slate-700/60 shadow-lg space-y-5">
          
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث باسم المريض، رقم الهاتف، أو كود الحجز..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-cyan pl-9"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl text-xs overflow-x-auto no-scrollbar">
              {[
                { id: 'today', label: 'اليوم' },
                { id: 'tomorrow', label: 'غداً' },
                { id: 'upcoming', label: 'القادمة' },
                { id: 'past', label: 'السابقة' },
                { id: 'all', label: 'الكل' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDateFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                    dateFilter === tab.id
                      ? 'bg-brand-royal text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl text-xs overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'جميع الحالات' },
                { id: 'pending', label: 'معلقة' },
                { id: 'confirmed', label: 'مؤكدة' },
                { id: 'completed', label: 'مكتملة' },
                { id: 'cancelled', label: 'ملغية' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                    statusFilter === tab.id
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>

          {/* Bookings Table / Cards */}
          {filteredBookings.length > 0 ? (
            <div className="space-y-3">
              {filteredBookings.map((b) => {
                const isToday = b.appointmentDate === todayStr;
                return (
                  <div
                    key={b.id}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      b.status === 'confirmed'
                        ? 'bg-blue-950/20 border-blue-800/40'
                        : b.status === 'completed'
                        ? 'bg-emerald-950/20 border-emerald-800/40 opacity-90'
                        : b.status === 'cancelled'
                        ? 'bg-rose-950/20 border-rose-800/40 opacity-75'
                        : 'bg-slate-900/90 border-slate-700/70'
                    }`}
                  >
                    
                    {/* Patient & Appointment Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm sm:text-base">
                          {b.patientName}
                        </span>
                        
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-brand-cyan border border-slate-700">
                          {b.id}
                        </span>

                        {isToday && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            حجز اليوم
                          </span>
                        )}

                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            b.status === 'confirmed'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : b.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : b.status === 'cancelled'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {b.status === 'confirmed'
                            ? 'مؤكد'
                            : b.status === 'completed'
                            ? 'تم الكشف'
                            : b.status === 'cancelled'
                            ? 'ملغي'
                            : 'بانتظار التأكيد'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-300 pt-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-purple-400" />
                          <span>{formatAppointmentDateArabic(b.appointmentDate)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTimeArabicFull(b.appointmentTime)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-brand-cyan">
                          <Phone className="w-3.5 h-3.5" />
                          <span dir="ltr">{b.patientPhone}</span>
                        </div>
                      </div>

                      {b.notes && (
                        <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                          {b.notes}
                        </p>
                      )}

                    </div>

                    {/* Actions: Call, WhatsApp, Confirm, Complete, Cancel */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      
                      {/* Quick Call */}
                      <a
                        href={`tel:${b.patientPhone}`}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="اتصال هاتفي بالمريض"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      {/* Quick WhatsApp */}
                      <a
                        href={`https://wa.me/20${b.patientPhone.replace(/^0+/, '')}?text=${encodeURIComponent(
                          `السلام عليكم أ / ${b.patientName}، بخصوص حجز سيادتكم في عيادة د. محمد السيد العطار ليوم ${formatAppointmentDateArabic(
                            b.appointmentDate
                          )} الساعة ${formatTimeArabicFull(b.appointmentTime)}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 transition-colors"
                        title="محادثة واتساب"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      {/* Status Action Buttons */}
                      {b.status !== 'confirmed' && (
                        <button
                          onClick={() => updateBookingStatus(b.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs"
                        >
                          تأكيد الحجز
                        </button>
                      )}

                      {b.status !== 'completed' && (
                        <button
                          onClick={() => updateBookingStatus(b.id, 'completed')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
                        >
                          تم الكشف
                        </button>
                      )}

                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من إلغاء حجز المريض "${b.patientName}"؟`)) {
                              updateBookingStatus(b.id, 'cancelled');
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors"
                        >
                          إلغاء
                        </button>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-1">
              <Calendar className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-bold text-white text-sm">لا توجد حجوزات مطابقة للفلتر المحدد</p>
              <p className="text-slate-500">جرب تغيير حالة الحجز أو الفترة الزمنية من الشريط أعلاه.</p>
            </div>
          )}

        </div>

      </main>

      {/* MODAL 1: Add Holiday */}
      {showHolidayModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHolidayModal(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-right">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-brand-cyan" />
              <span>جدولة إجازة أو عطلة جديدة للعيادة</span>
            </h3>

            <form onSubmit={handleAddHolidaySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  عنوان الإجازة (مثال: إجازة عيد الفطر / عطلة سنوية)
                </label>
                <input
                  type="text"
                  value={holidayTitle}
                  onChange={(e) => setHolidayTitle(e.target.value)}
                  placeholder="عنوان الإجازة..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    تاريخ البداية
                  </label>
                  <input
                    type="date"
                    value={holidayStart}
                    onChange={(e) => setHolidayStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    تاريخ النهاية
                  </label>
                  <input
                    type="date"
                    value={holidayEnd}
                    onChange={(e) => setHolidayEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رسالة مخصصة للمرضى (اختياري)
                </label>
                <input
                  type="text"
                  value={holidayReason}
                  onChange={(e) => setHolidayReason(e.target.value)}
                  placeholder="مثال: نعتذر عن استقبال الحالات للإجازة ونلتقيكم السبت القادم"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-royal hover:bg-brand-medical text-white text-xs font-bold"
                >
                  حفظ وتفعيل الإجازة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Announcement */}
      {showAnnounceModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAnnounceModal(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-right">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>نشر تنبيه أو إعلان للموقع</span>
            </h3>

            <form onSubmit={handleAddAnnounceSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  عنوان الإعلان المختصر
                </label>
                <input
                  type="text"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  placeholder="مثال: تنويه هام بخصوص مواعيد الجمعة"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نوع الإعلان ولونه
                </label>
                <select
                  value={announceType}
                  onChange={(e) => setAnnounceType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
                >
                  <option value="info">إشعار إخباري عام (أزرق ملكي)</option>
                  <option value="warning">تنبيه متوسط (أصفر / برتقالي)</option>
                  <option value="alert">تنبيه عاجل / إغلاق طارئ (أحمر)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نص الإعلان
                </label>
                <textarea
                  value={announceContent}
                  onChange={(e) => setAnnounceContent(e.target.value)}
                  placeholder="محتوى التنبيه الذي سيظهر لزوار الموقع..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan min-h-[80px]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  نشر الإعلان فوراً بالموقع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
