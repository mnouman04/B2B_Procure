import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { registerCompany, selectAuthError, selectAuthStatus } from '../../store/authSlice.js';
import { useApi } from '../../hooks/useApi.js';
import { catalogApi } from '../../api/endpoints.js';
import { AuthShell } from './AuthShell.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { toFieldErrors } from '../../utils/format.js';

const SIZES = ['1-50', '51-200', '201-500', '501-1000', '1000+'];

/** Company Registration — company details, commercial registration and sector. */
export const RegisterCompanyPage = () => {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const fieldErrors = toFieldErrors(error);

  const { data: reference } = useApi(() => catalogApi.reference(), []);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', jobTitle: 'Procurement Manager', password: '',
    company: {
      name: '', nameAr: '', crNumber: '', vatNumber: '', sector: 'Construction',
      size: '51-200', website: '', city: '', region: '', country: 'Saudi Arabia', address: '',
    },
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setCompany = (key) => (e) =>
    setForm((f) => ({ ...f, company: { ...f.company, [key]: e.target.value } }));

  const submit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerCompany(form));
    if (registerCompany.fulfilled.match(result)) navigate('/buyer', { replace: true });
  };

  return (
    <AuthShell title={t('auth.companyRegTitle')} subtitle={t('auth.companyRegSubtitle')} wide>
      <form onSubmit={submit} className="space-y-7">
        {error && !error.errors && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-[13px] text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error.message}
          </div>
        )}

        <section>
          <h3 className="mb-3.5 text-sm font-bold uppercase tracking-wide text-slate-500">
            {t('auth.companyDetails')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('auth.companyName')} required value={form.company.name}
              onChange={setCompany('name')} error={fieldErrors['company.name']}
              placeholder="Al Falah Construction Co."
            />
            <Input
              label={t('auth.companyNameAr')} value={form.company.nameAr}
              onChange={setCompany('nameAr')} dir="rtl" placeholder="شركة الفلاح للمقاولات"
            />
            <Input
              label={t('auth.crNumber')} required value={form.company.crNumber}
              onChange={setCompany('crNumber')} error={fieldErrors['company.crNumber']}
              placeholder="1010111222"
            />
            <Input
              label={t('auth.vatNumber')} value={form.company.vatNumber}
              onChange={setCompany('vatNumber')} placeholder="310101112200003"
            />
            <Select label={t('auth.sector')} required value={form.company.sector} onChange={setCompany('sector')}>
              {(reference?.sectors ?? ['Construction']).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Select label={t('auth.companySize')} value={form.company.size} onChange={setCompany('size')}>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Select
              label={t('auth.city')} required value={form.company.city}
              onChange={setCompany('city')} placeholder={t('auth.city')}
              error={fieldErrors['company.city']}
            >
              {(reference?.cities ?? []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Input label={t('auth.website')} value={form.company.website} onChange={setCompany('website')} placeholder="https://" />
          </div>
        </section>

        <section>
          <h3 className="mb-3.5 text-sm font-bold uppercase tracking-wide text-slate-500">
            {t('auth.accountDetails')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('auth.firstName')} required value={form.firstName} onChange={set('firstName')} error={fieldErrors.firstName} />
            <Input label={t('auth.lastName')} required value={form.lastName} onChange={set('lastName')} error={fieldErrors.lastName} />
            <Input label={t('auth.email')} type="email" required value={form.email} onChange={set('email')} error={fieldErrors.email} placeholder="you@company.sa" />
            <Input label={t('auth.phone')} required value={form.phone} onChange={set('phone')} error={fieldErrors.phone} placeholder="+966 50 000 0000" />
            <Input label={t('auth.jobTitle')} value={form.jobTitle} onChange={set('jobTitle')} />
            <Input
              label={t('auth.password')} type="password" required value={form.password}
              onChange={set('password')} error={fieldErrors.password}
              hint="At least 8 characters, including a letter and a number"
            />
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
