import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { login, selectAuthError, selectAuthStatus } from '../../store/authSlice.js';
import { workspaceHome } from '../../app/routes.js';
import { AuthShell } from './AuthShell.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';

const DEMO = [
  { role: 'Buyer', email: 'buyer@procurio.sa' },
  { role: 'Supplier', email: 'supplier1@procurio.sa' },
  { role: 'Admin', email: 'admin@procurio.sa' },
];
const DEMO_PASSWORD = 'Procurio2026';

export const LoginPage = () => {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  const [form, setForm] = useState({ email: '', password: '' });

  const submit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      const target = location.state?.from?.pathname || workspaceHome(result.payload.role);
      navigate(target, { replace: true });
    }
  };

  return (
    <AuthShell
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <div className="rounded-xl border border-line bg-slate-50 p-4">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            {t('auth.demoAccounts')}
          </p>
          <div className="space-y-1.5">
            {DEMO.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => setForm({ email: d.email, password: DEMO_PASSWORD })}
                className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-start text-[13px] transition hover:bg-navy-50"
              >
                <span className="font-semibold text-ink">{d.role}</span>
                <span className="text-slate-500">{d.email}</span>
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400">Password: {DEMO_PASSWORD}</p>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-[13px] text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error.message}
          </div>
        )}

        <Input
          id="email"
          type="email"
          label={t('auth.email')}
          icon={Mail}
          required
          autoComplete="email"
          placeholder="you@company.sa"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          id="password"
          type="password"
          label={t('auth.password')}
          icon={Lock}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <Button type="submit" size="lg" className="w-full" loading={status === 'loading'}>
          {t('auth.signIn')}
        </Button>
      </form>

      <div className="mt-6 space-y-1.5 text-center text-sm">
        <p className="text-slate-500">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-info hover:underline">
            {t('auth.registerCompany')}
          </Link>
        </p>
        <p className="text-slate-500">
          <Link to="/register/supplier" className="font-semibold text-info hover:underline">
            {t('auth.registerSupplier')}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};
