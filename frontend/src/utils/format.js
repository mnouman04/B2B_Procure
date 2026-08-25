/** Presentation helpers shared by every screen. */

export const formatMoney = (value = 0, { decimals = 2, compact = false } = {}) => {
  const n = Number(value) || 0;
  if (compact && Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (compact && Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const formatNumber = (value = 0) => Number(value || 0).toLocaleString();

export const formatDate = (value, locale = 'en') => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

/** Relative time used by the notification feed and activity lists. */
export const timeAgo = (value, t) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return t('common.ago.now');
  if (minutes < 60) return t('common.ago.minutes', { n: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('common.ago.hours', { n: hours });
  return t('common.ago.days', { n: Math.round(hours / 24) });
};

export const daysUntil = (value) => {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
};

export const initialsOf = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const truncate = (text = '', max = 90) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

/** Flattens the API's field-level validation errors into a form-friendly map. */
export const toFieldErrors = (apiError) => {
  if (!apiError?.errors?.length) return {};
  return apiError.errors.reduce((acc, issue) => {
    const key = String(issue.field).replace(/^body\./, '');
    acc[key] ??= issue.message;
    return acc;
  }, {});
};

export const CHART_COLORS = ['#1E3160', '#3B62C4', '#7CA0E8', '#F0A03C', '#C3CEE6', '#16A34A', '#DFAE4E'];
