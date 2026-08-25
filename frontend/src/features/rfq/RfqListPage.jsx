import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Plus, Search, FileText } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useDebounced } from '../../hooks/useApi.js';
import { rfqApi } from '../../api/endpoints.js';
import { selectUser } from '../../store/authSlice.js';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { SegmentedControl } from '../../components/ui/Tabs.jsx';
import { EmptyState, PageHeader } from '../../components/ui/Misc.jsx';
import { Table, THead, TH, TBody, TR, TD, Pagination, TableSkeleton } from '../../components/ui/Table.jsx';
import { formatDate, daysUntil } from '../../utils/format.js';

/**
 * My RFQs (buyer) / RFQ Requests (supplier). One component serves both roles;
 * the columns and the row link adapt to who is looking.
 */
export const RfqListPage = () => {
  const { t, locale, pick } = useI18n();
  const user = useSelector(selectUser);
  const isSupplier = user?.role === 'supplier';

  const [status, setStatus] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(term);

  const { data: rfqs, meta, loading } = useApi(
    () => rfqApi.list({ page, limit: 12, ...(status ? { status } : {}), ...(debounced ? { q: debounced } : {}) }),
    [page, status, debounced],
  );

  const filters = isSupplier
    ? [
        { value: '', label: t('common.all') },
        { value: 'published', label: t('status.published') },
        { value: 'quoted', label: t('status.quoted') },
        { value: 'awarded', label: t('status.awarded') },
      ]
    : [
        { value: '', label: t('common.all') },
        { value: 'draft', label: t('status.draft') },
        { value: 'published,quoted', label: t('status.published') },
        { value: 'awarded', label: t('status.awarded') },
        { value: 'closed,cancelled', label: t('status.closed') },
      ];

  const base = isSupplier ? '/supplier/rfqs' : '/buyer/rfqs';

  return (
    <>
      <PageHeader
        title={isSupplier ? t('sidebar.rfqRequests') : t('rfq.myRfqs')}
        actions={
          !isSupplier && (
            <Button as={Link} to="/buyer/rfqs/new" icon={Plus}>
              {t('rfq.newRfq')}
            </Button>
          )
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <SegmentedControl
            options={filters}
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
          />
          <Input
            className="ms-auto w-full sm:w-72"
            icon={Search}
            placeholder={t('rfq.searchRfqs')}
            value={term}
            onChange={(e) => { setTerm(e.target.value); setPage(1); }}
          />
        </div>

        <div className="border-t border-line">
          {loading ? (
            <TableSkeleton cols={6} />
          ) : rfqs?.length ? (
            <Table>
              <THead>
                <TH>{t('rfq.rfqNumber')}</TH>
                <TH>{t('rfq.title')}</TH>
                <TH>{t('rfq.category')}</TH>
                <TH>{t('rfq.deliveryDate')}</TH>
                <TH align="center">{t('rfq.quotesCount')}</TH>
                <TH align="end">{t('rfq.status')}</TH>
              </THead>
              <TBody>
                {rfqs.map((rfq) => {
                  const left = daysUntil(rfq.quotationDeadline ?? rfq.requiredDeliveryDate);
                  return (
                    <TR key={rfq._id}>
                      <TD>
                        <Link to={`${base}/${rfq._id}`} className="font-bold text-navy-800 hover:text-info">
                          {rfq.rfqNumber}
                        </Link>
                      </TD>
                      <TD className="max-w-[280px]">
                        <Link to={`${base}/${rfq._id}`} className="block truncate font-medium text-ink hover:text-info">
                          {rfq.title}
                        </Link>
                        {rfq.projectName && (
                          <span className="block truncate text-xs text-slate-400">{rfq.projectName}</span>
                        )}
                      </TD>
                      <TD>{pick(rfq.category)}</TD>
                      <TD>
                        {formatDate(rfq.requiredDeliveryDate, locale)}
                        {left != null && rfq.status !== 'awarded' && (
                          <span className={left < 0 ? 'block text-xs text-danger' : 'block text-xs text-slate-400'}>
                            {left < 0 ? t('rfq.overdue') : t('rfq.daysLeft', { n: left })}
                          </span>
                        )}
                      </TD>
                      <TD align="center" className="font-semibold text-ink">{rfq.quotesCount}</TD>
                      <TD align="end"><StatusBadge status={rfq.status} size="xs" /></TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          ) : (
            <EmptyState
              icon={FileText}
              title={t('rfq.noRfqs')}
              action={
                !isSupplier && (
                  <Button as={Link} to="/buyer/rfqs/new" size="sm" icon={Plus}>
                    {t('rfq.newRfq')}
                  </Button>
                )
              }
            />
          )}
        </div>

        <div className="border-t border-line">
          <Pagination meta={meta} onChange={setPage} />
        </div>
      </Card>
    </>
  );
};
