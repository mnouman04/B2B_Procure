import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { catalogApi, quotationApi, rfqApi } from '../../api/endpoints.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PageHeader, PageLoader } from '../../components/ui/Misc.jsx';
import { formatDateInput, formatMoney, toFieldErrors } from '../../utils/format.js';

const VAT_RATE = 0.15;

/**
 * Submit Quotation — the supplier prices each RFQ line, states spec
 * compliance, delivery time, warranty and terms; the totals panel recomputes
 * subtotal, VAT and grand total live.
 */
export const SubmitQuotationPage = () => {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const { data: rfq, loading } = useApi(() => rfqApi.get(id), [id]);
  const { data: reference } = useApi(() => catalogApi.reference(), []);

  const [form, setForm] = useState({
    items: [],
    deliveryDays: '',
    warrantyYears: 1,
    paymentTerms: '30 Days',
    validUntil: formatDateInput(new Date(Date.now() + 30 * 86400000)),
    incoterms: 'DDP',
    discount: 0,
    terms: '',
    notes: '',
  });

  useEffect(() => {
    if (!rfq) return;
    setForm((f) => ({
      ...f,
      items: rfq.items.map((item) => ({
        rfqItemId: item._id,
        name: item.name,
        brand: '',
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.targetPrice ?? '',
        specCompliance: 100,
        notes: '',
      })),
      deliveryDays: f.deliveryDays || '',
    }));
  }, [rfq]);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce(
      (s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0),
      0,
    );
    const net = Math.max(0, subtotal - (Number(form.discount) || 0));
    const vat = net * VAT_RATE;
    return { subtotal, vat, total: net + vat };
  }, [form.items, form.discount]);

  const save = useMutation((status) =>
    quotationApi.create({
      rfq: id,
      items: form.items.map((i) => ({
        rfqItemId: i.rfqItemId,
        name: i.name,
        brand: i.brand,
        quantity: Number(i.quantity),
        unit: i.unit,
        unitPrice: Number(i.unitPrice) || 0,
        specCompliance: Number(i.specCompliance) || 0,
        notes: i.notes,
      })),
      deliveryDays: Number(form.deliveryDays) || 0,
      warrantyYears: Number(form.warrantyYears) || 0,
      paymentTerms: form.paymentTerms,
      validUntil: form.validUntil || null,
      incoterms: form.incoterms,
      discount: Number(form.discount) || 0,
      terms: form.terms,
      notes: form.notes,
      attachments: [],
      status,
    }),
  );

  const updateItem = (index, patch) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));

  const submit = async (status) => {
    const next = {};
    if (!form.deliveryDays || Number(form.deliveryDays) < 1) next.deliveryDays = t('common.required');
    form.items.forEach((item, i) => {
      if (item.unitPrice === '' || Number(item.unitPrice) < 0) next[`items.${i}.unitPrice`] = t('common.required');
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      const res = await save.mutate(status);
      toast.success(res.message);
      navigate('/supplier/quotations');
    } catch (err) {
      setErrors(toFieldErrors(err));
      toast.error(err.message);
    }
  };

  if (loading) return <PageLoader />;
  if (!rfq) return null;

  return (
    <>
      <PageHeader
        title={t('quotation.submitTitle')}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-semibold text-navy-800">{rfq.rfqNumber}</span>
            <span className="text-slate-400">· {rfq.title}</span>
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title={t('quotation.pricing')} />
            <div className="border-t border-line">
              {form.items.map((item, index) => {
                const rfqItem = rfq.items.find((i) => i._id === item.rfqItemId);
                const lineTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);

                return (
                  <div key={item.rfqItemId} className="border-b border-line/70 p-5 last:border-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[15px] font-bold text-ink">{item.name}</p>
                      <p className="text-sm font-semibold text-slate-600">
                        {formatMoney(item.quantity, { decimals: 0 })} {item.unit}
                      </p>
                    </div>

                    {rfqItem?.specifications?.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {rfqItem.specifications.map((s, i) => (
                          <li key={i} className="rounded-full border border-line bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                            <span className="font-semibold text-ink">{s.key}:</span> {s.value} {s.unit}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Input
                        label={t('quotation.unitPrice')}
                        required
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                        error={errors[`items.${index}.unitPrice`]}
                      />
                      <Input
                        label={t('quotation.brand')}
                        value={item.brand}
                        onChange={(e) => updateItem(index, { brand: e.target.value })}
                      />
                      <Input
                        label={t('quotation.specCompliance')}
                        type="number"
                        min="0"
                        max="100"
                        value={item.specCompliance}
                        onChange={(e) => updateItem(index, { specCompliance: e.target.value })}
                      />
                      <div>
                        <p className="field-label">{t('quotation.lineTotal')}</p>
                        <p className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-ink">
                          {t('common.currency')} {formatMoney(lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title={t('quotation.terms')} />
            <div className="grid gap-4 border-t border-line p-5 sm:grid-cols-2">
              <Input
                label={t('quotation.deliveryDays')}
                required
                type="number"
                min="1"
                value={form.deliveryDays}
                onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
                error={errors.deliveryDays}
                placeholder="7"
              />
              <Input
                label={t('quotation.warrantyYears')}
                type="number"
                min="0"
                value={form.warrantyYears}
                onChange={(e) => setForm({ ...form, warrantyYears: e.target.value })}
              />
              <Select
                label={t('quotation.incoterms')}
                value={form.incoterms}
                onChange={(e) => setForm({ ...form, incoterms: e.target.value })}
              >
                {(reference?.incoterms ?? ['DDP']).map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </Select>
              <Select
                label={t('rfq.paymentTerms')}
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
              >
                {(reference?.paymentTerms ?? ['30 Days']).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
              <Input
                label={t('quotation.validUntil')}
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
              <Input
                label={t('quotation.discount')}
                type="number"
                min="0"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
              <Textarea
                className="sm:col-span-2"
                label={t('quotation.terms')}
                rows={3}
                value={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.value })}
                placeholder="Prices include delivery to site. Offloading by the client."
              />
              <Textarea
                className="sm:col-span-2"
                label={t('quotation.notes')}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader title={t('quotation.total')} />
            <div className="space-y-3 border-t border-line p-5">
              <Line label={t('quotation.subtotal')} value={totals.subtotal} />
              {Number(form.discount) > 0 && (
                <Line label={t('quotation.discount')} value={-Number(form.discount)} />
              )}
              <Line label={t('quotation.vat', { rate: VAT_RATE * 100 })} value={totals.vat} />
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-sm font-bold text-ink">{t('quotation.total')}</span>
                <span className="text-lg font-extrabold text-ink">
                  <span className="me-1 text-sm">{t('common.currency')}</span>
                  {formatMoney(totals.total)}
                </span>
              </div>
            </div>
          </Card>

          <div className="mt-4 space-y-2.5">
            <Button
              className="w-full"
              size="lg"
              icon={Send}
              loading={save.loading}
              onClick={() => submit('submitted')}
            >
              {t('quotation.submit')}
            </Button>
            <Button
              className="w-full"
              variant="soft"
              icon={Save}
              loading={save.loading}
              onClick={() => submit('draft')}
            >
              {t('quotation.saveDraft')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

const Line = ({ label, value }) => {
  const { t } = useI18n();
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-ink">
        {t('common.currency')} {formatMoney(value)}
      </span>
    </div>
  );
};
