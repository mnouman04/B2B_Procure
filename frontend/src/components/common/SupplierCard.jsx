import { Link } from 'react-router-dom';
import { MapPin, Navigation, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../../i18n/index.jsx';
import { Avatar, Rating, ScoreRing } from '../ui/Misc.jsx';
import { VerifiedBadge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Checkbox } from '../ui/Field.jsx';

/** Compact tile for the home page's "Top Rated Suppliers" strip. */
export const SupplierTile = ({ supplier }) => {
  const { pick } = useI18n();
  return (
    <Link
      to={`/suppliers/${supplier.slug || supplier._id}`}
      className="card flex flex-col gap-3 p-4 transition hover:shadow-lift"
    >
      <Avatar src={supplier.logo} name={pick(supplier)} size={44} />
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold text-ink">{pick(supplier)}</p>
        <p className="truncate text-xs text-slate-500">{pick(supplier.primaryCategory)}</p>
      </div>
      <Rating value={supplier.rating?.average} count={supplier.rating?.count} />
      <p className="flex items-center gap-1 text-xs text-slate-500">
        <MapPin size={12} className="shrink-0" />
        {supplier.location?.city}, {supplier.location?.country}
      </p>
    </Link>
  );
};

/**
 * The wide row from the "Supplier Matching" screen: logo, name + verified
 * chip, location and distance, rating and on-time rate, then the match-score
 * dial and a "View Profile" button.
 */
export const SupplierMatchRow = ({
  match, selectable = false, selected = false, onToggle, onViewProfile,
}) => {
  const { t, pick } = useI18n();
  const supplier = match.supplier ?? match;
  const score = match.matchScore;

  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-4 border-b border-line/70 px-5 py-4 transition last:border-0',
        selected ? 'bg-navy-50/50' : 'hover:bg-slate-50/60',
      )}
    >
      {selectable && (
        <Checkbox
          checked={selected}
          onChange={() => onToggle?.(supplier._id)}
          id={`pick-${supplier._id}`}
          className="shrink-0"
        />
      )}

      <Avatar src={supplier.logo} name={pick(supplier)} size={52} />

      <div className="min-w-[200px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-bold text-ink">{pick(supplier)}</p>
          {supplier.verified && <VerifiedBadge size="xs" />}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} className="text-slate-400" />
            {supplier.location?.city}, {supplier.location?.country}
          </span>
          {match.distanceKm != null && (
            <span className="inline-flex items-center gap-1">
              <Navigation size={12} className="text-success" />
              {t('matching.kmAway', { n: match.distanceKm })}
            </span>
          )}
          {supplier.avgLeadTimeDays != null && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} className="text-slate-400" />
              {supplier.avgLeadTimeDays} {t('analytics.days')}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
          <Rating value={supplier.rating?.average} count={supplier.rating?.count} />
          <span className="text-xs font-medium text-slate-600">
            {t('matching.onTimeDelivery', { n: supplier.onTimeDeliveryRate ?? 0 })}
          </span>
        </div>
      </div>

      {score != null && <ScoreRing value={score} label={t('matching.matchScore')} />}

      <Button
        size="sm"
        variant="primary"
        onClick={() => onViewProfile?.(supplier)}
        as={onViewProfile ? 'button' : Link}
        to={onViewProfile ? undefined : `/suppliers/${supplier.slug || supplier._id}`}
        className="min-w-[104px]"
      >
        {t('matching.viewProfile')}
      </Button>
    </div>
  );
};

/** Grid card for the supplier directory. */
export const SupplierGridCard = ({ supplier }) => {
  const { t, pick } = useI18n();
  return (
    <div className="card flex flex-col gap-3 p-5 transition hover:shadow-lift">
      <div className="flex items-start gap-3">
        <Avatar src={supplier.logo} name={pick(supplier)} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-[15px] font-bold text-ink">{pick(supplier)}</p>
            {supplier.verified && <VerifiedBadge size="xs" showLabel={false} />}
          </div>
          <p className="truncate text-xs text-slate-500">{pick(supplier.primaryCategory)}</p>
        </div>
      </div>

      {supplier.tagline && <p className="line-clamp-2 text-[13px] text-slate-500">{supplier.tagline}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Rating value={supplier.rating?.average} count={supplier.rating?.count} />
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} />
          {supplier.location?.city}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-line pt-3 text-center">
        <div>
          <p className="text-[15px] font-bold text-ink">{supplier.onTimeDeliveryRate ?? 0}%</p>
          <p className="text-[11px] text-slate-500">{t('analytics.onTime')}</p>
        </div>
        <div>
          <p className="text-[15px] font-bold text-ink">{supplier.projectsCompleted ?? 0}</p>
          <p className="text-[11px] text-slate-500">{t('suppliers.facts.projects')}</p>
        </div>
      </div>

      <Button
        as={Link}
        to={`/suppliers/${supplier.slug || supplier._id}`}
        variant="soft"
        size="sm"
        className="w-full"
      >
        {t('matching.viewProfile')}
      </Button>
    </div>
  );
};
