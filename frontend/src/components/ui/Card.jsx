import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Card = ({ className, children, ...props }) => (
  <div className={clsx('card', className)} {...props}>
    {children}
  </div>
);

/**
 * The card header used throughout the dashboards: a bold title on the left
 * and a "View All →" link on the right, exactly as in the mockups.
 */
export const CardHeader = ({ title, action, actionTo, actionLabel, className }) => (
  <div className={clsx('flex items-center justify-between gap-3 px-5 py-4', className)}>
    <h3 className="text-[15px] font-bold text-ink">{title}</h3>
    {action ??
      (actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-info hover:text-blue-800"
        >
          {actionLabel}
          <ArrowRight size={14} className="rtl-flip" />
        </Link>
      ))}
  </div>
);

export const CardBody = ({ className, children }) => (
  <div className={clsx('px-5 pb-5', className)}>{children}</div>
);

export const CardDivider = () => <div className="border-t border-line" />;

/** Dashboard KPI tile — label above, large value below. */
export const StatCard = ({ label, value, sub, tone = 'ink', icon: Icon, className }) => (
  <div className={clsx('card flex flex-col justify-between gap-3 p-4', className)}>
    <div className="flex items-start justify-between gap-2">
      <p className="text-[13px] font-medium text-slate-500">{label}</p>
      {Icon && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-700">
          <Icon size={16} />
        </span>
      )}
    </div>
    <div>
      <p
        className={clsx(
          'text-2xl font-extrabold tracking-tight',
          tone === 'success' && 'text-success',
          tone === 'gold' && 'text-gold-600',
          tone === 'ink' && 'text-ink',
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  </div>
);
