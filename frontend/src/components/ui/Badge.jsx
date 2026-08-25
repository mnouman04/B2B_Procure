import clsx from 'clsx';
import { BadgeCheck } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

const TONES = {
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  navy: 'bg-navy-50 text-navy-700 border-navy-100',
  gold: 'bg-gold-50 text-gold-800 border-gold-200',
  success: 'bg-success-soft text-green-700 border-green-200',
  info: 'bg-info-soft text-blue-700 border-blue-200',
  warn: 'bg-warn-soft text-amber-700 border-amber-200',
  danger: 'bg-danger-soft text-red-700 border-red-200',
};

/** Maps every domain status onto a consistent colour. */
const STATUS_TONE = {
  draft: 'neutral',
  published: 'info',
  quoted: 'gold',
  awarded: 'success',
  closed: 'neutral',
  cancelled: 'danger',
  submitted: 'info',
  shortlisted: 'gold',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
  expired: 'neutral',
  issued: 'info',
  approved: 'info',
  processing: 'gold',
  shipped: 'gold',
  delivered: 'success',
  completed: 'success',
  pending: 'warn',
  under_review: 'warn',
  verified: 'success',
  suspended: 'danger',
};

export const Badge = ({ tone = 'neutral', size = 'sm', icon: Icon, className, children }) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap',
      size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
      TONES[tone],
      className,
    )}
  >
    {Icon && <Icon size={size === 'xs' ? 10 : 12} />}
    {children}
  </span>
);

export const StatusBadge = ({ status, size = 'sm', className }) => {
  const { t } = useI18n();
  if (!status) return null;
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} size={size} className={className}>
      {t(`status.${status}`)}
    </Badge>
  );
};

/** The blue "Verified" chip used across supplier cards and profiles. */
export const VerifiedBadge = ({ size = 'sm', showLabel = true }) => {
  const { t } = useI18n();
  return (
    <Badge tone="info" size={size} icon={BadgeCheck}>
      {showLabel && t('matching.verified')}
    </Badge>
  );
};
