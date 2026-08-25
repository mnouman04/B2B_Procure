import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { Logo } from '../../components/layout/Logo.jsx';

/**
 * Split auth layout: the navy brand panel on one side (mirrored in RTL),
 * the form on the other.
 */
export const AuthShell = ({ title, subtitle, children, wide = false, footer }) => {
  const { t } = useI18n();

  const points = [
    { icon: ShieldCheck, key: 'verified' },
    { icon: Sparkles, key: 'matching' },
    { icon: TrendingDown, key: 'bestPrice' },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,44%)_minmax(0,56%)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-10 lg:flex">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #E9C46A 0, transparent 45%), radial-gradient(circle at 80% 70%, #5C74AC 0, transparent 45%)',
          }}
          aria-hidden
        />
        <Link to="/" className="relative">
          <Logo theme="dark" size="lg" />
        </Link>

        <div className="relative">
          <h2 className="max-w-sm whitespace-pre-line text-[30px] font-extrabold leading-tight tracking-tight text-white">
            {t('home.heroTitle')}
          </h2>
          <ul className="mt-8 space-y-5">
            {points.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold-400/35 text-gold-400">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{t(`home.features.${key}.title`)}</span>
                  <span className="mt-0.5 block text-[13px] text-white/65">{t(`home.features.${key}.body`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/45">
          © {new Date().getFullYear()} {t('brand.name')}
        </p>
      </aside>

      <div className="flex flex-col overflow-y-auto bg-white">
        <div className="flex justify-between p-5 lg:justify-end">
          <Link to="/" className="lg:hidden">
            <Logo theme="light" showTagline={false} size="sm" />
          </Link>
          <LanguageToggle />
        </div>

        <div className="flex flex-1 items-start justify-center px-5 pb-12">
          <div className={wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}>
            <h1 className="text-[26px] font-extrabold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-6">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const LanguageToggle = () => {
  const { t, toggleLocale } = useI18n();
  return (
    <button
      type="button"
      onClick={toggleLocale}
      className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50"
    >
      {t('common.language')}
    </button>
  );
};
