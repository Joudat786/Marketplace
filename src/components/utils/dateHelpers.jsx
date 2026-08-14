/**
 * Date helper utilities for the Financial Approvals System
 */

const TZ = 'Asia/Riyadh';

/**
 * Format a date string to: 2025/11/26 - 08:17:23 ص (توقيت الرياض)
 */
function normalizeToUTC(dateInput) {
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === "string") {
    if (!/Z|[+-]\d{2}:?\d{2}$/.test(dateInput.trim())) {
      return new Date(dateInput.trim() + "Z");
    }
  }
  return new Date(dateInput);
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = normalizeToUTC(dateStr);
    if (isNaN(date.getTime())) return '-';

    // استخدام Intl لضمان توقيت الرياض (UTC+3)
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).formatToParts(date);

    const get = (type) => parts.find(p => p.type === type)?.value || '00';
    const year = get('year');
    const month = get('month');
    const day = get('day');
    const hour = get('hour');
    const minute = get('minute');
    const second = get('second');
    const rawPeriod = get('dayPeriod').toUpperCase().trim();
    const dayPeriod = rawPeriod === 'AM' ? 'ص' : 'م';

    return `${year}/${month}/${day} - ${hour}:${minute}:${second} ${dayPeriod}`;
  } catch {
    return '-';
  }
}

/**
 * Format a date string to: 2025/11/26 (توقيت الرياض)
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = normalizeToUTC(dateStr);
    if (isNaN(date.getTime())) return '-';

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const get = (type) => parts.find(p => p.type === type)?.value || '00';
    return `${get('year')}/${get('month')}/${get('day')}`;
  } catch {
    return '-';
  }
}

/**
 * Format minutes into a human-readable duration (e.g., "2 يوم و 3 ساعة")
 */
export function formatMinutesToTime(totalMinutes) {
  if (!totalMinutes || totalMinutes < 0) return '-';
  const minutes = Math.floor(totalMinutes);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} يوم`);
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (mins > 0) parts.push(`${mins} دقيقة`);
  return parts.length > 0 ? parts.join(' و ') : 'أقل من دقيقة';
}

/**
 * Format minutes into HH:MM:SS
 */
export function formatTime(totalMinutes) {
  if (!totalMinutes) return '00:00:00';
  const totalSeconds = Math.floor(totalMinutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Calculate working minutes between two dates given work periods
 */
export function calculateWorkingMinutes(startDate, endDate, workPeriods) {
  if (!startDate || !endDate || !workPeriods?.length) return 0;

  let totalMinutes = 0;
  const start = new Date(startDate);
  const end = new Date(endDate);

  const current = new Date(start);
  while (current < end) {
    const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat
    const dayPeriods = workPeriods.filter(p => p.days?.includes(dayOfWeek));

    for (const period of dayPeriods) {
      const [startH, startM] = (period.start_time || '08:00').split(':').map(Number);
      const [endH, endM] = (period.end_time || '17:00').split(':').map(Number);

      const periodStart = new Date(current);
      periodStart.setHours(startH, startM, 0, 0);
      const periodEnd = new Date(current);
      periodEnd.setHours(endH, endM, 0, 0);

      const overlapStart = new Date(Math.max(start, periodStart));
      const overlapEnd = new Date(Math.min(end, periodEnd));

      if (overlapEnd > overlapStart) {
        totalMinutes += (overlapEnd - overlapStart) / (1000 * 60);
      }
    }

    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return totalMinutes;
}

/**
 * Get relative time label (e.g., "منذ 3 ساعات")
 */
export function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  return `منذ ${diffDays} يوم`;
}