import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SlidersHorizontal, Users, Send, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { catalogApi, rfqApi } from '../../api/endpoints.js';
import { Card } from '../../components/ui/Card.jsx';
import { InlineSelect } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState, Skeleton } from '../../components/ui/Misc.jsx';
import { SupplierMatchRow } from '../../components/common/SupplierCard.jsx';

const STRATEGIES = ['best_match', 'best_price', 'fastest_delivery', 'highest_rated', 'nearest'];

/**
 * Supplier Matching — the standalone screen from the mockup, reachable from
 * any RFQ. Header shows the RFQ number, the toolbar carries Sort by /
 * Location / More Filters, then the scored supplier rows.
 */
export const SupplierMatchingPage = () => {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();

  const [strategy, setStrategy] = useState('best_match');
  const [city, setCity] = useState('');
  const [limit, setLimit] = useState(3);
  const [selected, setSelected] = useState([]);

  const { data: rfq } = useApi(() => rfqApi.get(id), [id]);
  const { data: reference } = useApi(() => catalogApi.reference(), []);
  const { data, loading } = useApi(
    () => rfqApi.matches(id, { strategy, limit: 50, ...(city ? { city } : {}) }),
    [id, strategy, city],
  );

  const invite = useMutation(() =>
    rfqApi.publish(id, { supplierIds: selected, strategy, autoInviteLimit: 12 }),
  );

  const sendInvitations = async () => {
    try {
      const res = await invite.mutate();
      toast.success(res.message);
      navigate(`/buyer/rfqs/${id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const matches = data?.matches ?? [];
  const visible = matches.slice(0, limit);
  const isDraft = rfq?.status === 'draft';

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-1 pt-5">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">{t('matching.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? t('common.loading') : t('matching.found', { n: data?.totalFound ?? 0 })}
          </p>
        </div>
        {rfq && (
          <Link to={`/buyer/rfqs/${id}`} className="text-sm font-semibold text-slate-500 hover:text-ink">
            RFQ: <span className="text-info">{rfq.rfqNumber}</span>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <InlineSelect
          label={t('matching.sortBy')}
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          className="min-w-[200px] flex-1 sm:flex-none"
        >
          {STRATEGIES.map((s) => (
            <option key={s} value={s}>{t(`matching.strategies.${s}`)}</option>
          ))}
        </InlineSelect>

        <InlineSelect
          label={t('matching.location')}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="min-w-[200px] flex-1 sm:flex-none"
        >
          <option value="">{t('matching.allLocations')}</option>
          {(reference?.cities ?? []).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </InlineSelect>

        <Button size="sm" variant="soft" icon={SlidersHorizontal} className="ms-auto">
          {t('matching.moreFilters')}
        </Button>
      </div>

      <div className="border-y border-line">
        {loading ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : visible.length ? (
          visible.map((match) => (
            <SupplierMatchRow
              key={match.supplier._id}
              match={match}
              selectable={isDraft}
              selected={selected.includes(match.supplier._id)}
              onToggle={(sid) =>
                setSelected((c) => (c.includes(sid) ? c.filter((s) => s !== sid) : [...c, sid]))
              }
            />
          ))
        ) : (
          <EmptyState icon={Users} title={t('matching.noMatches')} />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 px-5 py-5">
        {limit < matches.length && (
          <Button onClick={() => setLimit(matches.length)} iconEnd={ArrowRight} className="min-w-[220px]">
            {t('matching.viewAll', { n: matches.length })}
          </Button>
        )}
        {isDraft && (
          <Button variant="gold" icon={Send} onClick={sendInvitations} loading={invite.loading}>
            {selected.length ? t('matching.inviteSelected') : t('rfq.publish')}
          </Button>
        )}
      </div>
    </Card>
  );
};
