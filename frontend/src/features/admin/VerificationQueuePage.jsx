import { useState } from 'react';
import { ShieldCheck, FileText, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { adminApi, supplierApi } from '../../api/endpoints.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Textarea } from '../../components/ui/Field.jsx';
import { Avatar, EmptyState, PageHeader, Skeleton } from '../../components/ui/Misc.jsx';
import { Pagination } from '../../components/ui/Table.jsx';
import { formatDate } from '../../utils/format.js';

/**
 * Vendor Verification queue. The admin reviews the uploaded commercial
 * registration, VAT, IBAN and accreditations, then approves or rejects.
 */
export const VerificationQueuePage = () => {
  const { t, locale, pick } = useI18n();
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  const { data: suppliers, meta, loading, refresh } = useApi(
    () => adminApi.verificationQueue({ page, limit: 10 }),
    [page],
  );
  const decide = useMutation(({ id, payload }) => supplierApi.decideVerification(id, payload));

  const approve = async (supplier) => {
    try {
      const res = await decide.mutate({
        id: supplier._id,
        payload: {
          status: 'verified',
          documentDecisions: (supplier.documents ?? []).map((d) => ({ documentId: d._id, status: 'verified' })),
        },
      });
      toast.success(res.message);
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const reject = async () => {
    try {
      const res = await decide.mutate({
        id: rejecting._id,
        payload: { status: 'rejected', reason },
      });
      toast.success(res.message);
      setRejecting(null);
      setReason('');
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title={t('verification.queue')} />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[200px]" />)}
        </div>
      ) : suppliers?.length ? (
        <div className="space-y-4">
          {suppliers.map((supplier) => (
            <Card key={supplier._id}>
              <div className="flex flex-wrap items-start gap-4 p-5">
                <Avatar src={supplier.logo} name={pick(supplier)} size={52} />
                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-bold text-ink">{pick(supplier)}</p>
                    <StatusBadge status={supplier.status} size="xs" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    CR {supplier.crNumber} · {supplier.location?.city} · {pick(supplier.primaryCategory)}
                  </p>
                  {supplier.owner && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {supplier.owner.firstName} {supplier.owner.lastName} · {supplier.owner.email}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    icon={Check}
                    loading={decide.loading}
                    onClick={() => approve(supplier)}
                  >
                    {t('verification.approve')}
                  </Button>
                  <Button size="sm" variant="soft" icon={X} onClick={() => setRejecting(supplier)}>
                    {t('verification.reject')}
                  </Button>
                </div>
              </div>

              <CardHeader title={t('sidebar.documents')} className="border-t border-line" />
              <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
                {(supplier.documents ?? []).length ? (
                  supplier.documents.map((doc) => (
                    <a
                      key={doc._id}
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 transition hover:bg-slate-50"
                    >
                      <FileText size={17} className="shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-ink">
                          {t(`verification.types.${doc.type}`)}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {doc.number || formatDate(doc.uploadedAt, locale)}
                        </span>
                      </span>
                      <StatusBadge status={doc.status} size="xs" />
                    </a>
                  ))
                ) : (
                  <p className="text-[13px] text-slate-400">{t('common.noData')}</p>
                )}
              </div>
            </Card>
          ))}

          <Card>
            <Pagination meta={meta} onChange={setPage} />
          </Card>
        </div>
      ) : (
        <Card>
          <EmptyState icon={ShieldCheck} title={t('verification.noQueue')} />
        </Card>
      )}

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title={t('verification.reject')}
        subtitle={rejecting ? pick(rejecting) : ''}
        footer={
          <>
            <Button variant="soft" onClick={() => setRejecting(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={reject} loading={decide.loading} disabled={!reason.trim()}>
              {t('verification.reject')}
            </Button>
          </>
        }
      >
        <Textarea
          label={t('quotation.rejectReason')}
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>
    </>
  );
};
