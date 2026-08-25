import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ClipboardList, AlertTriangle } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { useApi } from '../../hooks/useApi.js';
import { orderApi } from '../../api/endpoints.js';
import { selectUser } from '../../store/authSlice.js';
import { Card } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { SegmentedControl } from '../../components/ui/Tabs.jsx';
import { Avatar, EmptyState, PageHeader } from '../../components/ui/Misc.jsx';
import { Table, THead, TH, TBody, TR, TD, Pagination, TableSkeleton } from '../../components/ui/Table.jsx';
import { formatDate, formatMoney } from '../../utils/format.js';
import { OrderProgress } from './OrderProgress.jsx';

/**
 * Purchase Orders / Orders & Deliveries.
 * `deliveryView` swaps the table for the tracking-oriented column set.
 */
export const OrderListPage = ({ deliveryView = false }) => {
  const { t, locale, pick } = useI18n();
  const user = useSelector(selectUser);
  const isSupplier = user?.role === 'supplier';

  const [status, setStatus] = useState(deliveryView ? 'approved,processing,shipped,delivered' : '');
  const [page, setPage] = useState(1);

  const { data: orders, meta, loading } = useApi(
    () => orderApi.list({ page, limit: 12, ...(status ? { status } : {}) }),
    [page, status],
  );

  const filters = [
    { value: '', label: t('common.all') },
    { value: 'issued,approved', label: t('status.issued') },
    { value: 'processing', label: t('status.processing') },
    { value: 'shipped', label: t('status.shipped') },
    { value: 'delivered,completed', label: t('status.delivered') },
  ];

  const base = isSupplier ? '/supplier/orders' : '/buyer/orders';

  return (
    <>
      <PageHeader title={deliveryView ? t('orders.ordersDeliveries') : t('orders.purchaseOrders')} />

      <Card>
        <div className="p-4">
          <SegmentedControl options={filters} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
        </div>

        <div className="border-t border-line">
          {loading ? (
            <TableSkeleton cols={6} />
          ) : orders?.length ? (
            <Table>
              <THead>
                <TH>{t('orders.poNumber')}</TH>
                <TH>{isSupplier ? t('orders.buyer') : t('orders.supplier')}</TH>
                {!deliveryView && <TH align="end">{t('orders.total')}</TH>}
                <TH>{t('orders.expectedDelivery')}</TH>
                {deliveryView && <TH>{t('orders.trackingNumber')}</TH>}
                <TH className="w-[190px]">{t('orders.status')}</TH>
              </THead>
              <TBody>
                {orders.map((po) => {
                  const counterpart = isSupplier ? po.company : po.supplier;
                  return (
                    <TR key={po._id}>
                      <TD>
                        <Link to={`${base}/${po._id}`} className="font-bold text-navy-800 hover:text-info">
                          {po.poNumber}
                        </Link>
                        <span className="block text-xs text-slate-400">{po.rfq?.rfqNumber}</span>
                      </TD>
                      <TD>
                        <span className="flex items-center gap-2.5">
                          <Avatar src={counterpart?.logo} name={pick(counterpart)} size={30} />
                          <span className="truncate font-medium text-ink">{pick(counterpart)}</span>
                        </span>
                      </TD>
                      {!deliveryView && (
                        <TD align="end" className="font-bold text-ink">
                          {formatMoney(po.total)}
                          <span className="ms-1 text-xs font-normal text-slate-400">{po.currency}</span>
                        </TD>
                      )}
                      <TD>
                        {formatDate(po.expectedDeliveryDate, locale)}
                        {po.isLate && (
                          <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-danger">
                            <AlertTriangle size={11} />
                            {t('orders.late')}
                          </span>
                        )}
                      </TD>
                      {deliveryView && (
                        <TD className="text-xs">
                          {po.shipment?.trackingNumber ? (
                            <>
                              <span className="font-semibold text-ink">{po.shipment.trackingNumber}</span>
                              <span className="block text-slate-400">{po.shipment.carrier}</span>
                            </>
                          ) : (
                            '—'
                          )}
                        </TD>
                      )}
                      <TD>
                        <StatusBadge status={po.status} size="xs" />
                        <OrderProgress status={po.status} className="mt-2" compact />
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          ) : (
            <EmptyState icon={ClipboardList} title={t('orders.noOrders')} />
          )}
        </div>

        <div className="border-t border-line">
          <Pagination meta={meta} onChange={setPage} />
        </div>
      </Card>
    </>
  );
};
