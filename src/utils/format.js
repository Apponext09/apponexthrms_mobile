import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const toApiDate = d => dayjs(d).format('YYYY-MM-DD');

export const formatDate = (d, fmt = 'DD MMM YYYY') =>
  d && dayjs(d).isValid() ? dayjs(d).format(fmt) : '—';

export const formatShortDate = d => formatDate(d, 'DD MMM');

export const formatTime = d => {
  if (!d) return '--:--';
  // Accept full datetimes and bare "HH:mm[:ss]" strings
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(String(d))) {
    return dayjs(`2000-01-01T${d}`).format('hh:mm A');
  }
  return dayjs(d).isValid() ? dayjs(d).format('hh:mm A') : '--:--';
};

export const formatRelative = d =>
  d && dayjs(d).isValid() ? dayjs(d).fromNow() : '';

export const formatDuration = minutes => {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${String(mm).padStart(2, '0')}m`;
};

export const formatClock = totalSeconds => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
};

export const formatCurrency = (amount, currency = 'INR') => {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `₹${n.toFixed(2)}`;
  }
};

export const formatCompact = n => {
  const v = Number(n) || 0;
  if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(v);
};

export const titleCase = s =>
  String(s || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(
      /\w\S*/g,
      w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    );

export const initials = (first = '', last = '') =>
  `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || 'U';

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};
