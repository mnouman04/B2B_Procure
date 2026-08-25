import { Link } from 'react-router-dom';
import { Building2, Users, FileText, ClipboardList, ArrowRight } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { useApi } from '../../hooks/useApi.js';
import { analyticsApi } from '../../api/endpoints.js';
import { Card, CardHeader, StatCard } from '../../components/ui/Card.jsx';
import { StatusBadge, Badge } from '../../components/ui/Badge.jsx';
import { Avatar, EmptyState, PageHeader, Skeleton } from '../../components/ui/Misc.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { formatMoney } from '../../utils/format.js';

/** Admin Dashboard — companies, suppliers, requests, commissions and reports. */
export const AdminDashboard = () => {
  const { t, pick } = useI18n();
  const { data, loading } = useApi(() => analyticsApi.adminDashboard(), []);
  const stats = data?.stats;

  return (
    <>
      <PageHeader title={t('admin.title')} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <StatCard icon={Building2} label={t('admin.companies')} value={stats?.companies ?? 0} sub={`${stats?.users ?? 0} ${t('admin.users')}`} />
            <StatCard icon={Users} label={t('admin.suppliers')} value={stats?.suppliers ?? 0} sub={`${stats?.pendingSuppliers ?? 0} ${t('admin.pendingVerification')}`} tone="gold" />
            <StatCard icon={FileText} label={t('admin.rfqs')} value={stats?.rfqs ?? 0} sub={`${stats?.quotes ?? 0} ${t('admin.quotes')}`} />
            <StatCard
              icon={ClipboardList}
              label={t('admin.gmv')}
              tone="success"
              value={
                <>
                  <span className="me-1 text-base font-bold">{t('common.currency')}</span>
                  {formatMoney(stats?.gmv ?? 0, { compact: true })}
                </>
              }
              sub={`${t('admin.commission')}: ${formatMoney(stats?.commission ?? 0, { compact: true })}`}
            />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title={t('verification.queue')}
            actionTo="/admin/verification"
            actionLabel={t('dashboard.viewAll')}
          />
          <div className="border-t border-line">
            {data?.pendingVerifications?.length ? (
              data.pendingVerifications.map((s) => (
                <div key={s._id} className="flex flex-wrap items-center gap-3 border-b border-line/70 px-5 py-3.5 last:border-0">
                  <Avatar src={s.logo} name={pick(s)} size={34} />
                  <div className="min-w-[140px] flex-1">
                    <p className="truncate text-sm font-bold text-ink">{pick(s)}</p>
                    <p className="text-xs text-slate-500">{s.location?.city}</p>
                  </div>
                  <Badge tone="neutral" size="xs">{s.documentCount} docs</Badge>
                  <StatusBadge status={s.status} size="xs" />
                  <Button as={Link} to="/admin/verification" size="xs" variant="soft">
                    {t('common.view')}
                  </Button>
                </div>
              ))
            ) : (
              <EmptyState title={t('verification.noQueue')} className="py-10" />
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title={t('admin.rfqByStatus')} />
            <div className="border-t border-line p-5">
              {data?.rfqByStatus?.length ? (
                <ul className="space-y-3">
                  {data.rfqByStatus.map((row) => (
                    <li key={row.status} className="flex items-center justify-between gap-3">
                      <StatusBadge status={row.status} size="xs" />
                      <span className="text-sm font-bold text-ink">{row.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={t('common.noData')} className="py-6" />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title={t('admin.topCategories')} />
            <div className="border-t border-line p-5">
              {data?.topCategories?.length ? (
                <ul className="space-y-3">
                  {data.topCategories.map((c) => (
                    <li key={c._id} className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm text-slate-600">{pick(c)}</span>
                      <span className="text-sm font-bold text-ink">{c.rfqs}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={t('common.noData')} className="py-6" />
              )}
            </div>
          </Card>

          <Link
            to="/admin/commissions"
            className="card flex items-center gap-3 p-5 transition hover:shadow-lift"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink">{t('admin.commissionReport')}</span>
              <span className="block text-xs text-slate-500">
                {t('common.currency')} {formatMoney(stats?.commission ?? 0, { decimals: 0 })}
              </span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-slate-400 rtl-flip" />
          </Link>
        </div>
      </div>
    </>
  );
};
