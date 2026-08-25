import { useState } from 'react';
import { ShieldCheck, Upload, Trash2, FileText, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { supplierApi } from '../../api/endpoints.js';
import { uploadFiles } from '../../api/client.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, StatusBadge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { EmptyState, PageHeader, PageLoader } from '../../components/ui/Misc.jsx';
import { formatDate } from '../../utils/format.js';

const DOC_TYPES = [
  'commercial_registration', 'vat_certificate', 'iban_letter',
  'iso_certificate', 'saudization_certificate', 'zakat_certificate', 'other',
];
const REQUIRED = ['commercial_registration', 'vat_certificate', 'iban_letter'];

/**
 * Vendor Verification — upload commercial registration, VAT, IBAN and
 * accreditations, then submit the profile for admin review.
 */
export const VerificationPage = () => {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'commercial_registration', name: '', number: '', expiresAt: '', url: '' });
  const [uploading, setUploading] = useState(false);

  const { data: supplier, loading, refresh } = useApi(() => supplierApi.me(), []);
  const addDoc = useMutation((payload) => supplierApi.addDocument(payload));
  const removeDoc = useMutation((docId) => supplierApi.removeDocument(docId));
  const submit = useMutation(() => supplierApi.submitVerification());

  if (loading) return <PageLoader />;
  if (!supplier) return null;

  const documents = supplier.documents ?? [];
  const present = new Set(documents.map((d) => d.type));
  const missing = REQUIRED.filter((r) => !present.has(r));

  const pickFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const [attachment] = await uploadFiles('verification', [file]);
      setForm((f) => ({ ...f, url: attachment.url, name: f.name || attachment.name }));
      toast.success(attachment.name);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const save = async () => {
    if (!form.url) return toast.error(t('verification.uploadDocument'));
    try {
      const res = await addDoc.mutate({
        type: form.type,
        name: form.name || t(`verification.types.${form.type}`),
        url: form.url,
        number: form.number,
        expiresAt: form.expiresAt || null,
      });
      toast.success(res.message);
      setOpen(false);
      setForm({ type: 'commercial_registration', name: '', number: '', expiresAt: '', url: '' });
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
    return undefined;
  };

  return (
    <>
      <PageHeader
        title={t('verification.title')}
        subtitle={t('verification.subtitle')}
        actions={
          <>
            <Button variant="soft" icon={Upload} onClick={() => setOpen(true)}>
              {t('verification.uploadDocument')}
            </Button>
            {supplier.status !== 'verified' && supplier.status !== 'under_review' && (
              <Button
                icon={Send}
                loading={submit.loading}
                disabled={missing.length > 0}
                onClick={async () => {
                  try {
                    const res = await submit.mutate();
                    toast.success(res.message);
                    refresh();
                  } catch (err) {
                    toast.error(err.message);
                  }
                }}
              >
                {t('verification.submitForReview')}
              </Button>
            )}
          </>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4 p-5">
          <span
            className={
              supplier.verified
                ? 'grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-success-soft text-success'
                : 'grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-warn-soft text-warn'
            }
          >
            <ShieldCheck size={22} />
          </span>
          <div className="min-w-[200px] flex-1">
            <p className="text-sm text-slate-500">{t('verification.status')}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={supplier.status} />
              {supplier.verifiedAt && (
                <span className="text-xs text-slate-400">{formatDate(supplier.verifiedAt, locale)}</span>
              )}
            </div>
            {supplier.rejectionReason && (
              <p className="mt-2 text-[13px] text-danger">{supplier.rejectionReason}</p>
            )}
          </div>

          {missing.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {missing.map((m) => (
                <Badge key={m} tone="warn">
                  {t(`verification.types.${m}`)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title={t('sidebar.documents')} />
        <div className="border-t border-line">
          {documents.length ? (
            documents.map((doc) => (
              <div key={doc._id} className="flex flex-wrap items-center gap-3 border-b border-line/70 px-5 py-4 last:border-0">
                <FileText size={20} className="shrink-0 text-slate-400" />
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-bold text-ink">{doc.name}</p>
                  <p className="text-xs text-slate-500">
                    {t(`verification.types.${doc.type}`)}
                    {doc.number ? ` · ${doc.number}` : ''}
                    {doc.expiresAt ? ` · ${formatDate(doc.expiresAt, locale)}` : ''}
                  </p>
                  {doc.reviewNote && <p className="mt-1 text-xs text-danger">{doc.reviewNote}</p>}
                </div>
                <StatusBadge status={doc.status} size="xs" />
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] font-semibold text-info hover:underline"
                >
                  {t('common.view')}
                </a>
                {doc.status !== 'verified' && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await removeDoc.mutate(doc._id);
                        toast.success(t('common.delete'));
                        refresh();
                      } catch (err) {
                        toast.error(err.message);
                      }
                    }}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-danger-soft hover:text-danger"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <EmptyState icon={FileText} title={t('common.noData')} body={t('verification.subtitle')} />
          )}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('verification.uploadDocument')}
        footer={
          <>
            <Button variant="soft" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={save} loading={addDoc.loading} disabled={!form.url}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label={t('verification.documentType')}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {DOC_TYPES.map((type) => (
              <option key={type} value={type}>{t(`verification.types.${type}`)}</option>
            ))}
          </Select>
          <Input
            label={t('verification.documentName')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t(`verification.types.${form.type}`)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('verification.documentNumber')}
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
            />
            <Input
              label={t('verification.expiresAt')}
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed border-line px-6 py-7 text-center transition hover:border-navy-300 hover:bg-slate-50">
            <Upload size={20} className="text-slate-400" />
            <span className="text-sm text-slate-500">
              {uploading ? t('common.loading') : form.url || t('rfq.dropFiles')}
            </span>
            <input type="file" className="hidden" onChange={pickFile} accept=".pdf,.png,.jpg,.jpeg" />
          </label>
        </div>
      </Modal>
    </>
  );
};
