import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { registerSupplier, selectAuthError, selectAuthStatus } from '../../store/authSlice.js';
import { useApi } from '../../hooks/useApi.js';
import { catalogApi } from '../../api/endpoints.js';
import { AuthShell } from './AuthShell.jsx';
import { Input, Select, Textarea, Checkbox } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { toFieldErrors } from '../../utils/format.js';

/** "Join as Supplier" — creates the supplier org pending vendor verification. */
export const RegisterSupplierPage = () => {
  const { t, pick } = useI18n();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const fieldErrors = toFieldErrors(error);

  const { data: reference } = useApi(() => catalogApi.reference(), []);
  const { data: categories } = useApi(() => catalogApi.categories(), []);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', jobTitle: 'Sales Manager', password: '',
    supplier: {
      name: '', nameAr: '', crNumber: '', vatNumber: '', about: '',
      categories: [], city: '', region: '', country: 'Saudi Arabia',
      coverageAreas: [], foundedYear: '', employees: '', website: '',
    },
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setSupplier = (key) => (e) =>
    setForm((f) => ({ ...f, supplier: { ...f.supplier, [key]: e.target.value } }));

  const toggleList = (key, value) =>
    setForm((f) => {
      const list = f.supplier[key];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, supplier: { ...f.supplier, [key]: next } };
    });

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      supplier: {
        ...form.supplier,
        foundedYear: form.supplier.foundedYear || undefined,
        employees: form.supplier.employees || undefined,
        coverageAreas: form.supplier.coverageAreas.length
          ? form.supplier.coverageAreas
          : [form.supplier.city].filter(Boolean),
      },
    };
    const result = await dispatch(registerSupplier(payload));
    if (registerSupplier.fulfilled.match(result)) navigate('/supplier/verification', { replace: true });
  };

  return (
    <AuthShell title={t('auth.supplierRegTitle')} subtitle={t('auth.supplierRegSubtitle')} wide>
      <form onSubmit={submit} className="space-y-7">
        {error && !error.errors && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-[13px] text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error.message}
          </div>
        )}

        <section>
          <h3 className="mb-3.5 text-sm font-bold uppercase tracking-wide text-slate-500">
            {t('auth.supplierDetails')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('auth.companyName')} required value={form.supplier.name} onChange={setSupplier('name')} error={fieldErrors['supplier.name']} />
            <Input label={t('auth.companyNameAr')} value={form.supplier.nameAr} onChange={setSupplier('nameAr')} dir="rtl" />
            <Input label={t('auth.crNumber')} required value={form.supplier.crNumber} onChange={setSupplier('crNumber')} error={fieldErrors['supplier.crNumber']} />
            <Input label={t('auth.vatNumber')} value={form.supplier.vatNumber} onChange={setSupplier('vatNumber')} />
            <Select label={t('auth.city')} required value={form.supplier.city} onChange={setSupplier('city')} placeholder={t('auth.city')} error={fieldErrors['supplier.city']}>
              {(reference?.cities ?? []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Input label={t('auth.website')} value={form.supplier.website} onChange={setSupplier('website')} placeholder="https://" />
            <Input label={t('auth.foundedYear')} type="number" value={form.supplier.foundedYear} onChange={setSupplier('foundedYear')} placeholder="2010" />
            <Input label={t('auth.employees')} type="number" value={form.supplier.employees} onChange={setSupplier('employees')} placeholder="150" />
          </div>

          <Textarea
            className="mt-4"
            label={t('auth.about')}
            rows={3}
            value={form.supplier.about}
            onChange={setSupplier('about')}
          />

          <div className="mt-5">
            <p className="field-label">
              {t('auth.categories')} <span className="text-danger">*</span>
            </p>
            {fieldErrors['supplier.categories'] && (
              <p className="mb-2 text-xs font-medium text-danger">{fieldErrors['supplier.categories']}</p>
            )}
            <div className="grid gap-2.5 rounded-xl border border-line p-4 sm:grid-cols-2">
              {(categories ?? []).map((c) => (
                <Checkbox
                  key={c._id}
                  id={`cat-${c._id}`}
                  label={pick(c)}
                  checked={form.supplier.categories.includes(c._id)}
                  onChange={() => toggleList('categories', c._id)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="field-label">{t('auth.coverageAreas')}</p>
            <div className="flex flex-wrap gap-2">
              {(reference?.cities ?? []).map((city) => {
                const active = form.supplier.coverageAreas.includes(city);
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleList('coverageAreas', city)}
                    className={
                      active
                        ? 'rounded-full border border-navy-900 bg-navy-900 px-3 py-1.5 text-[13px] font-semibold text-white'
                        : 'rounded-full border border-line bg-white px-3 py-1.5 text-[13px] text-slate-600 transition hover:border-navy-300'
                    }
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3.5 text-sm font-bold uppercase tracking-wide text-slate-500">
            {t('auth.accountDetails')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('auth.firstName')} required value={form.firstName} onChange={set('firstName')} error={fieldErrors.firstName} />
            <Input label={t('auth.lastName')} required value={form.lastName} onChange={set('lastName')} error={fieldErrors.lastName} />
            <Input label={t('auth.email')} type="email" required value={form.email} onChange={set('email')} error={fieldErrors.email} />
            <Input label={t('auth.phone')} required value={form.phone} onChange={set('phone')} error={fieldErrors.phone} />
            <Input label={t('auth.jobTitle')} value={form.jobTitle} onChange={set('jobTitle')} />
            <Input label={t('auth.password')} type="password" required value={form.password} onChange={set('password')} error={fieldErrors.password} />
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full" loading={status === 'loading'}>
          {t('auth.createAccount')}
        </Button>

        <p className="text-center text-sm text-slate-500">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-info hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};
