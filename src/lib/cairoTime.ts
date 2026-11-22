// ========================================================
// Dr. Mohammed Elsayed Elattar Clinic
// Cairo Timezone Utilities (Africa/Cairo)
// ========================================================

export interface CairoDateTimeInfo {
  cairoTodayStr: string; // "YYYY-MM-DD"
  cairoHour: number; // 0-23
  cairoMinute: number; // 0-59
  formattedDateArabic: string;
}

/**
 * Returns the current date and time strictly in Africa/Cairo timezone.
 */
export const getCairoDateTime = (): CairoDateTimeInfo => {
  const now = new Date();
  
  // Format in ISO-like parts for Cairo
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = parseInt(getPart('hour') || '0', 10);
  const minute = parseInt(getPart('minute') || '0', 10);

  const arabicFormatter = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    cairoTodayStr: `${year}-${month}-${day}`,
    cairoHour: hour,
    cairoMinute: minute,
    formattedDateArabic: arabicFormatter.format(now),
  };
};

/**
 * Formats a 24h time string like "20:00" into friendly Arabic 12h: "08:00 مساءً"
 */
export const formatTimeArabic = (time24: string): string => {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  const minutePadded = m.toString().padStart(2, '0');

  if (h === 0) return `12:${minutePadded} صباحاً`;
  if (h < 12) return `${h.toString().padStart(2, '0')}:${minutePadded} صباحاً`;
  if (h === 12) return `12:${minutePadded} ظهراً`;
  return `${(h - 12).toString().padStart(2, '0')}:${minutePadded} مساءً`;
};

/**
 * Formats a 24h time string into full Arabic representation: e.g. "08:00 مساءً" or "01:00 ظهراً"
 */
export const formatTimeArabicFull = (time24: string): string => {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  const minutePadded = m.toString().padStart(2, '0');

  if (h === 0) return `12:${minutePadded} صباحاً`;
  if (h < 12) return `${h.toString().padStart(2, '0')}:${minutePadded} صباحاً`;
  if (h === 12) return `12:${minutePadded} ظهراً`;
  return `${(h - 12).toString().padStart(2, '0')}:${minutePadded} مساءً`;
};

/**
 * Formats a date string like "2026-11-19" into full Arabic: "الخميس 19 نوفمبر 2026"
 */
export const formatAppointmentDateArabic = (dateStr: string): string => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    // Use ar-EG with Latin numerals so dates appear as "الخميس 19 نوفمبر 2026"
    const formatted = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      timeZone: 'Africa/Cairo',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
    return formatted.replace(/،/g, '').replace(/\s+/g, ' ').trim();
  } catch {
    return dateStr;
  }
};

export interface WorkingHoursConfig {
  startTimeRegular?: string; // "13:00"
  endTimeRegular?: string;   // "21:00"
  startTimeFriday?: string;  // "16:00"
  endTimeFriday?: string;    // "22:00"
  slotDurationMinutes?: number; // 15, 30, 45, 60
}

/**
 * Returns today's ISO date string strictly in Africa/Cairo timezone: "YYYY-MM-DD"
 */
export const getCairoTodayString = (): string => {
  return getCairoDateTime().cairoTodayStr;
};

/**
 * Checks if a specific date is closed due to today's closure, closed dates list, or scheduled holidays.
 */
export const isDateClosed = (
  dateStr: string,
  settings?: {
    allowedDays?: string[];
    isClosedToday?: boolean;
    closedTodayReason?: string;
    closedDates?: string[];
    holidays?: { startDate: string; endDate: string; title: string; isActive: boolean; customMessage?: string }[];
  }
): { isClosed: boolean; reason?: string } => {
  if (!settings) return { isClosed: true, reason: 'تعذر التحقق من أيام الحجز المتاحة' };

  const todayStr = getCairoTodayString();

  // 1. Is today closed?
  if (dateStr === todayStr && settings.isClosedToday) {
    return {
      isClosed: true,
      reason: settings.closedTodayReason || 'الحجز متوقف اليوم',
    };
  }

  // 2. Is this specific date in closedDates?
  if (settings.closedDates && settings.closedDates.includes(dateStr)) {
    return {
      isClosed: true,
      reason: 'العيادة مغلقة في هذا اليوم',
    };
  }

  // 3. Is this date within an active scheduled holiday?
  if (settings.holidays && settings.holidays.length > 0) {
    const matchingHoliday = settings.holidays.find(
      (h) => h.isActive && dateStr >= h.startDate && dateStr <= h.endDate
    );
    if (matchingHoliday) {
      return {
        isClosed: true,
        reason: matchingHoliday.customMessage || `عطلة رسمية (${matchingHoliday.title})`,
      };
    }
  }

  // Match the server: an empty or missing weekday allowlist permits no dates.
  const date = new Date(`${dateStr}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return { isClosed: true, reason: 'تاريخ غير صالح للحجز' };
  }
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Africa/Cairo' });
  if (!Array.isArray(settings.allowedDays) || !settings.allowedDays.includes(weekday)) {
    return { isClosed: true, reason: 'هذا اليوم غير مفعّل للحجز في العيادة' };
  }

  return { isClosed: false };
};

/**
 * Generates appointment slots based on dynamic clinic working hours and interval.
 * Supported intervals: 15 mins (كل ربع ساعة), 30 mins (كل نصف ساعة), 45 mins (ساعة إلا ربع), 60 mins (كل ساعة).
 * Rules:
 * 1. Slots generated at the configured interval step.
 * 2. If booking for today, slot must be at least 3 hours (180 mins) in the future.
 * 3. Booked slots are marked unavailable.
 * 4. Start and end hours adapt dynamically to admin settings.
 */
export const generateDaySlots = (
  dateStr: string,
  bookedTimesForDate: string[] = [],
  hoursConfig?: WorkingHoursConfig
): { time: string; labelAr: string; isAvailable: boolean }[] => {
  const dateObj = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Africa/Cairo' });
  const isFriday = dayOfWeek === 'Friday';

  // Dynamic hours resolution:
  const parseTime = (timeStr?: string, defaultHour: number = 13, defaultMinute: number = 0) => {
    if (!timeStr) return { hour: defaultHour, minute: defaultMinute };
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    return {
      hour: isNaN(h) ? defaultHour : h,
      minute: isNaN(m) ? defaultMinute : m,
    };
  };

  const startTime = isFriday
    ? parseTime(hoursConfig?.startTimeFriday, 16, 0)
    : parseTime(hoursConfig?.startTimeRegular, 13, 0);

  const endTime = isFriday
    ? parseTime(hoursConfig?.endTimeFriday, 22, 0)
    : parseTime(hoursConfig?.endTimeRegular, 21, 0);

  const startTotalMinutes = startTime.hour * 60 + startTime.minute;
  const endTotalMinutes = endTime.hour * 60 + endTime.minute;

  const validSteps = [15, 30, 45, 60];
  const step = hoursConfig?.slotDurationMinutes && validSteps.includes(Number(hoursConfig.slotDurationMinutes))
    ? Number(hoursConfig.slotDurationMinutes)
    : 60;

  const { cairoTodayStr, cairoHour, cairoMinute } = getCairoDateTime();
  const isToday = dateStr === cairoTodayStr;
  const currentCairoTotalMinutes = cairoHour * 60 + cairoMinute;

  const slots: { time: string; labelAr: string; isAvailable: boolean }[] = [];

  for (let totalMin = startTotalMinutes; totalMin < endTotalMinutes; totalMin += step) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    // Requirement: Must book at least 3 hours (180 minutes) before the appointment
    const minutesUntilSlot = totalMin - currentCairoTotalMinutes;
    const isTooSoon = isToday && minutesUntilSlot < 180;

    // Check if already booked
    const isBooked = bookedTimesForDate.includes(timeStr);

    // Available only if at least 3 hours in advance and not already booked
    const isAvailable = !isTooSoon && !isBooked;

    slots.push({
      time: timeStr,
      labelAr: formatTimeArabic(timeStr),
      isAvailable,
    });
  }

  return slots;
};

/**
 * Returns the next N available booking dates in Cairo timezone.
 */
export const getUpcomingCairoDays = (count: number = 14) => {
  const { cairoTodayStr } = getCairoDateTime();
  const today = new Date(cairoTodayStr + 'T12:00:00');
  const days: { dateStr: string; dayNameAr: string; dateFormattedAr: string }[] = [];

  const arabicDayFormatter = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const dayNameOnlyFormatter = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    weekday: 'long',
  });

  for (let i = 0; i < count; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);

    const y = nextDate.getFullYear();
    const m = (nextDate.getMonth() + 1).toString().padStart(2, '0');
    const d = nextDate.getDate().toString().padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const isToday = i === 0;
    const isTomorrow = i === 1;

    let dayLabel = dayNameOnlyFormatter.format(nextDate);
    if (isToday) dayLabel = 'اليوم (' + dayLabel + ')';
    else if (isTomorrow) dayLabel = 'غداً (' + dayLabel + ')';

    days.push({
      dateStr,
      dayNameAr: dayLabel,
      dateFormattedAr: arabicDayFormatter.format(nextDate),
    });
  }

  return days;
};
