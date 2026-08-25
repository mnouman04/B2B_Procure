import { useI18n } from '../../../i18n/index.jsx';
import { Input, Select, Textarea } from '../../../components/ui/Field.jsx';

/** Step 1 — RFQ Details, matching the field order in the mockup. */
export const StepDetails = ({ form, setForm, errors, categories, subCategories, reference }) => {
  const { t, pick } = useI18n();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setLocation = (key) => (e) =>
    setForm((f) => ({ ...f, deliveryLocation: { ...f.deliveryLocation, [key]: e.target.value } }));

  return (
    <div>
      <h2 className="text-lg font-extrabold tracking-tight text-ink">{t('rfq.detailsHeading')}</h2>

      <div className="mt-5 space-y-4">
        <Input
          label={t('rfq.title')}
          required
          value={form.title}
          onChange={set('title')}
          error={errors.title}
          placeholder={t('rfq.titlePlaceholder')}
        />

        <Select
          label={t('rfq.category')}
          required
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subCategory: '' }))}
          error={errors.category}
          placeholder={t('rfq.category')}
        >
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{pick(c)}</option>
          ))}
        </Select>

        <Select
          label={t('rfq.subCategory')}
          value={form.subCategory}
          onChange={set('subCategory')}
          placeholder={t('rfq.subCategory')}
          disabled={!subCategories.length}
        >
          {subCategories.map((c) => (
            <option key={c._id} value={c._id}>{pick(c)}</option>
          ))}
        </Select>

        <Input
          label={t('rfq.projectLocation')}
          required
          value={form.projectName}
          onChange={set('projectName')}
          placeholder={t('rfq.projectPlaceholder')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('rfq.deliveryLocation')}
            required
            value={form.deliveryLocation.city}
            onChange={setLocation('city')}
            error={errors['deliveryLocation.city']}
            placeholder={t('auth.city')}
          >
            {(reference?.cities ?? []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Input
            label={t('auth.address')}
            value={form.deliveryLocation.address}
            onChange={setLocation('address')}
            placeholder="Site / gate details"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('rfq.requiredDeliveryDate')}
            required
            type="date"
            value={form.requiredDeliveryDate}
            onChange={set('requiredDeliveryDate')}
            error={errors.requiredDeliveryDate}
            min={new Date().toISOString().slice(0, 10)}
          />
          <Input
            label={t('rfq.quotationDeadline')}
            type="date"
            value={form.quotationDeadline}
            onChange={set('quotationDeadline')}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label={t('rfq.budget')}
            type="number"
            min="0"
            value={form.budget}
            onChange={set('budget')}
            placeholder="0.00"
          />
          <Select label={t('rfq.paymentTerms')} value={form.paymentTerms} onChange={set('paymentTerms')}>
            {(reference?.paymentTerms ?? ['30 Days']).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
          <Input
            label={t('rfq.warranty')}
            type="number"
            min="0"
            value={form.warrantyRequired}
            onChange={set('warrantyRequired')}
          />
        </div>

        <Textarea
          label={t('rfq.additionalNotes')}
          rows={3}
          value={form.notes}
          onChange={set('notes')}
          placeholder={t('rfq.notesPlaceholder')}
        />
      </div>
    </div>
  );
};
