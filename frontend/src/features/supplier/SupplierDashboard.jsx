import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { useApi } from '../../hooks/useApi.js';
import { analyticsApi } from '../../api/endpoints.js';
import { Card, CardHeader, StatCard } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, PageHeader, Skeleton } from '../../components/ui/Misc.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusDonut } from '../../components/charts/Charts.jsx';
import { formatDate, formatMoney } from '../../utils/format.js';

/**
 * Supplier Dashboard — four KPI tiles, a quote-performance donut and the
 * latest RFQ invitations, mirroring the Arabic mockup.
 */
export const SupplierDashboard = () => {
  const { t, locale } = useI18n();
  const { data, loading } = useApi(() => analyticsApi.supplierDashboard(), []);

  const stats = data?.stats;
  const performance = data?.quotePerformance ?? [];
  const totalQuotes = performance.reduce((s, p) => s + p.count, 0);
  const notVerified = data?.verification && !data.verification.verified;

  return (
    <>
      <PageHeader title={t('dashboard.supplier.title')} subtitle={t('dashboard.supplier.overview')} />

      {notVerified && (
        <Card className="mb-4 flex flex-wrap items-center gap-4 border-warn/30 bg-warn-soft p-4">
          <ShieldAlert size={22} className="shrink-0 text-warn" />
          <div className="min-w-[200px] flex-1">
            <p className="text-sm font-bold text-amber-800">{t('verification.title')}</p>
            <p className="mt-0.5 text-[13px] text-amber-700">{t('verification.subtitle')}</p>
          </div>
          <Button as={Link} to="/supplier/verification" size="sm" variant="soft" iconEnd={ArrowRight}>
            {t('verification.submitForReview')}
          </Button>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <StatCard label={t('dashboard.supplier.newRfqs')} value={stats?.newRfqs ?? 0} />
            <StatCard label={t('dashboard.supplier.quotesSubmitted')} value={stats?.quotesSubmitted ?? 0} />
            <StatCard label={t('dashboard.supplier.ordersInProgress')} value={stats?.activeOrders ?? 0} tone="gold" />
            <StatCard
              label={t('dashboard.supplier.monthlySales')}
              tone="success"
              value={
                <>
                  <span className="me-1 text-base font-bold">{t('common.currency')}</span>
                  {formatMoney(stats?.monthlySales ?? 0, { compact: true })}
                </>
              }
              sub={`${t('dashboard.supplier.winRate')} ${stats?.winRate ?? 0}% · ${t('dashboard.supplier.rating')} ${(stats?.rating ?? 0).toFixed(1)}`}
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
          <CardHeader
            title={t('dashboard.supplier.newRfqRequests')}
            actionTo="/supplier/rfqs"
            actionLabel={t('dashboard.viewAll')}
          />
          <div className="border-t border-line">
            {loading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6" />)}
              </div>
            ) : data?.recentRfqs?.length ? (
              data.recentRfqs.map((rfq) => (
                <Link
                  key={rfq._id}
                  to={`/supplier/rfqs/${rfq._id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line/70 px-5 py-3.5 transition last:border-0 hover:bg-slate-50/70"
                >
                  <span className="w-[130px] shrink-0 text-[13px] font-bold text-navy-800">{rfq.rfqNumber}</span>
                  <span className="min-w-[140px] flex-1 truncate text-sm text-slate-700">{rfq.title}</span>
                  <Badge tone="neutral" size="xs">{rfq.deliveryLocation?.city}</Badge>
                  <span className="text-xs text-slate-400">{formatDate(rfq.publishedAt, locale)}</span>
                </Link>
              ))
            ) : (
              <EmptyState title={t('rfq.noRfqs')} className="py-10" />
            )}
          </div>
        </Card>
      </div>
    </>
  );
};
