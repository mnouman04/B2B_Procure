import { useSelector } from 'react-redux';
import { Building2, MapPin, Hash, Briefcase, Users, Globe } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { selectUser } from '../../store/authSlice.js';
import { Card, CardHeader, StatCard } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { Avatar, PageHeader } from '../../components/ui/Misc.jsx';
import { formatMoney } from '../../utils/format.js';

/** Read-only company record for the buying organisation. */
export const CompanyProfilePage = () => {
  const { t, pick } = useI18n();
  const user = useSelector(selectUser);
  const company = user?.company;

  if (!company) return null;

  const facts = [
    { icon: Hash, label: t('auth.crNumber'), value: company.crNumber },
    { icon: Hash, label: t('auth.vatNumber'), value: company.vatNumber || '—' },
    { icon: Briefcase, label: t('auth.sector'), value: company.sector },
    { icon: Users, label: t('auth.companySize'), value: company.size },
    {
      icon: MapPin,
      label: t('auth.address'),
      value: `${company.address?.city ?? ''}, ${company.address?.country ?? ''}`,
    },
    { icon: Globe, label: t('auth.website'), value: company.website || '—' },
  ];

  return (
    <>
      <PageHeader title={t('sidebar.companyProfile')} />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-5 p-6">
          <Avatar src={company.logo} name={pick(company)} size={64} />
          <div className="min-w-[200px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-ink">{pick(company)}</h2>
              <StatusBadge status={company.status} size="xs" />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {company.sector} · {company.address?.city}
            </p>
          </div>
          <Building2 size={28} className="text-slate-300" />
        </div>
      </Card>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('rfq.myRfqs')} value={company.stats?.rfqCount ?? 0} />
        <StatCard label={t('analytics.totalOrders')} value={company.stats?.orderCount ?? 0} />
        <StatCard
          label={t('analytics.totalSpend')}
          value={<><span className="me-1 text-base font-bold">{t('common.currency')}</span>{formatMoney(company.stats?.totalSpend ?? 0, { compact: true })}</>}
        />
        <StatCard
          label={t('analytics.savings')}
          tone="success"
          value={<><span className="me-1 text-base font-bold">{t('common.currency')}</span>{formatMoney(company.stats?.savings ?? 0, { compact: true })}</>}
        />
      </div>

      <Card>
        <CardHeader title={t('auth.companyDetails')} />
        <div className="grid gap-5 border-t border-line p-5 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="flex items-start gap-3">
              <f.icon size={17} className="mt-0.5 shrink-0 text-slate-400" />
              <span className="min-w-0">
                <span className="block text-xs text-slate-400">{f.label}</span>
                <span className="mt-0.5 block truncate text-sm font-medium text-ink">{f.value}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};
