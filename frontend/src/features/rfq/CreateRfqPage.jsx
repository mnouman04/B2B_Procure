import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, X, Save, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { catalogApi, rfqApi } from '../../api/endpoints.js';
import { Card } from '../../components/ui/Card.jsx';
import { Stepper } from '../../components/ui/Stepper.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PageLoader } from '../../components/ui/Misc.jsx';
import { StepDetails } from './steps/StepDetails.jsx';
import { StepItems } from './steps/StepItems.jsx';
import { StepSuppliers } from './steps/StepSuppliers.jsx';
import { StepReview } from './steps/StepReview.jsx';
import { RfqSummary } from './RfqSummary.jsx';
import { formatDateInput, toFieldErrors } from '../../utils/format.js';

const emptyItem = () => ({
  key: crypto.randomUUID(),
  name: '',
  description: '',
  quantity: '',
  unit: 'pcs',
  targetPrice: '',
  specifications: [{ key: '', value: '', unit: '' }],
  attachments: [],
});

const blankForm = () => ({
  title: '',
  category: '',
  subCategory: '',
  projectName: '',
  deliveryLocation: { city: '', region: '', country: 'Saudi Arabia', address: '' },
  requiredDeliveryDate: '',
  quotationDeadline: '',
  notes: '',
  budget: '',
  paymentTerms: '30 Days',
  warrantyRequired: 0,
  visibility: 'invited',
  items: [emptyItem()],
  attachments: [],
});

/**
 * Create RFQ — the four-step wizard from the mockup.
 *
 * Step 1 shows the live "RFQ Summary" panel on the right; steps 2–4 widen to
 * full width because their content needs the room.
 */
export const CreateRfqPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState({});
  const [invited, setInvited] = useState([]);
  const [strategy, setStrategy] = useState('best_match');
  const [savedId, setSavedId] = useState(null);

  const { data: categories } = useApi(() => catalogApi.categories(), []);
  const { data: reference } = useApi(() => catalogApi.reference(), []);
  const { loading: loadingDraft } = useApi(
    async () => {
      if (!isEdit) return null;
      const res = await rfqApi.get(id);
      const rfq = res.data;
      setSavedId(rfq._id);
      setForm({
        title: rfq.title,
        category: rfq.category?._id ?? rfq.category ?? '',
        subCategory: rfq.subCategory?._id ?? rfq.subCategory ?? '',
        projectName: rfq.projectName ?? '',
        deliveryLocation: {
          city: rfq.deliveryLocation?.city ?? '',
          region: rfq.deliveryLocation?.region ?? '',
          country: rfq.deliveryLocation?.country ?? 'Saudi Arabia',
          address: rfq.deliveryLocation?.address ?? '',
        },
        requiredDeliveryDate: formatDateInput(rfq.requiredDeliveryDate),
        quotationDeadline: formatDateInput(rfq.quotationDeadline),
        notes: rfq.notes ?? '',
        budget: rfq.budget ?? '',
        paymentTerms: rfq.paymentTerms ?? '30 Days',
        warrantyRequired: rfq.warrantyRequired ?? 0,
        visibility: rfq.visibility ?? 'invited',
        items: (rfq.items ?? []).map((i) => ({
          key: i._id,
          name: i.name,
          description: i.description ?? '',
          quantity: i.quantity,
          unit: i.unit,
          targetPrice: i.targetPrice ?? '',
          specifications: i.specifications?.length ? i.specifications : [{ key: '', value: '', unit: '' }],
          attachments: i.attachments ?? [],
        })),
        attachments: rfq.attachments ?? [],
      });
      return res;
    },
    [id],
    { immediate: isEdit },
  );

  const steps = [
    { key: 'details', label: t('rfq.steps.details') },
    { key: 'items', label: t('rfq.steps.items') },
    { key: 'suppliers', label: t('rfq.steps.suppliers') },
    { key: 'review', label: t('rfq.steps.review') },
  ];

  const subCategories = useMemo(() => {
    const parent = (categories ?? []).find((c) => c._id === form.category);
    return parent?.children ?? [];
  }, [categories, form.category]);

  const payload = useMemo(
    () => ({
      title: form.title,
      category: form.category,
      subCategory: form.subCategory || null,
      projectName: form.projectName,
      deliveryLocation: form.deliveryLocation,
      requiredDeliveryDate: form.requiredDeliveryDate,
      quotationDeadline: form.quotationDeadline || null,
      notes: form.notes,
      budget: form.budget === '' ? null : Number(form.budget),
      paymentTerms: form.paymentTerms,
      warrantyRequired: Number(form.warrantyRequired) || 0,
      visibility: form.visibility,
      attachments: form.attachments,
      items: form.items.map((i) => ({
        name: i.name,
        description: i.description,
        quantity: Number(i.quantity) || 0,
        unit: i.unit,
        targetPrice: i.targetPrice === '' ? null : Number(i.targetPrice),
        attachments: i.attachments,
        specifications: i.specifications.filter((s) => s.key.trim() && s.value.trim()),
      })),
    }),
    [form],
  );

  const save = useMutation(async (status) => {
    const body = { ...payload, status };
    if (savedId) return rfqApi.update(savedId, body);
    return rfqApi.create(body);
  });

  const publish = useMutation((rfqId) =>
    rfqApi.publish(rfqId, {
      supplierIds: invited,
      strategy,
      autoInviteLimit: 12,
      quotationDeadline: form.quotationDeadline || null,
    }),
  );

  const validateStep = (index) => {
    const next = {};
    if (index === 0) {
      if (!form.title.trim()) next.title = t('common.required');
      if (!form.category) next.category = t('common.required');
      if (!form.deliveryLocation.city) next['deliveryLocation.city'] = t('common.required');
      if (!form.requiredDeliveryDate) next.requiredDeliveryDate = t('common.required');
    }
    if (index === 1) {
      form.items.forEach((item, i) => {
        if (!item.name.trim()) next[`items.${i}.name`] = t('common.required');
        if (!item.quantity || Number(item.quantity) <= 0) next[`items.${i}.quantity`] = t('common.required');
      });
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /** Persists the draft so the matching step has a real RFQ id to score against. */
  const persistDraft = async () => {
    const res = await save.mutate('draft');
    const rfq = res.data;
    setSavedId(rfq._id);
    return rfq._id;
  };

  const goNext = async () => {
    if (!validateStep(step)) return;
    try {
      if (step === 1) {
        await persistDraft();
      }
      setStep((s) => Math.min(s + 1, steps.length - 1));
    } catch (err) {
      setErrors(toFieldErrors(err));
      toast.error(err.message);
    }
  };

  const saveDraft = async () => {
    if (!validateStep(0)) return;
    try {
      const rfqId = await persistDraft();
      toast.success(t('rfq.saveDraft'));
      navigate(`/buyer/rfqs/${rfqId}`);
    } catch (err) {
      setErrors(toFieldErrors(err));
      toast.error(err.message);
    }
  };

  const publishRfq = async () => {
    try {
      const rfqId = savedId ?? (await persistDraft());
      await save.mutate('draft');
      const res = await publish.mutate(rfqId);
      toast.success(res.message);
      navigate(`/buyer/rfqs/${rfqId}/matches`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loadingDraft) return <PageLoader />;

  const busy = save.loading || publish.loading;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">{t('rfq.createTitle')}</h1>
        <button
          type="button"
          onClick={() => navigate('/buyer/rfqs')}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-ink"
          aria-label={t('common.close')}
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-6 py-6">
        <Stepper steps={steps} current={step} onStepClick={(i) => i < step && setStep(i)} />
      </div>

      <div className="border-t border-line px-6 py-6">
        <div className={step === 0 ? 'grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]' : ''}>
          <div>
            {step === 0 && (
              <StepDetails
                form={form}
                setForm={setForm}
                errors={errors}
                categories={categories ?? []}
                subCategories={subCategories}
                reference={reference}
              />
            )}
            {step === 1 && (
              <StepItems
                form={form}
                setForm={setForm}
                errors={errors}
                units={reference?.units ?? []}
                newItem={emptyItem}
              />
            )}
            {step === 2 && (
              <StepSuppliers
                rfqId={savedId}
                invited={invited}
                setInvited={setInvited}
                strategy={strategy}
                setStrategy={setStrategy}
                reference={reference}
              />
            )}
            {step === 3 && (
              <StepReview
                form={form}
                categories={categories ?? []}
                subCategories={subCategories}
                invitedCount={invited.length}
                setForm={setForm}
              />
            )}
          </div>

          {step === 0 && (
            <div className="lg:sticky lg:top-24 lg:self-start">
              <RfqSummary form={form} categories={categories ?? []} subCategories={subCategories} />
              <div className="mt-4 space-y-2.5">
                <Button variant="soft" className="w-full" icon={Save} onClick={saveDraft} loading={save.loading}>
                  {t('rfq.saveDraft')}
                </Button>
                <Button className="w-full" iconEnd={ArrowRight} onClick={goNext} disabled={busy}>
                  {t('rfq.nextItems')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {step > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
          <Button variant="soft" icon={ArrowLeft} className="rtl-flip" onClick={() => setStep((s) => s - 1)}>
            <span className="rtl-flip">{t('rfq.back')}</span>
          </Button>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="soft" icon={Save} onClick={saveDraft} loading={save.loading}>
              {t('rfq.saveDraft')}
            </Button>
            {step < steps.length - 1 ? (
              <Button iconEnd={ArrowRight} onClick={goNext} loading={save.loading}>
                {step === 1 ? t('rfq.nextSuppliers') : t('rfq.nextReview')}
              </Button>
            ) : (
              <Button icon={Send} onClick={publishRfq} loading={publish.loading}>
                {t('rfq.publish')}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
