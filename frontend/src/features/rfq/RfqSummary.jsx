import { useI18n } from '../../i18n/index.jsx';
import { formatDate } from '../../utils/format.js';

const Row = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-400">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-ink">{value || '—'}</p>
  </div>
);

/**
 * The grey "RFQ Summary" panel from the Create RFQ mockup — updates live as
 * the buyer types, so they can see the shape of the request being built.
 */
export const RfqSummary = ({ form, categories, subCategories }) => {
  const { t, locale, pick } = useI18n();

  const category = categories.find((c) => c._id === form.category);
  const subCategory = subCategories.find((c) => c._id === form.subCategory);
  const itemCount = form.items.filter((i) => i.name.trim()).length;

  return (
    <div className="rounded-card border border-line bg-slate-50/80 p-5">
      <h3 className="text-[15px] font-bold text-ink">{t('rfq.summary')}</h3>
      <div className="mt-4 space-y-4">
        <Row label={t('rfq.category')} value={category ? pick(category) : ''} />
        <Row label={t('rfq.subCategory')} value={subCategory ? pick(subCategory) : ''} />
        <Row
          label={t('rfq.deliveryLocation')}
          value={
            form.deliveryLocation.city
              ? `${form.deliveryLocation.city}, ${form.deliveryLocation.country}`
              : ''
          }
        />
        <Row
          label={t('rfq.requiredDeliveryDate')}
          value={form.requiredDeliveryDate ? formatDate(form.requiredDeliveryDate, locale) : ''}
        />
        <Row
          label={t('rfq.items')}
          value={itemCount ? `${itemCount} ${t('rfq.items')}` : ''}
        />
      </div>
    </div>
  );
};
