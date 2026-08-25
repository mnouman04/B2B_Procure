import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Users, GitCompare, Send, XCircle, Trash2, Paperclip, MapPin, Calendar, Package, Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { rfqApi } from '../../api/endpoints.js';
import { selectUser } from '../../store/authSlice.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, StatusBadge } from '../../components/ui/Badge.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Avatar, PageHeader, PageLoader } from '../../components/ui/Misc.jsx';
import { formatDate, formatMoney } from '../../utils/format.js';

/** Full RFQ record, with the actions available to whichever role is viewing. */
export const RfqDetailPage = () => {
  const { t, locale, pick } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isSupplier = user?.role === 'supplier';
  const [confirm, setConfirm] = useState(null);

  const { data: rfq, loading, refresh } = useApi(() => rfqApi.get(id), [id]);
  const publish = useMutation(() => rfqApi.publish(id, { autoInviteLimit: 12 }));
  const close = useMutation(() => rfqApi.close(id));
  const remove = useMutation(() => rfqApi.remove(id));

  if (loading) return <PageLoader />;
  if (!rfq) return null;

  const isDraft = rfq.status === 'draft';
  const canQuote = isSupplier && ['published', 'quoted'].includes(rfq.status);

  const run = async (mutation, after) => {
    try {
      const res = await mutation.mutate();
      toast.success(res.message);
      setConfirm(null);
      if (after) after(res);
      else refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title={rfq.title}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-semibold text-navy-800">{rfq.rfqNumber}</span>
            <StatusBadge status={rfq.status} size="xs" />
            {rfq.projectName && <span className="text-slate-400">· {rfq.projectName}</span>}
          </span>
        }
        actions={
          <>
            {!isSupplier && isDraft && (
              <>
                <Button as={Link} to={`/buyer/rfqs/${id}/edit`} variant="soft" icon={Pencil}>
                  {t('common.edit')}
                </Button>
                <Button as={Link} to={`/buyer/rfqs/${id}/matches`} variant="soft" icon={Users}>
                  {t('matching.title')}
                </Button>
                <Button icon={Send} onClick={() => setConfirm('publish')}>
                  {t('rfq.publish')}
                </Button>
                <Button variant="ghost" icon={Trash2} onClick={() => setConfirm('delete')} aria-label={t('common.delete')} />
              </>
            )}
            {!isSupplier && !isDraft && (
              <>
                <Button as={Link} to={`/buyer/rfqs/${id}/matches`} variant="soft" icon={Users}>
                  {t('matching.title')}
                </Button>
                <Button as={Link} to={`/buyer/rfqs/${id}/compare`} icon={GitCompare}>
                  {t('compare.title')} ({rfq.quotesCount})
                </Button>
                {['published', 'quoted'].includes(rfq.status) && (
                  <Button variant="ghost" icon={XCircle} onClick={() => setConfirm('close')}>
                    {t('rfq.closeRfq')}
                  </Button>
                )}
              </>
            )}
            {canQuote && (
              <Button as={Link} to={`/supplier/rfqs/${id}/quote`} icon={Send}>
                {t('quotation.submitTitle')}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title={t('rfq.itemsHeading')} />
            <div className="border-t border-line">
              {rfq.items.map((item, index) => (
                <div key={item._id} className="border-b border-line/70 p-5 last:border-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[15px] font-bold text-ink">
                      {index + 1}. {item.name}
                    </p>
                    <p className="text-sm font-semibold text-slate-600">
                      {formatMoney(item.quantity, { decimals: 0 })} {item.unit}
                      {item.targetPrice ? (
                        <span className="ms-2 text-xs font-normal text-slate-400">
                          {t('rfq.targetPrice')}: {t('common.currency')} {formatMoney(item.targetPrice)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  {item.description && <p className="mt-1 text-[13px] text-slate-500">{item.description}</p>}
                  {item.specifications?.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {item.specifications.map((s, i) => (
                        <li key={i} className="rounded-full border border-line bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                          <span className="font-semibold text-ink">{s.key}:</span> {s.value} {s.unit}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {rfq.notes && (
            <Card>
              <CardHeader title={t('rfq.additionalNotes')} />
              <div className="border-t border-line p-5 text-[14px] leading-relaxed text-slate-600">
                {rfq.notes}
              </div>
            </Card>
          )}

          {rfq.attachments?.length > 0 && (
            <Card>
              <CardHeader title={t('rfq.attachments')} />
              <div className="border-t border-line p-5">
                <ul className="space-y-2">
                  {rfq.attachments.map((file) => (
                    <li key={file.url}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                      >
                        <Paperclip size={14} className="shrink-0 text-slate-400" />
                        <span className="truncate">{file.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title={t('rfq.summary')} />
            <div className="space-y-4 border-t border-line p-5">
              <Fact icon={Package} label={t('rfq.category')} value={pick(rfq.category)} />
              {rfq.subCategory && <Fact icon={Package} label={t('rfq.subCategory')} value={pick(rfq.subCategory)} />}
              <Fact
                icon={MapPin}
                label={t('rfq.deliveryLocation')}
                value={`${rfq.deliveryLocation.city}, ${rfq.deliveryLocation.country}`}
              />
              <Fact
                icon={Calendar}
                label={t('rfq.requiredDeliveryDate')}
                value={formatDate(rfq.requiredDeliveryDate, locale)}
              />
              {rfq.quotationDeadline && (
                <Fact
                  icon={Calendar}
                  label={t('rfq.quotationDeadline')}
                  value={formatDate(rfq.quotationDeadline, locale)}
                />
              )}
              <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                <Badge tone="neutral">{t('rfq.paymentTerms')}: {rfq.paymentTerms}</Badge>
                {rfq.warrantyRequired > 0 && (
                  <Badge tone="neutral">{t('compare.warranty')}: {rfq.warrantyRequired}</Badge>
                )}
                <Badge tone={rfq.visibility === 'public' ? 'info' : 'navy'}>
                  {rfq.visibility === 'public' ? t('rfq.publicRfq') : t('rfq.invitedOnly')}
                </Badge>
              </div>
            </div>
          </Card>

          {!isSupplier && rfq.invitedSuppliers?.length > 0 && (
            <Card>
              <CardHeader title={`${t('rfq.invitedSuppliers')} (${rfq.invitedSuppliers.length})`} />
              <div className="border-t border-line">
                {rfq.invitedSuppliers.slice(0, 8).map((invite) => (
                  <div key={invite._id ?? invite.supplier} className="flex items-center gap-3 border-b border-line/70 px-5 py-3 last:border-0">
                    <Avatar name={String(invite.supplier).slice(-2)} size={28} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-slate-600">
                      {invite.viewedAt ? t('common.view') : t('matching.invited')}
                    </span>
                    <span className="text-[13px] font-bold text-success">{invite.matchScore}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'publish'}
        onClose={() => setConfirm(null)}
        title={t('rfq.publish')}
        body={t('rfq.autoInvite')}
        confirmLabel={t('rfq.publish')}
        cancelLabel={t('common.cancel')}
        loading={publish.loading}
        onConfirm={() => run(publish)}
      />
      <ConfirmDialog
        open={confirm === 'close'}
        onClose={() => setConfirm(null)}
        title={t('rfq.closeRfq')}
        body={t('compare.noQuotes')}
        confirmLabel={t('rfq.closeRfq')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        loading={close.loading}
        onConfirm={() => run(close)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        title={t('rfq.deleteRfq')}
        body={`${rfq.rfqNumber} — ${rfq.title}`}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        loading={remove.loading}
        onConfirm={() => run(remove, () => navigate('/buyer/rfqs'))}
      />
    </>
  );
};

const Fact = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon size={16} className="mt-0.5 shrink-0 text-slate-400" />
    <span className="min-w-0">
      <span className="block text-xs text-slate-400">{label}</span>
      <span className="mt-0.5 block text-sm font-medium text-ink">{value}</span>
    </span>
  </div>
);
