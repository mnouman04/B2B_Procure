import { useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useApi } from '../../hooks/useApi.js';
import { analyticsApi } from '../../api/endpoints.js';
import { Card, CardHeader, StatCard } from '../../components/ui/Card.jsx';
import { SegmentedControl } from '../../components/ui/Tabs.jsx';
import { Avatar, EmptyState, PageHeader, Rating, Skeleton } from '../../components/ui/Misc.jsx';
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table.jsx';
import { SpendDonut, SpendBars } from '../../components/charts/Charts.jsx';
import { formatMoney } from '../../utils/format.js';

/**
 * Procurement Analytics — purchasing volume, average prices, top suppliers
 * and savings percentage, as listed in the brief.
 */
export const ProcurementAnalyticsPage = () => {
  const { t, pick } = useI18n();
  const [months, setMonths] = useState(12);
  const { data, loading } = useApi(() => analyticsApi.procurement(months), [months]);

  const summary = data?.summary;

  return (
    <>
      <PageHeader
        title={t('analytics.title')}
        actions={
          <SegmentedControl
            value={months}
            onChange={setMonths}
            options={[
              { value: 6, label: '6M' },
              { value: 12, label: '12M' },
              { value: 24, label: '24M' },
            ]}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <StatCard
              label={t('analytics.totalSpend')}
              value={
                <>
                  <span className="me-1 text-base font-bold">{t('common.currency')}</span>
                  {formatMoney(summary?.totalSpend ?? 0, { compact: true })}
                </>
              }
              sub={`${summary?.totalOrders ?? 0} ${t('analytics.orders')}`}
            />
            <StatCard
              label={t('analytics.savings')}
              tone="success"
              value={
                <>
                  <span className="me-1 text-base font-bold">{t('common.currency')}</span>
                  {formatMoney(summary?.savings ?? 0, { compact: true })}
                </>
              }
              sub={`${summary?.savingsPercent ?? 0}% ${t('analytics.savingsPercent')}`}
            />
            <StatCard
              label={t('analytics.avgCycle')}
              tone="gold"
              value={`${summary?.avgSourcingCycleDays ?? 0} ${t('analytics.days')}`}
            />
            <StatCard label={t('analytics.suppliersEngaged')} value={summary?.suppliersEngaged ?? 0} />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={t('analytics.monthlySpend')} />
          <div className="border-t border-line p-5">
            {data?.monthlySpend?.length ? (
              <SpendBars data={data.monthlySpend} />
            ) : (
              <EmptyState title={t('common.noData')} className="py-10" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title={t('analytics.spendByCategory')} />
          <div className="border-t border-line p-5">
            <SpendDonut
              data={(data?.byCategory ?? []).map((c) => ({ name: pick(c), value: c.spend, share: c.share }))}
              total={summary?.totalSpend ?? 0}
            />
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title={t('analytics.supplierPerformance')} />
        <div className="border-t border-line">
          {data?.bySupplier?.length ? (
            <Table>
              <THead>
                <TH>{t('orders.supplier')}</TH>
                <TH align="end">{t('analytics.totalSpend')}</TH>
                <TH align="center">{t('analytics.orders')}</TH>
                <TH align="end">{t('analytics.avgOrder')}</TH>
                <TH align="center">{t('analytics.onTime')}</TH>
                <TH align="end">{t('compare.supplierRating')}</TH>
              </THead>
              <TBody>
                {data.bySupplier.map((s) => (
                  <TR key={s._id}>
                    <TD>
                      <span className="flex items-center gap-2.5">
                        <Avatar src={s.logo} name={pick(s)} size={30} />
                        <span className="truncate font-medium text-ink">{pick(s)}</span>
                      </span>
                    </TD>
                    <TD align="end" className="font-bold text-ink">{formatMoney(s.spend)}</TD>
                    <TD align="center">{s.orders}</TD>
                    <TD align="end">{formatMoney(s.avgOrder)}</TD>
                    <TD align="center">{s.onTime}%</TD>
                    <TD align="end"><Rating value={s.rating} /></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState title={t('common.noData')} />
          )}
        </div>
      </Card>
    </>
  );
};
