import { Plus, Trash2, Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../../i18n/index.jsx';
import { Input, Select, Textarea } from '../../../components/ui/Field.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { uploadFiles } from '../../../api/client.js';

/**
 * Step 2 — Items & Specifications.
 *
 * Each item carries its own key/value spec rows, which is what the matching
 * engine and the "Quality Compliance" column in Compare Quotations read.
 */
export const StepItems = ({ form, setForm, errors, units, newItem }) => {
  const { t } = useI18n();

  const updateItem = (index, patch) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));

  const updateSpec = (itemIndex, specIndex, patch) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              specifications: item.specifications.map((s, j) =>
                j === specIndex ? { ...s, ...patch } : s,
              ),
            }
          : item,
      ),
    }));

  const addSpec = (itemIndex) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((item, i) =>
        i === itemIndex
          ? { ...item, specifications: [...item.specifications, { key: '', value: '', unit: '' }] }
          : item,
      ),
    }));

  const removeSpec = (itemIndex, specIndex) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((item, i) =>
        i === itemIndex
          ? { ...item, specifications: item.specifications.filter((_, j) => j !== specIndex) }
          : item,
      ),
    }));

  const attach = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    try {
      const attachments = await uploadFiles('rfq', files);
      setForm((f) => ({ ...f, attachments: [...f.attachments, ...attachments] }));
      toast.success(`${attachments.length} file(s) uploaded`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight text-ink">{t('rfq.itemsHeading')}</h2>
        <Button
          size="sm"
          variant="soft"
          icon={Plus}
          onClick={() => setForm((f) => ({ ...f, items: [...f.items, newItem()] }))}
        >
          {t('rfq.addItem')}
        </Button>
      </div>

      <div className="mt-5 space-y-4">
        {form.items.map((item, index) => (
          <div key={item.key} className="rounded-card border border-line p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[13px] font-bold text-slate-500">
                {t('rfq.items')} #{index + 1}
              </span>
              {form.items.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }))
                  }
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-danger transition hover:bg-danger-soft"
                >
                  <Trash2 size={13} />
                  {t('rfq.removeItem')}
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                className="sm:col-span-2"
                label={t('rfq.itemName')}
                required
                value={item.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                error={errors[`items.${index}.name`]}
                placeholder="Interlock Paver 8cm"
              />
              <Input
                label={t('rfq.quantity')}
                required
                type="number"
                min="0"
                step="any"
                value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: e.target.value })}
                error={errors[`items.${index}.quantity`]}
                placeholder="10000"
              />
              <Select
                label={t('rfq.unit')}
                value={item.unit}
                onChange={(e) => updateItem(index, { unit: e.target.value })}
              >
                {units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label={t('rfq.targetPrice')}
                type="number"
                min="0"
                step="any"
                value={item.targetPrice}
                onChange={(e) => updateItem(index, { targetPrice: e.target.value })}
                placeholder="18.00"
              />
              <Textarea
                label={t('common.optional')}
                rows={1}
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Extra detail for suppliers"
              />
            </div>

            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[13px] font-bold text-slate-600">{t('rfq.specifications')}</p>
                <button
                  type="button"
                  onClick={() => addSpec(index)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-info hover:text-blue-800"
                >
                  <Plus size={13} />
                  {t('rfq.addSpec')}
                </button>
              </div>

              <div className="space-y-2.5">
                {item.specifications.map((spec, specIndex) => (
                  <div key={specIndex} className="flex items-center gap-2">
                    <input
                      className="field bg-white"
                      placeholder={t('rfq.specName')}
                      value={spec.key}
                      onChange={(e) => updateSpec(index, specIndex, { key: e.target.value })}
                    />
                    <input
                      className="field bg-white"
                      placeholder={t('rfq.specValue')}
                      value={spec.value}
                      onChange={(e) => updateSpec(index, specIndex, { value: e.target.value })}
                    />
                    <input
                      className="field w-24 shrink-0 bg-white"
                      placeholder={t('rfq.specUnit')}
                      value={spec.unit}
                      onChange={(e) => updateSpec(index, specIndex, { unit: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(index, specIndex)}
                      disabled={item.specifications.length === 1}
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-danger disabled:opacity-30"
                      aria-label={t('common.delete')}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RFQ-level attachments — drawings, BoQ, standards. */}
      <div className="mt-5">
        <p className="field-label">{t('rfq.attachments')}</p>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed border-line px-6 py-8 text-center transition hover:border-navy-300 hover:bg-slate-50">
          <Paperclip size={20} className="text-slate-400" />
          <span className="text-sm text-slate-500">{t('rfq.dropFiles')}</span>
          <input type="file" multiple className="hidden" onChange={attach} />
        </label>

        {form.attachments.length > 0 && (
          <ul className="mt-3 space-y-2">
            {form.attachments.map((file, i) => (
              <li
                key={file.url}
                className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                <Paperclip size={14} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-slate-600">{file.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, attachments: f.attachments.filter((_, j) => j !== i) }))
                  }
                  className="rounded p-1 text-slate-400 transition hover:text-danger"
                  aria-label={t('common.delete')}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
