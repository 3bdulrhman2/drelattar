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
 * Formats a 24h time string like "20:00" into friendly Arabic 12h: "08:00 م"
 */
export const formatTimeArabic = (time24: string): string => {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  const minutePadded = m.toString().padStart(2, '0');

  if (h === 0) return `12:${minutePadded} ص`;
  if (h < 12) return `${h.toString().padStart(2, '0')}:${minutePadded} ص`;
  if (h === 12) return `12:${minutePadded} م`;
  return `${(h - 12).toString().padStart(2, '0')}:${minutePadded} م`;
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
}

/**
 * Generates 1 appointment slot per hour based on dynamic clinic working hours.
 * Rules:
 * 1. Exactly 1 slot per hour (:00).
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
  const parseHour = (timeStr?: string, defaultHour: number = 13) => {
    if (!timeStr) return defaultHour;
    const h = parseInt(timeStr.split(':')[0], 10);
    return isNaN(h) ? defaultHour : h;
  };

  const startHour = isFriday
    ? parseHour(hoursConfig?.startTimeFriday, 16)
    : parseHour(hoursConfig?.startTimeRegular, 13);

  const endHour = isFriday
    ? parseHour(hoursConfig?.endTimeFriday, 22)
    : parseHour(hoursConfig?.endTimeRegular, 21);

  const { cairoTodayStr, cairoHour, cairoMinute } = getCairoDateTime();
  const isToday = dateStr === cairoTodayStr;
  const currentCairoTotalMinutes = cairoHour * 60 + cairoMinute;

  const slots: { time: string; labelAr: string; isAvailable: boolean }[] = [];

  for (let h = startHour; h < endHour; h++) {
    // Exactly 1 slot each hour at :00
    const m = 0;
    const timeStr = `${h.toString().padStart(2, '0')}:00`;
    const slotTotalMinutes = h * 60 + m;

    // Requirement: Must book at least 3 hours (180 minutes) before the appointment
    const minutesUntilSlot = slotTotalMinutes - currentCairoTotalMinutes;
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
