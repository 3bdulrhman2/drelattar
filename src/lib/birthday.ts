// Birthday celebration date logic. Active only on 2026-11-26, Africa/Cairo.
export const BIRTHDAY_DATE = '2026-11-26';
export const BIRTHDAY_STORAGE_KEY = `elattar-birthday-${BIRTHDAY_DATE}-shown`;

/** Today's calendar date in Africa/Cairo as YYYY-MM-DD, whatever the visitor's own timezone. */
export const cairoDateString = (now: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

export const isBirthdayToday = (now: Date = new Date()): boolean => cairoDateString(now) === BIRTHDAY_DATE;

/** The overlay belongs to the public homepage only, never admin, secretary, card or booking pages. */
export const isPublicHomePath = (pathname: string, hash: string): boolean => {
  const path = pathname.toLowerCase();
  const h = hash.toLowerCase();
  if (path.startsWith('/admin') || h.includes('admin')) return false;
  if (path.startsWith('/secretary') || h.includes('secretary')) return false;
  if (path.startsWith('/card') || path.startsWith('/vcard') || path.startsWith('/pay') || h.includes('card') || h.includes('pay')) return false;
  if (path.startsWith('/booking') || path.startsWith('/book') || h.includes('booking')) return false;
  return true;
};

const readFlag = (): boolean => {
  try { return window.localStorage.getItem(BIRTHDAY_STORAGE_KEY) === '1'; } catch { return false; }
};

/** True when the overlay should open now. Claims today's slot so it shows once per visitor per day. */
export const claimBirthdayView = (now: Date = new Date()): boolean => {
  if (!isBirthdayToday(now)) return false;
  if (!isPublicHomePath(window.location.pathname, window.location.hash)) return false;
  if (readFlag()) return false;
  try { window.localStorage.setItem(BIRTHDAY_STORAGE_KEY, '1'); } catch { /* storage blocked: show anyway, this page load only */ }
  return true;
};
