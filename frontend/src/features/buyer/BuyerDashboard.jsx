import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Plus, ArrowRight } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { useApi } from '../../hooks/useApi.js';
import { analyticsApi } from '../../api/endpoints.js';
import { selectNotifications } from '../../store/notificationSlice.js';
import { Card, CardHeader, StatCard } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { Avatar, EmptyState, PageHeader, Skeleton } from '../../components/ui/Misc.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SpendDonut } from '../../components/charts/Charts.jsx';
import { formatDate, formatMoney, timeAgo } from '../../utils/format.js';

/**
 * Buyer Dashboard.
 *
 * Layout mirrors the mockup: four KPI tiles across the top, a wide
 * "Recent RFQs" table beside a "Recent Activity" feed, then the spend donut
 * beside "Top Suppliers by Spend".
 */
export const BuyerDashboard = () => {
  const { t, locale, pick } = useI18n();
  const { data, loading } = useApi(() => analyticsApi.buyerDashboard(), []);
  const activity = useSelector(selectNotifications);

  const stats = data?.stats;

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        actions={
          <Button as={Link} to="/buyer/rfqs/new" icon={Plus}>
            {t('rfq.newRfq')}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <StatCard label={t('dashboard.activeRfqs')} value={stats?.activeRfqs ?? 0} />
            <StatCard label={t('dashboard.quotesReceived')} value={stats?.quotesReceived ?? 0} />
            <StatCard label={t('dashboard.pendingOrders')} value={stats?.pendingOrders ?? 0} tone="gold" />
            <StatCard
              label={t('dashboard.totalSavings')}
              tone="success"
              value={
                <>
                  <span className="me-1 text-base font-bold">{t('common.currency')}</span>
                  {formatMoney(stats?.totalSavings ?? 0, { compact: true })}
                </>
              }
              sub={stats?.savingsPercent ? `${stats.savingsPercent}% ${t('analytics.savingsPercent')}` : undefined}
            />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        {/* Recent RFQs */}
        <Card>
          <CardHeader title={t('dashboard.recentRfqs')} actionTo="/buyer/rfqs" actionLabel={t('dashboard.viewAll')} />
          <div className="border-t border-line">
            {loading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6" />)}
              </div>
            ) : data?.recentRfqs?.length ? (
              data.recentRfqs.map((rfq) => (
                <Link
                  key={rfq._id}
                  to={`/buyer/rfqs/${rfq._id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line/70 px-5 py-3.5 transition last:border-0 hover:bg-slate-50/70"
                >
                  <span className="w-[130px] shrink-0 text-[13px] font-bold text-navy-800">{rfq.rfqNumber}</span>
                  <span className="min-w-[150px] flex-1 truncate text-sm text-slate-700">{rfq.title}</span>
                  <span className="text-xs text-slate-400">{formatDate(rfq.createdAt, locale)}</span>
                  <StatusBadge status={rfq.status} size="xs" />
                  <span className="w-[80px] text-end text-[13px] font-semibold text-slate-600">
                    {rfq.quotesCount} {rfq.quotesCount === 1 ? t('dashboard.quote') : t('dashboard.quotes')}
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState
                title={t('rfq.noRfqs')}
                action={
                  <Button as={Link} to="/buyer/rfqs/new" size="sm" icon={Plus}>
                    {t('rfq.newRfq')}
                  </Button>
                }
              />
            )}
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="flex flex-col">
          <CardHeader title={t('dashboard.recentActivity')} />
          <div className="flex-1 border-t border-line">
            {activity.length ? (
              activity.slice(0, 4).map((item) => (
                <div key={item._id} className="border-b border-line/70 px-5 py-3.5 last:border-0">
                  <p className="text-[13px] font-semibold leading-snug text-ink">{item.title}</p>
                  {item.body && <p className="mt-0.5 text-xs leading-snug text-slate-500">{item.body}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">{timeAgo(item.createdAt, t)}</p>
                </div>
              ))
            ) : (
              <EmptyState title={t('dashboard.noActivity')} className="py-10" />
            )}
          </div>
          <Link
            to="/buyer/rfqs"
            className="inline-flex items-center gap-1 px-5 py-4 text-[13px] font-semibold text-info hover:text-blue-800"
          >
            {t('dashboard.viewAllActivity')}
            <ArrowRight size={14} className="rtl-flip" />
          </Link>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Spend overview */}
        <Card>
          <CardHeader title={t('dashboard.spendOverview')} />
          <div className="border-t border-line p-5">
            <SpendDonut
              data={(data?.spendByCategory ?? []).map((c) => ({
                name: pick(c),
                value: c.total,
                share: c.share,
              }))}
              total={data?.spendTotal ?? 0}
            />
          </div>
        </Card>

        {/* Top suppliers by spend */}
        <Card>
          <CardHeader
            title={t('dashboard.topSuppliersBySpend')}
            actionTo="/buyer/suppliers"
            actionLabel={t('dashboard.viewAll')}
          />
          <div className="border-t border-line">
            {data?.topSuppliers?.length ? (
              data.topSuppliers.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center gap-3 border-b border-line/70 px-5 py-3.5 last:border-0"
                >
                  <Avatar src={s.logo} name={pick(s)} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{pick(s)}</span>
                  <span className="whitespace-nowrap text-[13px] font-bold text-ink">
                    {t('common.currency')} {formatMoney(s.spend, { compact: true })}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState title={t('common.noData')} className="py-10" />
            )}
          </div>
        </Card>
      </div>
    </>
  );
};
