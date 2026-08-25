import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { quotationApi } from '../../api/endpoints.js';
import { selectUser } from '../../store/authSlice.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { SegmentedControl } from '../../components/ui/Tabs.jsx';
import { Avatar, EmptyState, PageHeader, Rating } from '../../components/ui/Misc.jsx';
import { Table, THead, TH, TBody, TR, TD, Pagination, TableSkeleton } from '../../components/ui/Table.jsx';
import { formatDate, formatMoney } from '../../utils/format.js';

/**
 * "Quotes Received" for buyers and "My Quotations" for suppliers.
 * Buyers can shortlist or reject inline; suppliers can withdraw a live offer.
 */
export const QuotationListPage = () => {
  const { t, locale, pick } = useI18n();
  const user = useSelector(selectUser);
  const isSupplier = user?.role === 'supplier';

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data: quotes, meta, loading, refresh } = useApi(
    () => quotationApi.list({ page, limit: 12, ...(status ? { status } : {}) }),
    [page, status],
  );

  const act = useMutation(async ({ action, id }) => {
    if (action === 'shortlist') return quotationApi.shortlist(id);
    if (action === 'withdraw') return quotationApi.withdraw(id);
    return quotationApi.reject(id, { reason: 'Another offer was selected' });
  });

  const run = async (action, id) => {
    try {
      const res = await act.mutate({ action, id });
      toast.success(res.message);
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filters = [
    { value: '', label: t('common.all') },
    { value: 'submitted', label: t('status.submitted') },
    { value: 'shortlisted', label: t('status.shortlisted') },
    { value: 'accepted', label: t('status.accepted') },
    { value: 'rejected', label: t('status.rejected') },
  ];
  if (isSupplier) filters.splice(1, 0, { value: 'draft', label: t('status.draft') });

  return (
    <>
      <PageHeader title={isSupplier ? t('quotation.myQuotations') : t('quotation.quotesReceived')} />

      <Card>
        <div className="p-4">
          <SegmentedControl options={filters} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
        </div>

        <div className="border-t border-line">
          {loading ? (
            <TableSkeleton cols={6} />
          ) : quotes?.length ? (
            <Table>
              <THead>
                <TH>{t('quotation.quoteNumber')}</TH>
                <TH>{isSupplier ? t('rfq.title') : t('orders.supplier')}</TH>
                <TH align="end">{t('compare.totalPrice', { currency: t('common.currency') })}</TH>
                <TH align="center">{t('compare.deliveryTime')}</TH>
                <TH align="center">{t('compare.matchScore')}</TH>
                <TH align="end">{t('rfq.status')}</TH>
                <TH align="end">{t('compare.action')}</TH>
              </THead>
              <TBody>
                {quotes.map((q) => (
                  <TR key={q._id}>
                    <TD>
                      <span className="font-bold text-navy-800">{q.quoteNumber}</span>
                      <span className="block text-xs text-slate-400">{formatDate(q.submittedAt ?? q.createdAt, locale)}</span>
                    </TD>
                    <TD className="max-w-[260px]">
                      {isSupplier ? (
                        <Link to={`/supplier/rfqs/${q.rfq?._id}`} className="block truncate font-medium text-ink hover:text-info">
                          {q.rfq?.title}
                          <span className="block text-xs font-normal text-slate-400">{q.rfq?.rfqNumber}</span>
                        </Link>
                      ) : (
                        <span className="flex items-center gap-2.5">
                          <Avatar src={q.supplier?.logo} name={pick(q.supplier)} size={30} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-ink">{pick(q.supplier)}</span>
                            <Rating value={q.supplier?.rating?.average} count={q.supplier?.rating?.count} />
                          </span>
                        </span>
                      )}
                    </TD>
                    <TD align="end" className="font-bold text-ink">{formatMoney(q.totalPrice)}</TD>
                    <TD align="center">{t('compare.days', { n: q.deliveryDays })}</TD>
                    <TD align="center" className="font-semibold text-success">{q.matchScore}%</TD>
                    <TD align="end"><StatusBadge status={q.status} size="xs" /></TD>
                    <TD align="end">
                      <span className="inline-flex gap-1.5">
                        {!isSupplier && q.status === 'submitted' && (
                          <>
                            <Button size="xs" variant="soft" onClick={() => run('shortlist', q._id)}>
                              {t('quotation.shortlist')}
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => run('reject', q._id)}>
                              {t('quotation.reject')}
                            </Button>
                          </>
                        )}
                        {!isSupplier && q.rfq?._id && (
                          <Button as={Link} to={`/buyer/rfqs/${q.rfq._id}/compare`} size="xs" variant="soft">
                            {t('compare.title')}
                          </Button>
                        )}
                        {isSupplier && ['submitted', 'shortlisted'].includes(q.status) && (
                          <Button size="xs" variant="ghost" onClick={() => run('withdraw', q._id)}>
                            {t('quotation.withdraw')}
                          </Button>
                        )}
                      </span>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState icon={Inbox} title={isSupplier ? t('quotation.noQuotes') : t('compare.noQuotes')} />
          )}
        </div>

        <div className="border-t border-line">
          <Pagination meta={meta} onChange={setPage} />
        </div>
      </Card>
    </>
  );
};
