import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MapPin, Calendar, Truck, Star, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { orderApi } from '../../api/endpoints.js';
import { selectUser } from '../../store/authSlice.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { Modal, ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Input, Textarea } from '../../components/ui/Field.jsx';
import { Avatar, PageHeader, PageLoader } from '../../components/ui/Misc.jsx';
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table.jsx';
import { OrderProgress } from './OrderProgress.jsx';
import { formatDate, formatMoney } from '../../utils/format.js';

const SCORE_KEYS = ['quality', 'delivery', 'communication', 'pricing'];

/** Purchase order record with its delivery timeline and status actions. */
export const OrderDetailPage = () => {
  const { t, locale, pick } = useI18n();
  const { id } = useParams();
  const user = useSelector(selectUser);
  const isSupplier = user?.role === 'supplier';

  const [shipOpen, setShipOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [shipment, setShipment] = useState({ carrier: '', trackingNumber: '', note: '' });
  const [scores, setScores] = useState({ quality: 5, delivery: 5, communication: 5, pricing: 5 });
  const [comment, setComment] = useState('');

  const { data: po, loading, refresh } = useApi(() => orderApi.get(id), [id]);
  const changeStatus = useMutation((payload) => orderApi.updateStatus(id, payload));
  const review = useMutation((payload) => orderApi.review(id, payload));
  const cancel = useMutation((payload) => orderApi.cancel(id, payload));

  if (loading) return <PageLoader />;
  if (!po) return null;

  const advance = async (status, extra = {}) => {
    try {
      const res = await changeStatus.mutate({ status, ...extra });
      toast.success(res.message);
      setShipOpen(false);
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const counterpart = isSupplier ? po.company : po.supplier;
  const canCancel = ['issued', 'approved', 'processing'].includes(po.status);

  return (
    <>
      <PageHeader
        title={po.poNumber}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge status={po.status} size="xs" />
            {po.rfq && (
              <Link to={`/${user.role}/rfqs/${po.rfq._id}`} className="text-slate-400 hover:text-info">
                · {po.rfq.rfqNumber} — {po.rfq.title}
              </Link>
            )}
          </span>
        }
        actions={
          <>
            {!isSupplier && po.status === 'issued' && (
              <Button onClick={() => advance('approved')} loading={changeStatus.loading}>
                {t('orders.approve')}
              </Button>
            )}
            {isSupplier && po.status === 'approved' && (
              <Button onClick={() => advance('processing')} loading={changeStatus.loading}>
                {t('orders.markProcessing')}
              </Button>
            )}
            {isSupplier && po.status === 'processing' && (
              <Button icon={Truck} onClick={() => setShipOpen(true)}>
                {t('orders.markShipped')}
              </Button>
            )}
            {isSupplier && po.status === 'shipped' && (
              <Button onClick={() => advance('delivered')} loading={changeStatus.loading}>
                {t('orders.markDelivered')}
              </Button>
            )}
            {!isSupplier && po.status === 'delivered' && (
              <Button onClick={() => advance('completed')} loading={changeStatus.loading}>
                {t('orders.complete')}
              </Button>
            )}
            {!isSupplier && ['delivered', 'completed'].includes(po.status) && !po.rated && (
              <Button variant="gold" icon={Star} onClick={() => setRateOpen(true)}>
                {t('orders.rateSupplier')}
              </Button>
            )}
            {canCancel && (
              <Button variant="ghost" icon={XCircle} onClick={() => setCancelOpen(true)}>
                {t('orders.cancel')}
              </Button>
            )}
          </>
        }
      />

      <Card className="mb-4">
        <div className="p-6">
          <OrderProgress status={po.status} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title={t('orders.items')} />
            <div className="border-t border-line">
              <Table>
                <THead>
                  <TH>{t('rfq.itemName')}</TH>
                  <TH align="center">{t('rfq.quantity')}</TH>
                  <TH align="end">{t('quotation.unitPrice')}</TH>
                  <TH align="end">{t('quotation.lineTotal')}</TH>
                </THead>
                <TBody>
                  {po.items.map((item) => (
                    <TR key={item._id}>
                      <TD>
                        <span className="font-medium text-ink">{item.name}</span>
                        {item.brand && <span className="block text-xs text-slate-400">{item.brand}</span>}
                      </TD>
                      <TD align="center">
                        {formatMoney(item.quantity, { decimals: 0 })} {item.unit}
                      </TD>
                      <TD align="end">{formatMoney(item.unitPrice)}</TD>
                      <TD align="end" className="font-semibold text-ink">{formatMoney(item.totalPrice)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <div className="space-y-2 border-t border-line p-5">
              <Line label={t('quotation.subtotal')} value={po.subtotal} currency={po.currency} />
              <Line label={t('quotation.vat', { rate: po.vatRate * 100 })} value={po.vatAmount} currency={po.currency} />
              <div className="flex items-baseline justify-between border-t border-line pt-2.5">
                <span className="text-sm font-bold text-ink">{t('orders.total')}</span>
                <span className="text-lg font-extrabold text-ink">
                  <span className="me-1 text-sm">{po.currency}</span>
                  {formatMoney(po.total)}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('orders.timeline')} />
            <ol className="border-t border-line p-5">
              {po.timeline.map((entry, i) => (
                <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < po.timeline.length - 1 && (
                    <span className="absolute start-[11px] top-6 h-full w-0.5 bg-line" aria-hidden />
                  )}
                  <span className="relative z-10 mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-4 border-white bg-success" />
                  <span>
                    <span className="block text-sm font-bold text-ink">{t(`status.${entry.status}`)}</span>
                    {entry.note && <span className="block text-[13px] text-slate-500">{entry.note}</span>}
                    <span className="mt-0.5 block text-xs text-slate-400">{formatDate(entry.at, locale)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title={isSupplier ? t('orders.buyer') : t('orders.supplier')} />
            <div className="border-t border-line p-5">
              <div className="flex items-center gap-3">
                <Avatar src={counterpart?.logo} name={pick(counterpart)} size={44} />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-ink">{pick(counterpart)}</p>
                  {!isSupplier && po.supplier?.location?.city && (
                    <p className="text-xs text-slate-500">{po.supplier.location.city}</p>
                  )}
                </div>
              </div>
              {!isSupplier && (
                <Button
                  as={Link}
                  to={`/suppliers/${po.supplier?.slug || po.supplier?._id}`}
                  variant="soft"
                  size="sm"
                  className="mt-4 w-full"
                >
                  {t('matching.viewProfile')}
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title={t('orders.expectedDelivery')} />
            <div className="space-y-4 border-t border-line p-5">
              <Fact
                icon={Calendar}
                label={t('orders.expectedDelivery')}
                value={formatDate(po.expectedDeliveryDate, locale)}
              />
              {po.actualDeliveryDate && (
                <Fact
                  icon={Calendar}
                  label={t('status.delivered')}
                  value={formatDate(po.actualDeliveryDate, locale)}
                />
              )}
              <Fact
                icon={MapPin}
                label={t('orders.deliveryAddress')}
                value={`${po.deliveryLocation?.city}, ${po.deliveryLocation?.country}`}
              />
              {po.shipment?.trackingNumber && (
                <Fact
                  icon={Truck}
                  label={t('orders.trackingNumber')}
                  value={`${po.shipment.trackingNumber} · ${po.shipment.carrier}`}
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={shipOpen}
        onClose={() => setShipOpen(false)}
        title={t('orders.markShipped')}
        footer={
          <>
            <Button variant="soft" onClick={() => setShipOpen(false)}>{t('common.cancel')}</Button>
            <Button
              loading={changeStatus.loading}
              onClick={() => advance('shipped', shipment)}
            >
              {t('orders.markShipped')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('orders.carrier')}
            value={shipment.carrier}
            onChange={(e) => setShipment({ ...shipment, carrier: e.target.value })}
            placeholder="Aramex Freight"
          />
          <Input
            label={t('orders.trackingNumber')}
            value={shipment.trackingNumber}
            onChange={(e) => setShipment({ ...shipment, trackingNumber: e.target.value })}
            placeholder="TRK100001"
          />
          <Textarea
            label={t('common.optional')}
            rows={2}
            value={shipment.note}
            onChange={(e) => setShipment({ ...shipment, note: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={rateOpen}
        onClose={() => setRateOpen(false)}
        title={t('orders.rating.title')}
        footer={
          <>
            <Button variant="soft" onClick={() => setRateOpen(false)}>{t('common.cancel')}</Button>
            <Button
              loading={review.loading}
              onClick={async () => {
                try {
                  const res = await review.mutate({ scores, comment });
                  toast.success(res.message);
                  setRateOpen(false);
                  refresh();
                } catch (err) {
                  toast.error(err.message);
                }
              }}
            >
              {t('orders.rating.submit')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {SCORE_KEYS.map((key) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-ink">{t(`orders.rating.${key}`)}</span>
              <span className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScores({ ...scores, [key]: n })}
                    aria-label={`${key} ${n}`}
                  >
                    <Star
                      size={22}
                      className={
                        n <= scores[key] ? 'fill-gold-400 text-gold-400' : 'text-slate-300'
                      }
                    />
                  </button>
                ))}
              </span>
            </div>
          ))}
          <Textarea
            label={t('orders.rating.comment')}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t('orders.cancel')}
        body={po.poNumber}
        confirmLabel={t('orders.cancel')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        loading={cancel.loading}
        onConfirm={async () => {
          try {
            const res = await cancel.mutate({ reason: 'Cancelled by the buyer' });
            toast.success(res.message);
            setCancelOpen(false);
            refresh();
          } catch (err) {
            toast.error(err.message);
          }
        }}
      />
    </>
  );
};

const Line = ({ label, value, currency }) => (
  <div className="flex items-baseline justify-between text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-ink">
      {currency} {formatMoney(value)}
    </span>
  </div>
);

const Fact = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon size={16} className="mt-0.5 shrink-0 text-slate-400" />
    <span className="min-w-0">
      <span className="block text-xs text-slate-400">{label}</span>
      <span className="mt-0.5 block text-sm font-medium text-ink">{value}</span>
    </span>
  </div>
);
