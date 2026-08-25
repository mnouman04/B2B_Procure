import { useI18n } from '../../i18n/index.jsx';
import { useApi } from '../../hooks/useApi.js';
import { analyticsApi, orderApi, supplierApi } from '../../api/endpoints.js';
import { Card, CardHeader, StatCard } from '../../components/ui/Card.jsx';
import { StatusDonut } from '../../components/charts/Charts.jsx';
import { EmptyState, PageHeader, Rating, Skeleton } from '../../components/ui/Misc.jsx';
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { formatDate, formatMoney } from '../../utils/format.js';

/** Supplier-side reports: quote outcomes, order history and rating breakdown. */
export const SupplierReportsPage = () => {
  const { t, locale, pick } = useI18n();
  const { data: dashboard, loading } = useApi(() => analyticsApi.supplierDashboard(), []);
  const { data: profile } = useApi(() => supplierApi.me(), []);
  const { data: orders } = useApi(() => orderApi.list({ limit: 10 }), []);

  const performance = dashboard?.quotePerformance ?? [];
  const totalQuotes = performance.reduce((s, p) => s + p.count, 0);
  const breakdown = profile?.rating?.breakdown ?? {};

  return (
    <>
      <PageHeader title={t('sidebar.reports')} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <StatCard label={t('dashboard.supplier.winRate')} value={`${dashboard?.stats?.winRate ?? 0}%`} tone="success" />
            <StatCard label={t('dashboard.supplier.quotesSubmitted')} value={dashboard?.stats?.quotesSubmitted ?? 0} />
            <StatCard label={t('analytics.onTime')} value={`${profile?.onTimeDeliveryRate ?? 0}%`} />
            <StatCard
              label={t('analytics.totalSpend')}
              tone="gold"
              value={<><span className="me-1 text-base font-bold">{t('common.currency')}</span>{formatMoney(profile?.stats?.totalSales ?? 0, { compact: true })}</>}
            />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title={t('dashboard.supplier.quotePerformance')} />
          <div className="border-t border-line p-5">
            <StatusDonut
              data={performance.map((p) => ({ name: p.label, value: p.count }))}
              total={totalQuotes}
              caption={t('dashboard.supplier.offers')}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title={t('compare.supplierRating')} />
          <div className="space-y-4 border-t border-line p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink">{t('dashboard.supplier.rating')}</span>
              <Rating value={profile?.rating?.average} count={profile?.rating?.count} size="lg" />
            </div>
            {['quality', 'delivery', 'communication', 'pricing'].map((key) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="text-slate-600">{t(`orders.rating.${key}`)}</span>
                  <span className="font-semibold text-ink">{(breakdown[key] ?? 0).toFixed(1)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-gold-400"
                    style={{ width: `${((breakdown[key] ?? 0) / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title={t('orders.purchaseOrders')} actionTo="/supplier/orders" actionLabel={t('dashboard.viewAll')} />
        <div className="border-t border-line">
          {orders?.length ? (
            <Table>
              <THead>
                <TH>{t('orders.poNumber')}</TH>
                <TH>{t('orders.buyer')}</TH>
                <TH align="end">{t('orders.total')}</TH>
                <TH>{t('orders.expectedDelivery')}</TH>
                <TH align="end">{t('orders.status')}</TH>
              </THead>
              <TBody>
                {orders.map((po) => (
                  <TR key={po._id}>
                    <TD className="font-bold text-navy-800">{po.poNumber}</TD>
                    <TD>{pick(po.company)}</TD>
                    <TD align="end" className="font-semibold text-ink">{formatMoney(po.total)}</TD>
                    <TD>{formatDate(po.expectedDeliveryDate, locale)}</TD>
                    <TD align="end"><StatusBadge status={po.status} size="xs" /></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState title={t('orders.noOrders')} />
          )}
        </div>
      </Card>
    </>
  );
};
