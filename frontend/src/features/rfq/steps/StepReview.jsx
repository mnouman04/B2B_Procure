import { useI18n } from '../../../i18n/index.jsx';
import { Radio } from '../../../components/ui/Field.jsx';
import { formatDate, formatMoney } from '../../../utils/format.js';

const Row = ({ label, value }) => (
  <div className="flex flex-wrap justify-between gap-3 border-b border-line/70 py-2.5 last:border-0">
    <span className="text-[13px] text-slate-500">{label}</span>
    <span className="text-[13px] font-semibold text-ink">{value || '—'}</span>
  </div>
);

/** Step 4 — a read-back of everything before the RFQ goes out to suppliers. */
export const StepReview = ({ form, categories, subCategories, invitedCount, setForm }) => {
  const { t, locale, pick } = useI18n();

  const category = categories.find((c) => c._id === form.category);
  const subCategory = subCategories.find((c) => c._id === form.subCategory);
  const estimated = form.items.reduce(
    (sum, i) => sum + (Number(i.targetPrice) || 0) * (Number(i.quantity) || 0),
    0,
  );

  return (
    <div>
      <h2 className="text-lg font-extrabold tracking-tight text-ink">{t('rfq.reviewHeading')}</h2>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-line p-5">
          <h3 className="mb-3 text-[15px] font-bold text-ink">{t('rfq.detailsHeading')}</h3>
          <Row label={t('rfq.title')} value={form.title} />
          <Row label={t('rfq.category')} value={category ? pick(category) : ''} />
          <Row label={t('rfq.subCategory')} value={subCategory ? pick(subCategory) : ''} />
          <Row label={t('rfq.projectLocation')} value={form.projectName} />
          <Row
            label={t('rfq.deliveryLocation')}
            value={form.deliveryLocation.city ? `${form.deliveryLocation.city}, ${form.deliveryLocation.country}` : ''}
          />
          <Row
            label={t('rfq.requiredDeliveryDate')}
            value={formatDate(form.requiredDeliveryDate, locale)}
          />
          <Row
            label={t('rfq.quotationDeadline')}
            value={form.quotationDeadline ? formatDate(form.quotationDeadline, locale) : '—'}
          />
          <Row label={t('rfq.paymentTerms')} value={form.paymentTerms} />
          <Row
            label={t('rfq.estimatedValue')}
            value={estimated ? `${t('common.currency')} ${formatMoney(estimated, { decimals: 0 })}` : '—'}
          />
          <Row
            label={t('rfq.invitedSuppliers')}
            value={invitedCount ? invitedCount : t('rfq.autoInvite')}
          />
        </div>

        <div className="rounded-card border border-line p-5">
          <h3 className="mb-3 text-[15px] font-bold text-ink">{t('rfq.itemsHeading')}</h3>
          <div className="space-y-3">
            {form.items.map((item, i) => (
              <div key={item.key} className="rounded-lg bg-slate-50 p-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-ink">
                    {i + 1}. {item.name || '—'}
                  </p>
                  <p className="text-[13px] font-semibold text-slate-600">
                    {formatMoney(item.quantity || 0, { decimals: 0 })} {item.unit}
                  </p>
                </div>
                {item.specifications.filter((s) => s.key && s.value).length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {item.specifications
                      .filter((s) => s.key && s.value)
                      .map((s, j) => (
                        <li
                          key={j}
                          className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] text-slate-600"
                        >
                          <span className="font-semibold text-ink">{s.key}:</span> {s.value} {s.unit}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {form.notes && (
            <div className="mt-4">
              <p className="text-xs text-slate-400">{t('rfq.additionalNotes')}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{form.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <p className="field-label">{t('rfq.visibility')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Radio
            id="vis-invited"
            name="visibility"
            label={t('rfq.invitedOnly')}
            checked={form.visibility === 'invited'}
            onChange={() => setForm((f) => ({ ...f, visibility: 'invited' }))}
          />
          <Radio
            id="vis-public"
            name="visibility"
            label={t('rfq.publicRfq')}
            checked={form.visibility === 'public'}
            onChange={() => setForm((f) => ({ ...f, visibility: 'public' }))}
          />
        </div>
      </div>
    </div>
  );
};
