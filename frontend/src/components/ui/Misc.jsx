import clsx from 'clsx';
import { Star, Package } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

/** The gold star + score + review count used on every supplier card. */
export const Rating = ({ value = 0, count, size = 'sm', className }) => (
  <span className={clsx('inline-flex items-center gap-1', className)}>
    <Star
      size={size === 'lg' ? 16 : 14}
      className="fill-gold-400 text-gold-400"
    />
    <span className={clsx('font-bold text-ink', size === 'lg' ? 'text-[15px]' : 'text-[13px]')}>
      {Number(value).toFixed(1)}
    </span>
    {count != null && (
      <span className={clsx('text-slate-400', size === 'lg' ? 'text-sm' : 'text-xs')}>({count})</span>
    )}
  </span>
);

/**
 * The circular percentage dial from the Supplier Matching cards.
 * Rendered as an SVG ring so it stays crisp at any size.
 */
export const ScoreRing = ({ value = 0, size = 52, stroke = 3, tone = 'success', label }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const colour = tone === 'success' ? '#16A34A' : tone === 'gold' ? '#DFAE4E' : '#1E3160';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E6EAF1" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colour}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (clamped / 100) * circumference}
            className="transition-all duration-700"
          />
        </svg>
        <span
          className="absolute inset-0 grid place-items-center text-[13px] font-bold"
          style={{ color: colour }}
        >
          {Math.round(clamped)}%
        </span>
      </div>
      {label && <span className="text-[11px] text-slate-500">{label}</span>}
    </div>
  );
};

/**
 * Supplier / company avatar. Falls back to a navy hexagon-style tile with
 * initials, matching the logo blocks in the mockups.
 */
export const Avatar = ({ src, name = '', size = 44, rounded = 'xl', className }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className={clsx('shrink-0 object-cover', rounded === 'full' ? 'rounded-full' : 'rounded-xl', className)}
      />
    );
  }

  return (
    <span
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.32) }}
      className={clsx(
        'grid shrink-0 place-items-center bg-navy-900 font-bold text-gold-400',
        rounded === 'full' ? 'rounded-full' : 'rounded-xl',
        className,
      )}
    >
      {initials || <Package size={size * 0.45} />}
    </span>
  );
};

export const Spinner = ({ className }) => (
  <span
    className={clsx(
      'inline-block h-5 w-5 animate-spin rounded-full border-2 border-navy-200 border-t-navy-900',
      className,
    )}
  />
);

export const PageLoader = () => (
  <div className="grid min-h-[40vh] place-items-center">
    <Spinner className="h-8 w-8" />
  </div>
);

export const EmptyState = ({ icon: Icon = Package, title, body, action, className }) => (
  <div className={clsx('flex flex-col items-center gap-3 px-6 py-14 text-center', className)}>
    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
      <Icon size={24} />
    </span>
    <div>
      <p className="font-semibold text-ink">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{body}</p>}
    </div>
    {action}
  </div>
);

export const Skeleton = ({ className }) => (
  <div className={clsx('animate-pulse rounded-lg bg-slate-200/70', className)} />
);

/** Page heading used at the top of every workspace screen. */
export const PageHeader = ({ title, subtitle, actions, className }) => (
  <div className={clsx('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
    <div>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Money = ({ value = 0, currency, className, decimals = 2 }) => {
  const { t } = useI18n();
  return (
    <span className={className}>
      {Number(value).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {currency !== false && <span className="ms-1 text-xs font-medium">{currency || t('common.currency')}</span>}
    </span>
  );
};
