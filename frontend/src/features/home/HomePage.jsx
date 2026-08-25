import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, ShieldCheck, Building2, FileCheck2, TrendingDown,
  BadgeCheck, Tag, Sparkles, Lock, Clock, BarChart3, ChevronDown, Boxes,
} from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { useApi } from '../../hooks/useApi.js';
import { analyticsApi, catalogApi, supplierApi } from '../../api/endpoints.js';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Misc.jsx';
import { SupplierTile } from '../../components/common/SupplierCard.jsx';
import { CATEGORY_ICONS } from './categoryIcons.js';
import { formatNumber } from '../../utils/format.js';

const FEATURES = [
  { key: 'verified', icon: ShieldCheck },
  { key: 'bestPrice', icon: Tag },
  { key: 'matching', icon: Sparkles },
  { key: 'secure', icon: Lock },
  { key: 'saveTime', icon: Clock },
  { key: 'data', icon: BarChart3 },
];

/**
 * The public landing page, rebuilt from the mockup:
 * navy hero over a city skyline → search bar with a category select and gold
 * search button → two CTAs → a white stats strip that overlaps the hero →
 * categories → top suppliers → supplier CTA → feature strip.
 */
export const HomePage = () => {
  const { t, pick } = useI18n();
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('');

  const { data: stats } = useApi(() => analyticsApi.platform(), []);
  const { data: categories, loading: catsLoading } = useApi(() => catalogApi.popularCategories(8), []);
  const { data: suppliers, loading: suppliersLoading } = useApi(() => supplierApi.topRated(4), []);

  const submitSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (term.trim()) params.set('q', term.trim());
    if (category) params.set('category', category);
    navigate(`/suppliers?${params.toString()}`);
  };

  const statItems = [
    { icon: ShieldCheck, label: t('home.stats.verifiedSuppliers'), value: `${formatNumber(stats?.verifiedSuppliers ?? 0)}+` },
    { icon: Building2, label: t('home.stats.companiesServed'), value: `${formatNumber(stats?.companiesServed ?? 0)}+` },
    { icon: FileCheck2, label: t('home.stats.rfqsCompleted'), value: `${formatNumber(stats?.rfqsCompleted ?? 0)}+` },
    { icon: TrendingDown, label: t('home.stats.averageSavings'), value: `${stats?.averageSavings ?? 0}%` },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy-900 pb-32 pt-[132px]">
        <div className="absolute inset-0" aria-hidden>
          <Skyline />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-900/92 via-navy-900/88 to-navy-900/96" />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-5 text-center">
          <h1 className="mx-auto max-w-3xl whitespace-pre-line text-balance text-[34px] font-extrabold leading-[1.18] tracking-tight text-white sm:text-[44px]">
            {t('home.heroTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-[15px] leading-relaxed text-white/80 sm:text-base">
            {t('home.heroSubtitle')}
          </p>

          <form
            onSubmit={submitSearch}
            className="mx-auto mt-8 flex max-w-[720px] overflow-hidden rounded-xl bg-white shadow-panel"
          >
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t('home.searchPlaceholder')}
              className="min-w-0 flex-1 px-5 py-4 text-sm text-ink placeholder:text-slate-400 focus:outline-none"
            />
            <div className="relative hidden border-s border-line sm:block">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-full appearance-none bg-transparent py-4 pe-9 ps-4 text-sm text-slate-600 focus:outline-none"
              >
                <option value="">{t('home.allCategories')}</option>
                {(categories ?? []).map((c) => (
                  <option key={c._id} value={c._id}>{pick(c)}</option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute inset-y-0 my-auto end-3.5 text-slate-400" />
            </div>
            <button
              type="submit"
              className="grid w-[64px] shrink-0 place-items-center bg-gold-400 text-navy-900 transition hover:bg-gold-500"
              aria-label={t('common.search')}
            >
              <Search size={20} />
            </button>
          </form>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button as={Link} to="/buyer/rfqs/new" size="lg" variant="gold" className="min-w-[210px]">
              {t('home.requestQuote')}
            </Button>
            <Button
              as={Link}
              to="/suppliers"
              size="lg"
              variant="outlineLight"
              className="min-w-[190px]"
            >
              {t('home.browseSuppliers')}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats strip overlapping the hero ─────────────────── */}
      <section className="relative z-10 mx-auto -mt-16 max-w-[1180px] px-5">
        <div className="card grid grid-cols-2 divide-line px-2 py-1 sm:grid-cols-4 sm:divide-x rtl:sm:divide-x-reverse">
          {statItems.map((s) => (
            <div key={s.label} className="flex items-center gap-3 px-4 py-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-navy-800">
                <s.icon size={19} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs text-slate-500">{s.label}</span>
                <span className="block text-lg font-extrabold tracking-tight text-ink">{s.value}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Popular categories ───────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-5 pt-14">
        <SectionHeading title={t('home.popularCategories')} to="/suppliers" label={t('home.viewAllCategories')} />

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {catsLoading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[112px]" />)
            : (categories ?? []).map((c) => {
                const Icon = CATEGORY_ICONS[c.icon] ?? Boxes;
                return (
                  <Link
                    key={c._id}
                    to={`/suppliers?category=${c._id}`}
                    className="card flex flex-col items-center justify-center gap-2.5 px-2 py-5 text-center transition hover:border-navy-200 hover:shadow-lift"
                  >
                    <Icon size={26} strokeWidth={1.5} className="text-navy-800" />
                    <span className="text-[11.5px] font-medium leading-tight text-slate-600">{pick(c)}</span>
                  </Link>
                );
              })}
          <Link
            to="/suppliers"
            className="card flex flex-col items-center justify-center gap-2.5 px-2 py-5 text-center transition hover:border-navy-200 hover:shadow-lift"
          >
            <Boxes size={26} strokeWidth={1.5} className="text-navy-800" />
            <span className="text-[11.5px] font-medium leading-tight text-slate-600">{t('home.allCategories')}</span>
          </Link>
        </div>
      </section>

      {/* ── Top rated suppliers ──────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-5 pt-12">
        <SectionHeading title={t('home.topRatedSuppliers')} to="/suppliers" label={t('home.viewAllSuppliers')} />

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {suppliersLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[178px]" />)
            : (suppliers ?? []).map((s) => <SupplierTile key={s._id} supplier={s} />)}
        </div>
      </section>

      {/* ── Supplier CTA band ────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-5 pt-12">
        <div className="flex flex-wrap items-center gap-5 rounded-card bg-navy-900 px-6 py-7">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gold-400/40 text-gold-400">
            <Boxes size={22} />
          </span>
          <div className="min-w-[220px] flex-1">
            <p className="text-lg font-bold text-white">{t('home.supplierCtaTitle')}</p>
            <p className="mt-1 text-sm text-white/70">{t('home.supplierCtaBody')}</p>
          </div>
          <Button as={Link} to="/register/supplier" variant="soft" iconEnd={ArrowRight}>
            {t('home.joinAsSupplier')}
          </Button>
        </div>
      </section>

      {/* ── Feature strip ────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-5 py-14">
        <div className="card grid gap-x-6 gap-y-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, icon: Icon }) => (
            <div key={key} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-navy-800">
                <Icon size={18} />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">{t(`home.features.${key}.title`)}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">
                  {t(`home.features.${key}.body`)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

const SectionHeading = ({ title, to, label }) => (
  <div className="flex items-end justify-between gap-4">
    <h2 className="text-xl font-extrabold tracking-tight text-ink">{title}</h2>
    <Link to={to} className="inline-flex items-center gap-1 text-[13px] font-semibold text-info hover:text-blue-800">
      {label}
      <ArrowRight size={14} className="rtl-flip" />
    </Link>
  </div>
);

/** Decorative skyline behind the hero — drawn inline so nothing is fetched. */
const Skyline = () => (
  <svg
    viewBox="0 0 1440 460"
    preserveAspectRatio="xMidYMax slice"
    className="absolute inset-0 h-full w-full"
    aria-hidden
  >
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#122347" />
        <stop offset="100%" stopColor="#050D1E" />
      </linearGradient>
      <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1B3260" />
        <stop offset="100%" stopColor="#0A1730" />
      </linearGradient>
    </defs>
    <rect width="1440" height="460" fill="url(#sky)" />
    {[
      [40, 300, 70], [120, 250, 55], [186, 330, 64], [262, 200, 48], [322, 288, 78],
      [412, 232, 52], [476, 318, 60], [548, 176, 44], [604, 268, 86], [702, 214, 50],
      [764, 306, 72], [848, 244, 58], [918, 190, 46], [976, 292, 80], [1068, 236, 54],
      [1134, 322, 66], [1212, 208, 50], [1274, 280, 74], [1360, 250, 60],
    ].map(([x, h, w], i) => (
      <g key={x}>
        <rect x={x} y={460 - h} width={w} height={h} fill="url(#tower)" opacity={0.9} />
        {Array.from({ length: Math.floor(h / 34) }).map((_, r) => (
          <rect
            key={r}
            x={x + 8}
            y={460 - h + 16 + r * 34}
            width={w - 16}
            height={7}
            fill="#E9C46A"
            opacity={(i + r) % 3 === 0 ? 0.28 : 0.1}
          />
        ))}
      </g>
    ))}
    {/* A slender landmark tower, echoing the skyline in the mockup. */}
    <path d="M660 460V150l22-96 22 96v310Z" fill="url(#tower)" opacity="0.95" />
  </svg>
);
