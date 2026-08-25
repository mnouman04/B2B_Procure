import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { Button } from '../../components/ui/Button.jsx';

const Shell = ({ title, subtitle, children }) => (
  <div className="mx-auto max-w-[1000px] px-5 py-16">
    <h1 className="text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
    {subtitle && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">{subtitle}</p>}
    <div className="mt-10">{children}</div>
  </div>
);

/** "How It Works" — the four-step flow described in the brief. */
export const HowItWorksPage = () => {
  const { t } = useI18n();
  const steps = t('home.howItWorksSteps');

  return (
    <Shell title={t('nav.howItWorks')} subtitle={t('home.heroSubtitle').replace('\n', ' ')}>
      <ol className="grid gap-5 sm:grid-cols-2">
        {steps.map((step, i) => (
          <li key={step.title} className="card flex gap-4 p-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-400 text-[15px] font-extrabold text-navy-900">
              {i + 1}
            </span>
            <span>
              <span className="block text-[15px] font-bold text-ink">{step.title}</span>
              <span className="mt-1.5 block text-sm leading-relaxed text-slate-600">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button as={Link} to="/register" variant="primary" size="lg" iconEnd={ArrowRight}>
          {t('auth.registerCompany')}
        </Button>
        <Button as={Link} to="/register/supplier" variant="soft" size="lg">
          {t('home.joinAsSupplier')}
        </Button>
      </div>
    </Shell>
  );
};

export const ForBuyersPage = () => {
  const { t } = useI18n();
  const points = ['verified', 'bestPrice', 'matching', 'secure', 'saveTime', 'data'];

  return (
    <Shell title={t('nav.forBuyers')} subtitle={t('home.heroSubtitle').replace('\n', ' ')}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {points.map((key) => (
          <li key={key} className="card flex gap-3 p-5">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
            <span>
              <span className="block font-bold text-ink">{t(`home.features.${key}.title`)}</span>
              <span className="mt-1 block text-sm text-slate-600">{t(`home.features.${key}.body`)}</span>
            </span>
          </li>
        ))}
      </ul>
      <Button as={Link} to="/register" variant="primary" size="lg" className="mt-8" iconEnd={ArrowRight}>
        {t('auth.registerCompany')}
      </Button>
    </Shell>
  );
};

/**
 * Pricing. The brief leaves the payer undecided, so the page states the three
 * candidate models rather than inventing final numbers.
 */
export const PricingPage = () => {
  const { t } = useI18n();

  const plans = [
    {
      name: 'Buyer subscription',
      price: 'From SAR 2,500 / month',
      body: 'Unlimited RFQs, supplier matching, comparison and procurement analytics for the buying company.',
      features: ['Unlimited RFQs', 'Smart supplier matching', 'Quotation comparison', 'Procurement analytics'],
      highlight: false,
    },
    {
      name: 'Supplier membership',
      price: 'From SAR 900 / month',
      body: 'Receive genuine purchase requests from verified buyers instead of paying for outbound marketing.',
      features: ['Verified supplier badge', 'RFQ invitations', 'Product catalogue', 'Performance reports'],
      highlight: true,
    },
    {
      name: 'Transaction commission',
      price: '2% per awarded order',
      body: 'Pay only when a purchase order is issued through the platform. No fixed monthly fee.',
      features: ['No monthly fee', 'Charged on awarded POs only', 'Full platform access', 'Escrow-ready'],
      highlight: false,
    },
  ];

  return (
    <Shell
      title={t('nav.pricing')}
      subtitle="Three commercial models are supported by the platform. The one you enable defines the business model."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={
              plan.highlight
                ? 'card border-navy-900 p-6 ring-1 ring-navy-900'
                : 'card p-6'
            }
          >
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{plan.name}</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{plan.price}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{plan.body}</p>
            <ul className="mt-5 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={16} className="shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Shell>
  );
};

export const NotFoundPage = () => {
  const { t } = useI18n();
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-5 text-center">
      <div>
        <p className="text-6xl font-extrabold tracking-tight text-navy-900">404</p>
        <p className="mt-3 text-lg font-bold text-ink">{t('common.error')}</p>
        <Button as={Link} to="/" variant="primary" className="mt-6">
          {t('common.back')}
        </Button>
      </div>
    </div>
  );
};
