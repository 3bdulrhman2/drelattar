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
 * Formats a 24h time string like "13:30" into friendly Arabic 12h: "01:30 م"
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
 * Generates all 30-minute appointment slots (2 per hour) for a given day.
 * - Saturday - Thursday: 1:00 PM to 9:00 PM (13:00 to 21:00)
 * - Friday: 4:00 PM to 10:00 PM (16:00 to 22:00)
 */
export const generateDaySlots = (
  dateStr: string,
  bookedTimesForDate: string[] = []
): { time: string; labelAr: string; isAvailable: boolean }[] => {
  const dateObj = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Africa/Cairo' });
  const isFriday = dayOfWeek === 'Friday';

  const startHour = isFriday ? 16 : 13; // 4:00 PM on Friday, 1:00 PM other days
  const endHour = isFriday ? 22 : 21;   // 10:00 PM on Friday, 9:00 PM other days

  const { cairoTodayStr, cairoHour, cairoMinute } = getCairoDateTime();
  const isToday = dateStr === cairoTodayStr;

  const slots: { time: string; labelAr: string; isAvailable: boolean }[] = [];

  for (let h = startHour; h < endHour; h++) {
    // 2 slots every hour: :00 and :30
    for (const m of [0, 30]) {
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      
      // Check if slot has already passed today in Cairo
      const isPastToday = isToday && (h < cairoHour || (h === cairoHour && m <= cairoMinute + 10));
      
      // Check if already booked
      const isBooked = bookedTimesForDate.includes(timeStr);

      // Only slots that are not past and not booked are available
      const isAvailable = !isPastToday && !isBooked;

      slots.push({
        time: timeStr,
        labelAr: formatTimeArabic(timeStr),
        isAvailable,
      });
    }
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
