import { useState } from 'react';
import { SlidersHorizontal, Users } from 'lucide-react';
import { useI18n } from '../../../i18n/index.jsx';
import { useApi } from '../../../hooks/useApi.js';
import { rfqApi } from '../../../api/endpoints.js';
import { InlineSelect } from '../../../components/ui/Field.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState, Skeleton } from '../../../components/ui/Misc.jsx';
import { SupplierMatchRow } from '../../../components/common/SupplierCard.jsx';

const STRATEGIES = ['best_match', 'best_price', 'fastest_delivery', 'highest_rated', 'nearest'];

/**
 * Step 3 — Suppliers. Runs the matching engine against the saved draft and
 * lets the buyer pick who to invite, or leave the selection empty to let the
 * platform auto-invite the best matches.
 */
export const StepSuppliers = ({ rfqId, invited, setInvited, strategy, setStrategy, reference }) => {
  const { t } = useI18n();
  const [city, setCity] = useState('');

  const { data, loading } = useApi(
    () => rfqApi.matches(rfqId, { strategy, limit: 20, ...(city ? { city } : {}) }),
    [rfqId, strategy, city],
    { immediate: Boolean(rfqId) },
  );

  const toggle = (id) =>
    setInvited((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
    );

  return (
    <div>
      <h2 className="text-lg font-extrabold tracking-tight text-ink">
        {t('matching.title')}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {loading ? t('common.loading') : t('matching.found', { n: data?.totalFound ?? 0 })}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <InlineSelect
          label={t('matching.sortBy')}
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          className="min-w-[190px]"
        >
          {STRATEGIES.map((s) => (
            <option key={s} value={s}>{t(`matching.strategies.${s}`)}</option>
          ))}
        </InlineSelect>

        <InlineSelect
          label={t('matching.location')}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="min-w-[190px]"
        >
          <option value="">{t('matching.allLocations')}</option>
          {(reference?.cities ?? []).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </InlineSelect>

        <div className="ms-auto flex items-center gap-2.5">
          {invited.length > 0 && (
            <span className="text-[13px] font-semibold text-navy-800">
              {t('matching.selected', { n: invited.length })}
            </span>
          )}
          <Button size="sm" variant="soft" icon={SlidersHorizontal}>
            {t('matching.moreFilters')}
          </Button>
        </div>
      </div>

      <div className="mt-5 rounded-card border border-line">
        {loading ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : data?.matches?.length ? (
          data.matches.map((match) => (
            <SupplierMatchRow
              key={match.supplier._id}
              match={match}
              selectable
              selected={invited.includes(match.supplier._id)}
              onToggle={toggle}
              onViewProfile={(s) => window.open(`/suppliers/${s.slug || s._id}`, '_blank')}
            />
          ))
        ) : (
          <EmptyState icon={Users} title={t('matching.noMatches')} />
        )}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {invited.length === 0 && t('rfq.autoInvite')}
      </p>
    </div>
  );
};
